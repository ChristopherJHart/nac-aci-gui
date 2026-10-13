#!/usr/bin/env python3
"""
Seed NetBox DCIM with demo servers cabled to ACI leaf switches.

Builds a small data hall in the "Demo-DC" site: rows (locations) holding
racks, one leaf switch per rack pair, and servers whose NICs are cabled to
leaf access ports. The portal's "Trunk VLANs to Server" action follows those
cables from a server NIC to its leaf and port.

Leaf switches carry their ACI node ID in the ``aci_node_id`` custom field
(and, for compatibility with netbox.tf in the data model repository, as
"ACI Node ID: <id>" in their comments).

The script is idempotent: every object is looked up by its natural key and
only created or updated when it differs, so it is safe to re-run.

Usage:
    NETBOX_URL=http://netbox:8080 NETBOX_TOKEN=... python scripts/seed_netbox_dcim.py

Without the environment variables, the URL and token are read from the
``netbox`` section of yaml/config.yaml.
"""

import os
import sys
from pathlib import Path

import requests

import yaml

SITE_SLUG = 'demo-dc'

# Rows of racks in the data hall. Each rack pair shares one leaf switch.
ROWS = {
    'Row A': ['A01', 'A02', 'A03', 'A04'],
    'Row B': ['B01', 'B02', 'B03', 'B04'],
    'Row C': ['C01', 'C02', 'C03', 'C04'],
}

# ACI leaf switches and the rack each one sits in. Node IDs must match the
# leaf nodes defined in the data model repository.
LEAFS = [
    {'name': 'LAB-LEAF1', 'node_id': 101, 'rack': 'A01'},
    {'name': 'LAB-LEAF2', 'node_id': 102, 'rack': 'A03'},
    {'name': 'LAB-LEAF3', 'node_id': 103, 'rack': 'B01'},
    {'name': 'LAB-LEAF4', 'node_id': 104, 'rack': 'B03'},
    {'name': 'LAB-LEAF5', 'node_id': 105, 'rack': 'C01'},
    {'name': 'LAB-LEAF6', 'node_id': 106, 'rack': 'C03'},
]

# Leaf access ports defined in each leaf's interface profile in the data
# model repository. Servers are only cabled to these ports.
LEAF_PORTS = {
    101: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 16],
    **{node_id: list(range(1, 25)) for node_id in range(102, 107)},
}

# Server naming: <role prefix>-<two digits>. Roles cycle across racks so every
# row has a mix of workloads.
SERVER_ROLES = [
    ('web', 'Web Server'),
    ('app', 'Application Server'),
    ('db', 'Database Server'),
    ('esx', 'Virtualization Host'),
    ('hpc', 'HPC Compute Node'),
    ('bkp', 'Backup Server'),
]
SERVERS_PER_RACK = 4
NICS_PER_SERVER = 2


class NetBox:
    """Minimal NetBox REST client with get-or-create helpers."""

    def __init__(self, url: str, token: str):
        self.url = url.rstrip('/')
        self.session = requests.Session()
        self.session.trust_env = False
        self.session.headers.update({
            'Authorization': f'Token {token}',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        })

    def _request(self, method: str, endpoint: str, **kwargs):
        response = self.session.request(method, f"{self.url}/api/{endpoint}", timeout=30, **kwargs)
        if not response.ok:
            raise RuntimeError(f"{method} {endpoint} failed: {response.status_code} {response.text}")
        return response.json() if response.content else None

    def find(self, endpoint: str, **filters):
        results = self._request('GET', endpoint, params={**filters, 'limit': 2})['results']
        if len(results) > 1:
            raise RuntimeError(f"Expected at most one {endpoint} matching {filters}, found several")
        return results[0] if results else None

    def ensure(self, endpoint: str, lookup: dict, data: dict):
        """Create the object if missing, otherwise patch any fields that differ."""
        existing = self.find(endpoint, **lookup)
        if existing is None:
            created = self._request('POST', endpoint, json=data)
            print(f"  + {endpoint} {created.get('display', created.get('id'))}")
            return created

        changes = {k: v for k, v in data.items() if not _matches(existing.get(k), v)}
        if changes:
            existing = self._request('PATCH', f"{endpoint}{existing['id']}/", json=changes)
            print(f"  ~ {endpoint} {existing.get('display')} ({', '.join(changes)})")
        return existing


