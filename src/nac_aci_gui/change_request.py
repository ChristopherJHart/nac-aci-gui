"""
Change request notifications

Every portal action that opens a pull request also emails a change request
mailing list. In production that list feeds an ITSM intake (for example, a
ServiceNow inbound email action that raises a change request), so the subject
and body carry everything needed to identify the requested change.

Settings come from environment variables only, so credentials never live in
the repository or in yaml/config.yaml:

    SMTP_HOST                   SMTP relay host
    SMTP_PORT                   SMTP relay port (default 25)
    SMTP_USERNAME               Account used to authenticate to the relay
    SMTP_PASSWORD               Password for SMTP_USERNAME
    CHANGE_REQUEST_EMAIL_TO     Recipient list, comma separated
    CHANGE_REQUEST_EMAIL_FROM   Sender address (defaults to SMTP_USERNAME)

The connection is always upgraded with STARTTLS (TLS 1.2 or later, with
certificate verification) before authenticating, so credentials are never sent
in plaintext. When SMTP_HOST or CHANGE_REQUEST_EMAIL_TO is unset, notifications
are disabled and actions behave exactly as before.
"""
import html
import logging
import os
import smtplib
import ssl
from dataclasses import dataclass, field
from datetime import datetime, timezone
from email.message import EmailMessage
from email.utils import make_msgid
from typing import Optional

logger = logging.getLogger(__name__)


@dataclass
class ChangeRequest:
    """A change requested through the portal, described for an ITSM intake."""

    action: str
    summary: str
    details: list[tuple[str, str]] = field(default_factory=list)
    pull_request_url: Optional[str] = None
    requested_by: Optional[str] = None


@dataclass
class NotificationResult:
    """Outcome of sending a change request email."""

    sent: bool
    message: str
    recipients: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {'sent': self.sent, 'message': self.message, 'recipients': self.recipients}


def _settings() -> dict:
    username = os.getenv('SMTP_USERNAME', '')
    return {
        'host': os.getenv('SMTP_HOST', ''),
        'port': int(os.getenv('SMTP_PORT', '25')),
        'username': username,
        'password': os.getenv('SMTP_PASSWORD', ''),
        'to': [a.strip() for a in os.getenv('CHANGE_REQUEST_EMAIL_TO', '').split(',') if a.strip()],
        'from': os.getenv('CHANGE_REQUEST_EMAIL_FROM', '') or username,
    }


INTRO = 'A network change has been requested through the NaC ACI self-service portal.'
STAGED_NOTE = ('The change is staged as a pull request against the Network as Code data model '
               'and will not be applied to the fabric until that pull request is reviewed and merged.')
FOOTER = 'This message was generated automatically by the NaC ACI GUI.'


def _fields(change: ChangeRequest, submitted: str) -> list[tuple[str, str]]:
    return [
        ('Action', change.action),
        *change.details,
        ('Requested By', change.requested_by or 'Portal user (not signed in)'),
        ('Submitted', submitted),
        ('Pull Request', change.pull_request_url or 'Not available'),
    ]


def _text_body(change: ChangeRequest, submitted: str) -> str:
    """Plain-text body; ITSM inbound email parsers usually read this part."""
    fields = _fields(change, submitted)
    width = max(len(label) for label, _ in fields)
    return '\n'.join([
        INTRO,
        '',
        'CHANGE DETAILS',
        '--------------',
        *(f"{label + ':':<{width + 1}} {value}" for label, value in fields),
        '',
        STAGED_NOTE,
        '',
        FOOTER,
    ])


def _html_body(change: ChangeRequest, submitted: str) -> str:
    """
    HTML body for people reading the email

    Uses tables and inline styles only, because mail clients (Outlook in particular)
    ignore stylesheets and most modern CSS.
    """
    esc = html.escape
    font = "font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;"

    rows = []
    for i, (label, value) in enumerate([('Action', change.action), *change.details,
                                        ('Requested By', change.requested_by or 'Portal user (not signed in)'),
                                        ('Submitted', submitted)]):
        shade = '#f6f8fa' if i % 2 == 0 else '#ffffff'
        rows.append(
            f'<tr style="background:{shade};">'
            f'<td style="{font}padding:8px 12px;font-size:13px;color:#57606a;font-weight:600;'
            f'white-space:nowrap;width:1%;border-bottom:1px solid #eaeef2;">{esc(str(label))}</td>'
            f'<td style="{font}padding:8px 12px;font-size:14px;color:#1f2328;'
            f'border-bottom:1px solid #eaeef2;">{esc(str(value))}</td></tr>'
        )

    if change.pull_request_url:
        url = esc(change.pull_request_url, quote=True)
        number = change.pull_request_url.rstrip('/').rsplit('/', 1)[-1]
        label = f'Review pull request #{esc(number)}' if number.isdigit() else 'Review pull request'
        pull_request = (
            f'<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;">'
            f'<tr><td style="background:#0d6efd;border-radius:6px;">'
            f'<a href="{url}" style="{font}display:inline-block;padding:11px 22px;font-size:14px;'
            f'font-weight:600;color:#ffffff;text-decoration:none;">{label} &rarr;</a></td></tr></table>'
            f'<p style="{font}margin:0;font-size:12px;color:#57606a;word-break:break-all;">'
            f'<a href="{url}" style="color:#0969da;">{url}</a></p>'
        )
    else:
        pull_request = (f'<p style="{font}margin:24px 0 0;font-size:13px;color:#57606a;">'
                        f'Pull request: not available</p>')

    return f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(change.summary)}</title></head>
