#!/usr/bin/env python3
"""
Stage server profiles so the Move a server action has something to move.

A server can only be moved when its NetBox-cabled leaf ports have VLAN bindings in
the data model. A freshly seeded lab has bindings on just a few LAB-LEAF1 ports, so
this script gives a set of servers spread across every row and leaf a realistic
profile, and opens one pull request for it:

    eth0  data  - one or two tagged (regular) VLANs
    eth1  mgmt  - MGMT-EPG (VLAN 30), plus Backup-EPG as native on backup servers

Run it from inside the portal container (so it shares the portal's NaC API and
NetBox settings), then merge the pull request it prints:

    docker compose exec nac-aci-gui .venv/bin/python scripts/stage_move_test_data.py

It is safe to re-run: ports that already have bindings, or that an open pull
request already changes, are skipped.
"""

import argparse
import re
import sys

from nac_aci_gui.change_request import ChangeRequest, send_change_request
from nac_aci_gui.nac_api import get_nac_client
from nac_aci_gui.netbox_api import get_netbox_client

TENANT = 'NIAID_Lab_Testing'
APP_PROFILE = 'NIAID_Lab_AppProf'

# Profile by server role (the NetBox name prefix). Each entry is (EPG, VLAN, mode).
PROFILES = {
    'web': {'eth0': [('TEST-EPG-1', 10, 'regular')],
            'eth1': [('MGMT-EPG', 30, 'regular')]},
    'app': {'eth0': [('TEST-EPG-1', 10, 'regular'), ('Monitoring-EPG', 31, 'regular')],
            'eth1': [('MGMT-EPG', 30, 'regular')]},
    'db':  {'eth0': [('TEST-EPG-1', 10, 'regular')],
            'eth1': [('MGMT-EPG', 30, 'regular'), ('Monitoring-EPG', 31, 'regular')]},
    'esx': {'eth0': [('TEST-EPG-1', 10, 'regular'), ('Monitoring-EPG', 31, 'regular')],
            'eth1': [('MGMT-EPG', 30, 'regular'), ('Backup-EPG', 32, 'regular')]},
    'hpc': {'eth0': [('TEST-EPG-1', 10, 'regular')],
            'eth1': [('MGMT-EPG', 30, 'regular')]},
    'bkp': {'eth0': [('Backup-EPG', 32, 'native')],
            'eth1': [('MGMT-EPG', 30, 'regular')]},
}


def ports_in_open_pull_requests(client) -> set:
    """Leaf ports that open pull requests already add bindings to, so staging doesn't collide."""
    import requests
    owner_repo = client.repository_url
    claimed = set()
    try:
        pulls = requests.get(f"{client.scm_api_url.rstrip('/')}/repos/{owner_repo}/pulls",
                             params={'state': 'open', 'per_page': 100},
                             headers={'Authorization': f'token {client.api_key}'}, timeout=30).json()
        for pr in pulls:
            diff = requests.get(pr['url'], headers={'Authorization': f'token {client.api_key}',
                                                    'Accept': 'application/vnd.github.diff'}, timeout=30).text
            claimed.update((int(n), int(m), int(p)) for n, m, p in re.findall(
                r'\+\s+- node_id: (\d+)\n\+\s+module: (\d+)\n\+\s+port: (\d+)', diff))
    except Exception as e:  # staging still works without this; it's a collision guard
        print(f"  ! could not check open pull requests ({e}); continuing")
    return claimed