def _matches(current, desired) -> bool:
    """Compare a NetBox API value (often a nested object) with a write value."""
    if isinstance(current, dict) and not isinstance(desired, dict):
        return current.get('id') == desired or current.get('value') == desired
    if isinstance(current, dict) and isinstance(desired, dict):
        return all(_matches(current.get(k), v) for k, v in desired.items())
    if isinstance(current, list) and isinstance(desired, list):
        return sorted(_flatten_ids(current)) == sorted(_flatten_ids(desired))
    return current == desired


def _flatten_ids(values: list) -> list:
    return [v.get('id', v.get('value')) if isinstance(v, dict) else v for v in values]


def load_settings() -> tuple[str, str]:
    url = os.getenv('NETBOX_URL')
    token = os.getenv('NETBOX_TOKEN')
    if url and token:
        return url, token

    config_path = Path(__file__).resolve().parent.parent / 'yaml' / 'config.yaml'
    if not config_path.exists():
        sys.exit("Set NETBOX_URL and NETBOX_TOKEN, or configure NetBox in yaml/config.yaml")
    netbox_config = yaml.safe_load(config_path.read_text()).get('netbox', {})
    return url or netbox_config['url'], token or netbox_config['api_key']


def slugify(value: str) -> str:
    return value.lower().replace(' ', '-').replace('/', '-')


def seed_catalog(nb: NetBox) -> dict:
    """Ensure the custom field, manufacturers, roles, device types and tag exist."""
    print("Custom fields")
    nb.ensure('extras/custom-fields/', {'name': 'aci_node_id'}, {
        'name': 'aci_node_id',
        'label': 'ACI Node ID',
        'type': 'integer',
        'object_types': ['dcim.device'],
        'description': 'ACI fabric node ID of this switch',
        'validation_minimum': 1,
        'validation_maximum': 4000,
    })

    print("Site, manufacturers, roles and device types")
    site = nb.find('dcim/sites/', slug=SITE_SLUG)
    if site is None:
        sys.exit(f"Site '{SITE_SLUG}' not found; create it before seeding")

    cisco = nb.ensure('dcim/manufacturers/', {'slug': 'cisco'}, {'name': 'Cisco', 'slug': 'cisco'})
    generic = nb.ensure('dcim/manufacturers/', {'slug': 'generic'}, {'name': 'Generic', 'slug': 'generic'})

    leaf_role = nb.ensure('dcim/device-roles/', {'slug': 'leaf-switch'},
                          {'name': 'Leaf Switch', 'slug': 'leaf-switch', 'color': '2196f3'})
    server_role = nb.ensure('dcim/device-roles/', {'slug': 'server'},
                            {'name': 'Server', 'slug': 'server', 'color': '4caf50'})

    leaf_type = nb.ensure('dcim/device-types/', {'slug': 'nexus-9336c-fx2'},
                          {'manufacturer': cisco['id'], 'model': 'Nexus 9336C-FX2',
                           'slug': 'nexus-9336c-fx2', 'u_height': 1})
    server_type = nb.ensure('dcim/device-types/', {'slug': 'generic-1u-server'},
                            {'manufacturer': generic['id'], 'model': 'Generic 1U Server',
                             'slug': 'generic-1u-server', 'u_height': 1})

    aci_tag = nb.ensure('extras/tags/', {'slug': 'aci'}, {'name': 'ACI', 'slug': 'aci'})

    return {'site': site, 'leaf_role': leaf_role, 'server_role': server_role,
            'leaf_type': leaf_type, 'server_type': server_type, 'aci_tag': aci_tag}


def seed_racks(nb: NetBox, site: dict) -> dict:
    """Ensure each row exists as a location and each rack sits in its row."""
    print("Rows and racks")
    racks = {}
    for row_name, rack_names in ROWS.items():
        row = nb.ensure('dcim/locations/', {'site_id': site['id'], 'slug': slugify(row_name)},
                        {'name': row_name, 'slug': slugify(row_name), 'site': site['id']})
        for rack_name in rack_names:
            racks[rack_name] = nb.ensure('dcim/racks/', {'site_id': site['id'], 'name': rack_name},
                                         {'name': rack_name, 'site': site['id'], 'location': row['id'],
                                          'u_height': 42, 'status': 'active'})
    return racks


