#!/usr/bin/env python3
"""
Sync NetBox IPAM with the subnets the ACI data model routes.

For every routed bridge domain (unicast routing on, the APIC default) with a
gateway subnet, and every EPG that uses that bridge domain and is bound to a VLAN
through an AAEP, this ensures NetBox has:

- a tenant matching the ACI tenant
- a VRF named "<tenant>/<vrf>" for the bridge domain's VRF. A VRF the tenant doesn't
  define itself resolves to tenant common, as it does on the APIC
- the VLAN in the VLAN group, assigned to the tenant
- the subnet's network as a prefix in that VRF, linked to the VLAN, with role
  "ACI Bridge Domain"
- the gateway address as an anycast IP address

Nothing is made up: every value comes from the data model, read through nac-api the
same way the portal reads it. Re-running is safe; objects are matched by their
natural keys and only changed when they differ. Prefixes with the same network in
another VRF are not touched.

Run it from inside the portal container, so it shares the portal's NaC API and
NetBox settings:

    docker compose exec nac-aci-gui .venv/bin/python scripts/sync_netbox_ipam.py --dry-run
    docker compose exec nac-aci-gui .venv/bin/python scripts/sync_netbox_ipam.py
"""

import argparse
import ipaddress
import re
import sys

from nac_aci_gui.nac_api import get_nac_client
from nac_aci_gui.netbox_api import get_netbox_client

VLAN_GROUP_SLUG = 'demo-app-profile'
PREFIX_ROLE_SLUG = 'aci-bridge-domain'


def slugify(value: str) -> str:
    return re.sub(r'[^a-z0-9_-]+', '-', value.lower()).strip('-')


def routed_subnets(data_model: dict) -> list:
    """
    Every (tenant, VRF, BD, EPG, VLAN, gateway) the data model routes

    The EPG to VLAN mapping comes from the AAEPs' EPG bindings, which is where the
    portal gets the VLAN for each EPG, too.
    """
    apic = data_model.get('apic', {})
    defaults_routing = True  # unicast_routing defaults to true in the NaC ACI defaults

    epg_vlans = {}
    for aaep in apic.get('access_policies', {}).get('aaeps', []) or []:
        for binding in aaep.get('endpoint_groups', []) or []:
            key = (binding.get('tenant'), binding.get('application_profile'), binding.get('endpoint_group'))
            epg_vlans.setdefault(key, set()).add(binding.get('vlan'))

    results = []
    for tenant in apic.get('tenants', []) or []:
        tenant_vrfs = {v['name'] for v in tenant.get('vrfs', []) or []}
        bds = {bd['name']: bd for bd in tenant.get('bridge_domains', []) or []}
        for ap in tenant.get('application_profiles', []) or []:
            for epg in ap.get('endpoint_groups', []) or []:
                bd = bds.get(epg.get('bridge_domain'))
                vlans = epg_vlans.get((tenant['name'], ap['name'], epg['name']))
                if not bd or not vlans or not bd.get('unicast_routing', defaults_routing):
                    continue
                vrf = bd.get('vrf')
                vrf_owner = tenant['name'] if vrf in tenant_vrfs else 'common'
                for subnet in bd.get('subnets', []) or []:
                    gateway = ipaddress.ip_interface(subnet['ip'])
                    for vlan in sorted(v for v in vlans if v):
                        results.append({
                            'tenant': tenant['name'], 'vrf': f"{vrf_owner}/{vrf}", 'bridge_domain': bd['name'],
                            'epg': epg['name'], 'vlan': vlan, 'gateway': str(gateway),
                            'network': str(gateway.network),
                        })
    return results