def pick_servers(netbox, per_leaf: int, exclude: set) -> list:
    """Choose up to per_leaf servers on each leaf, cycling roles so every leaf gets a mix."""
    by_leaf = {}
    connections = netbox.get_all_server_connections() or {}
    for server in netbox.get_servers() or []:
        conns = {c['interface']: c for c in connections.get(server['id'], []) if c['node_id'] and c['port']}
        if server['name'] in exclude or set(conns) < {'eth0', 'eth1'}:
            continue
        role = server['name'].split('-')[1]
        if role in PROFILES:
            by_leaf.setdefault(conns['eth0']['node_id'], []).append((server, role, conns))

    chosen = []
    for node_id in sorted(by_leaf):
        seen_roles = set()
        for server, role, conns in sorted(by_leaf[node_id], key=lambda x: x[0]['name']):
            if len([c for c in chosen if c[2]['eth0']['node_id'] == node_id]) >= per_leaf:
                break
            if role not in seen_roles:
                seen_roles.add(role)
                chosen.append((server, role, conns))
    return chosen


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    parser.add_argument('--per-leaf', type=int, default=3, help='servers to stage on each leaf (default 3)')
    parser.add_argument('--exclude', nargs='*', default=[], help='server names to leave untouched')
    parser.add_argument('--dry-run', action='store_true', help='show the plan without opening a pull request')
    args = parser.parse_args()

    client, netbox = get_nac_client(), get_netbox_client()
    bound = client.get_bound_ports() or set()
    claimed = ports_in_open_pull_requests(client)

    edits, staged, details = [], [], []
    for server, role, conns in pick_servers(netbox, args.per_leaf, set(args.exclude)):
        server_edits = []
        for nic, bindings in PROFILES[role].items():
            c = conns[nic]
            key = (c['node_id'], c['module'], c['port'])
            if key in bound or key in claimed:
                continue
            # The port's access policy (AAEP) must carry every EPG in the profile
            allowed = client.get_available_epgs_for_port(*key) or {}
            allowed_epgs = {e['endpoint_group'] for e in allowed.get('available', [])}
            if not all(epg in allowed_epgs for epg, _, _ in bindings):
                continue
            server_edits.append({
                'interface': f"{server['name']} {nic}",
                'port': {'node_id': c['node_id'], 'module': c['module'], 'port': c['port']},
                'add': [{'tenant': TENANT, 'application_profile': APP_PROFILE, 'endpoint_group': epg,
                         'vlan': vlan, 'mode': mode} for epg, vlan, mode in bindings],
                'remove': [],
            })
        # Only stage a server when all of its NICs are free, so each staged profile is complete
        if len(server_edits) == len(PROFILES[role]):
            edits += server_edits
            vlans = '; '.join(f"{e['interface'].split()[-1]}: " + ', '.join(str(b['vlan']) for b in e['add'])
                              for e in server_edits)
            staged.append(f"| {server['name']} | {server['row']}, Rack {server['rack']} | "
                          f"{conns['eth0']['leaf']} | {vlans} |")
            details.append((server['name'], f"{server['row']}, Rack {server['rack']} on {conns['eth0']['leaf']}: {vlans}"))

    if not edits:
        sys.exit("Nothing to stage: every candidate server already has VLANs or is in an open pull request")

    plan = client.plan_port_edits(edits)
    print(f"Staging {len(staged)} servers ({len(edits)} ports):")
    print('\n'.join(staged))
    if plan['errors']:
        sys.exit("Cannot stage:\n  " + '\n  '.join(plan['errors']))
    if args.dry_run:
        print("Dry run: no pull request opened")
        return

    title = f"Stage server profiles for Move testing ({len(staged)} servers)"
    body = ("## Staged Server Profiles\n\n"
            "Gives demo servers across every row and leaf a VLAN profile so the portal's "
            "**Move a server** action has servers to move.\n\n"
            "| Server | Location | Leaf | VLANs |\n|---|---|---|---|\n" + '\n'.join(staged) +
            "\n\nGenerated by `scripts/stage_move_test_data.py`.")
    response = client.batch_operation(plan['changes'], apply=False, apply_title=title, apply_message=body)
    if not response:
        sys.exit("Failed to open the pull request through NaC API")

    url = client.get_pull_request_url(response)
    result = send_change_request(ChangeRequest(action='Stage Move Test Data', summary=title,
                                               details=details, pull_request_url=url))
    print(f"Pull request: {url or response}")
    print(f"Change request email: {result.message}")


if __name__ == '__main__':
    main()