def seed_leafs(nb: NetBox, catalog: dict, racks: dict) -> dict:
    """Ensure each leaf switch and its access ports exist; return ports keyed by leaf rack."""
    site = catalog['site']
    print("Leaf switches and access ports")
    leaf_ports = {}
    for leaf in LEAFS:
        rack = racks[leaf['rack']]
        device = nb.ensure('dcim/devices/', {'name': leaf['name']}, {
            'name': leaf['name'],
            'role': catalog['leaf_role']['id'],
            'device_type': catalog['leaf_type']['id'],
            'site': site['id'],
            'location': rack['location']['id'],
            'rack': rack['id'],
            'position': 42,
            'face': 'front',
            'status': 'active',
            'tags': [catalog['aci_tag']['id']],
            'comments': f"ACI Node ID: {leaf['node_id']}",
            'custom_fields': {'aci_node_id': leaf['node_id']},
        })
        ports = []
        for port in LEAF_PORTS[leaf['node_id']]:
            ports.append(nb.ensure('dcim/interfaces/', {'device_id': device['id'], 'name': f'Ethernet1/{port}'}, {
                'device': device['id'],
                'name': f'Ethernet1/{port}',
                'type': '25gbase-x-sfp28',
            }))
        leaf_ports[leaf['rack']] = ports
    return leaf_ports


def seed_servers(nb: NetBox, catalog: dict, racks: dict, leaf_ports: dict) -> None:
    """Ensure servers and their NICs exist, cabling each NIC to a free port on the rack pair's leaf."""
    site = catalog['site']
    print("Servers, NICs and cables")
    # Each leaf serves its own rack and the rack next to it in the row.
    rack_to_leaf_rack = {}
    for rack_names in ROWS.values():
        for i, rack_name in enumerate(rack_names):
            rack_to_leaf_rack[rack_name] = rack_names[i - (i % 2)]

    free_ports = {rack: list(ports) for rack, ports in leaf_ports.items()}
    server_index = 0
    for rack_name, rack in racks.items():
        for slot in range(SERVERS_PER_RACK):
            prefix, description = SERVER_ROLES[server_index % len(SERVER_ROLES)]
            server_index += 1
            name = f"niaid-{prefix}-{server_index:02d}"
            server = nb.ensure('dcim/devices/', {'name': name}, {
                'name': name,
                'role': catalog['server_role']['id'],
                'device_type': catalog['server_type']['id'],
                'site': site['id'],
                'location': rack['location']['id'],
                'rack': rack['id'],
                'position': 2 + slot * 2,
                'face': 'front',
                'status': 'active',
                'description': description,
            })
            for nic in range(NICS_PER_SERVER):
                server_nic = nb.ensure('dcim/interfaces/', {'device_id': server['id'], 'name': f'eth{nic}'}, {
                    'device': server['id'],
                    'name': f'eth{nic}',
                    'type': '25gbase-x-sfp28',
                })
                cable_to_free_port(nb, name, server_nic, free_ports[rack_to_leaf_rack[rack_name]])


def cable_to_free_port(nb: NetBox, server_name: str, server_nic: dict, free_ports: list) -> None:
    """Cable a server NIC to the first uncabled leaf port, unless the NIC is already cabled."""
    if server_nic.get('cable'):
        return
    leaf_port = next((p for p in free_ports if not p.get('cable')), None)
    if leaf_port is None:
        print(f"  ! no free leaf port for {server_name} {server_nic['name']}; leaving uncabled")
        return
    free_ports.remove(leaf_port)
    cable = nb._request('POST', 'dcim/cables/', json={
        'a_terminations': [{'object_type': 'dcim.interface', 'object_id': server_nic['id']}],
        'b_terminations': [{'object_type': 'dcim.interface', 'object_id': leaf_port['id']}],
        'status': 'connected',
        'type': 'dac-passive',
    })
    print(f"  + cable {server_name} {server_nic['name']} <-> {leaf_port['device']['name']} "
          f"{leaf_port['name']} (#{cable['id']})")


def seed(nb: NetBox) -> None:
    catalog = seed_catalog(nb)
    racks = seed_racks(nb, catalog['site'])
    leaf_ports = seed_leafs(nb, catalog, racks)
    seed_servers(nb, catalog, racks, leaf_ports)


def main() -> None:
    url, token = load_settings()
    print(f"Seeding NetBox DCIM at {url}")
    seed(NetBox(url, token))
    print("Done")


if __name__ == '__main__':
    main()