def sync(nb, subnets: list, dry_run: bool) -> list:
    """Ensure each routed subnet is modelled in NetBox; returns a list of changes made (or planned)."""
    changes = []

    def ensure(endpoint, lookup, data, label):
        existing = nb.get(f'/api/{endpoint}', params={**lookup, 'limit': 2})
        results = (existing or {}).get('results', [])
        if len(results) > 1:
            raise RuntimeError(f"More than one {endpoint} matches {lookup}")
        current = results[0] if results else None
        if current is None:
            changes.append(f"+ {label}")
            return {'id': None} if dry_run else nb.post(f'/api/{endpoint}', data)
        diff = {k: v for k, v in data.items() if _differs(current.get(k), v)}
        if diff:
            changes.append(f"~ {label} ({', '.join(diff)})")
            if not dry_run:
                return nb.patch(f"/api/{endpoint}{current['id']}/", diff)
        return current

    group = nb.get('/api/ipam/vlan-groups/', params={'slug': VLAN_GROUP_SLUG})['results']
    role = nb.get('/api/ipam/roles/', params={'slug': PREFIX_ROLE_SLUG})['results']
    if not group:
        sys.exit(f"VLAN group '{VLAN_GROUP_SLUG}' not found in NetBox")
    group_id, role_id = group[0]['id'], role[0]['id'] if role else None

    tenants, vrfs = {}, {}
    for s in subnets:
        if s['tenant'] not in tenants:
            tenants[s['tenant']] = ensure('tenancy/tenants/', {'slug': slugify(s['tenant'])},
                                          {'name': s['tenant'], 'slug': slugify(s['tenant'])}, f"tenant {s['tenant']}")
        tenant_id = tenants[s['tenant']]['id']
        if s['vrf'] not in vrfs:
            vrfs[s['vrf']] = ensure('ipam/vrfs/', {'name': s['vrf']},
                                    {'name': s['vrf'], 'description': f"ACI VRF {s['vrf']}"}, f"VRF {s['vrf']}")
        vrf_id = vrfs[s['vrf']]['id']

        # VLANs are matched by group and VID. A VLAN NetBox already names (e.g. MGMT-Net) keeps its
        # name; one with no name of its own is named after its EPG, as the data model has no VLAN name
        existing = nb.get('/api/ipam/vlans/', params={'group_id': group_id, 'vid': s['vlan']})['results']
        keep_name = existing and not existing[0]['name'].startswith('TEST-Net-')
        vlan = ensure('ipam/vlans/', {'group_id': group_id, 'vid': s['vlan']},
                      {'vid': s['vlan'], 'group': group_id, 'status': 'active', 'tenant': tenant_id,
                       **({} if keep_name else {'name': f"{s['epg']}-VLAN{s['vlan']}"})},
                      f"VLAN {s['vlan']}")
        description = f"{s['bridge_domain']} gateway {s['gateway']} ({s['tenant']}/{s['epg']})"
        ensure('ipam/prefixes/', {'prefix': s['network'], 'vrf_id': vrf_id},
               {'prefix': s['network'], 'vrf': vrf_id, 'vlan': vlan['id'], 'tenant': tenant_id, 'status': 'active',
                'description': description, **({'role': role_id} if role_id else {})},
               f"prefix {s['network']} in {s['vrf']} -> VLAN {s['vlan']}")
        ensure('ipam/ip-addresses/', {'address': s['gateway'], 'vrf_id': vrf_id},
               {'address': s['gateway'], 'vrf': vrf_id, 'tenant': tenant_id, 'status': 'active', 'role': 'anycast',
                'description': f"{s['bridge_domain']} gateway"},
               f"gateway {s['gateway']} in {s['vrf']}")
    return changes


def _differs(current, desired) -> bool:
    if isinstance(current, dict):
        return current.get('id', current.get('value')) != desired
    if isinstance(current, str) and isinstance(desired, str) and '/' in desired:
        return current.split('/')[0] != desired.split('/')[0] or current != desired
    return current != desired


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    parser.add_argument('--dry-run', action='store_true', help='show what would change without changing NetBox')
    args = parser.parse_args()

    data_model = get_nac_client().read_data_model()
    if not data_model:
        sys.exit("Failed to read the data model through NaC API")
    subnets = routed_subnets(data_model)
    print(f"Routed subnets in the data model: {len(subnets)}")
    for s in subnets:
        print(f"  VLAN {s['vlan']:>4}  {s['network']:<18} gw {s['gateway']:<18} {s['tenant']}/{s['epg']} "
              f"(BD {s['bridge_domain']}, VRF {s['vrf']})")

    changes = sync(get_netbox_client(), subnets, args.dry_run)
    print(f"{'Planned' if args.dry_run else 'Applied'} NetBox changes: {len(changes)}")
    for change in changes:
        print(f"  {change}")


if __name__ == '__main__':
    main()