<body style="margin:0;padding:0;background:#f0f2f5;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
       style="max-width:640px;background:#ffffff;border:1px solid #d0d7de;border-radius:8px;">
  <tr><td style="background:#049fd9;padding:18px 24px;border-radius:8px 8px 0 0;">
    <p style="{font}margin:0;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#e6f6fc;">
      Network Change Request</p>
    <p style="{font}margin:4px 0 0;font-size:18px;line-height:1.35;font-weight:600;color:#ffffff;">
      {esc(change.summary)}</p>
  </td></tr>
  <tr><td style="padding:24px;">
    <p style="{font}margin:0 0 16px;font-size:14px;line-height:1.5;color:#1f2328;">{esc(INTRO)}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="border:1px solid #eaeef2;border-radius:6px;border-collapse:separate;">
      {''.join(rows)}
    </table>
    {pull_request}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
      <tr><td style="{font}background:#fff8c5;border:1px solid #d4a72c;border-radius:6px;padding:12px 14px;
                     font-size:13px;line-height:1.5;color:#3d2e00;">
        <strong>Not yet applied.</strong> {esc(STAGED_NOTE)}</td></tr>
    </table>
  </td></tr>
  <tr><td style="{font}padding:14px 24px;border-top:1px solid #eaeef2;font-size:12px;color:#57606a;">
    {esc(FOOTER)}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>"""


def build_message(change: ChangeRequest, sender: str, recipients: list[str]) -> EmailMessage:
    """
    Build the change request email

    The message is multipart/alternative: a plain-text part (for ITSM parsers and
    text-only clients) and an HTML part (for people), carrying the same fields.
    """
    submitted = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')

    message = EmailMessage()
    message['Subject'] = f"[Network Change Request] {change.summary}"
    message['From'] = sender
    message['To'] = ', '.join(recipients)
    message['Message-ID'] = make_msgid(domain=sender.split('@')[-1] if '@' in sender else None)
    message.set_content(_text_body(change, submitted))
    message.add_alternative(_html_body(change, submitted), subtype='html')
    return message


def send_change_request(change: ChangeRequest) -> NotificationResult:
    """
    Email a change request to the configured mailing list

    Never raises: failures are logged and reported in the result so the caller
    can warn the user while keeping the pull request that was already created.
    """
    settings = _settings()
    if not settings['host'] or not settings['to']:
        return NotificationResult(False, 'Change request email is not configured')
    if not settings['from']:
        return NotificationResult(False, 'Change request email has no sender (set CHANGE_REQUEST_EMAIL_FROM)')

    message = build_message(change, settings['from'], settings['to'])
    context = ssl.create_default_context()
    context.minimum_version = ssl.TLSVersion.TLSv1_2

    try:
        with smtplib.SMTP(settings['host'], settings['port'], timeout=30) as smtp:
            smtp.ehlo()
            smtp.starttls(context=context)
            smtp.ehlo()
            if settings['username']:
                smtp.login(settings['username'], settings['password'])
            smtp.send_message(message)
    except (smtplib.SMTPException, ssl.SSLError, OSError) as e:
        logger.error(f"Failed to send change request email for '{change.summary}': {e}")
        return NotificationResult(False, f'SMTP error: {e}', settings['to'])

    logger.info(f"Change request email sent to {', '.join(settings['to'])}: {message['Subject']}")
    return NotificationResult(True, 'Change request email sent', settings['to'])


def current_requester() -> Optional[str]:
    """Describe the signed-in portal user, if any, for the Requested By field."""
    try:
        from flask_login import current_user
        if current_user and current_user.is_authenticated:
            name = getattr(current_user, 'full_name', '') or current_user.username
            email = getattr(current_user, 'email', '')
            return f"{name} <{email}>" if email else name
    except Exception:
        pass
    return None
