"""
NetBox API Client
Handles authentication and API interactions with NetBox IPAM
"""

import requests
import yaml
import os
import re
from typing import Dict, Any, Optional, List
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class NetBoxClient:
    """Client for interacting with NetBox API"""

    def __init__(self, base_url: Optional[str] = None, username: Optional[str] = None,
                 api_key: Optional[str] = None):
        """
        Initialize NetBox client

        Args:
            base_url: Base URL for NetBox (e.g., https://netbox.example.com)
            username: Username for reference (NetBox uses token-based auth)
            api_key: API token for authentication
        """
        self.base_url = base_url
        self.username = username
        self.api_key = api_key
        self.session = requests.Session()

        # Load from config if parameters not provided
        if not all([self.base_url, self.api_key]):
            self._load_config()

        # Set authentication headers if credentials available
        self._set_auth_headers()

    def _load_config(self):
        """Load configuration from YAML file"""
        try:
            # Navigate from src/nac_aci_gui/ up to project root, then to yaml/
            project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
            config_path = os.path.join(project_root, 'yaml', 'config.yaml')

            logger.debug(f"Loading NetBox configuration from: {config_path}")

            if not os.path.exists(config_path):
                logger.warning("Configuration file not found. Please configure via Admin panel.")
                return

            with open(config_path, 'r') as f:
                config = yaml.safe_load(f)

            if config and 'netbox' in config:
                netbox_config = config['netbox']

                # Store old values for comparison
                old_url = self.base_url
                old_api_key = self.api_key

                self.base_url = self.base_url or netbox_config.get('url', '')
                self.username = self.username or netbox_config.get('username', '')
                self.api_key = self.api_key or netbox_config.get('api_key', '')

                # Log configuration changes
                if old_url != self.base_url and old_url is not None:
                    logger.info(f"NetBox URL updated: {old_url} -> {self.base_url}")
                if old_api_key != self.api_key and old_api_key is not None:
                    logger.info("NetBox API Key updated (new token loaded)")

                logger.info("NetBox configuration loaded successfully")
                logger.info(f"Base URL: {self.base_url}")
                logger.info(f"Username: {self.username}")
                if self.api_key:
                    logger.info(f"API Key: {self.api_key[0:10]}... (length: {len(self.api_key)})")
                else:
                    logger.warning("No API Key configured")
            else:
                logger.warning("NetBox configuration section not found in config.yaml")
        except Exception as e:
            logger.error(f"Failed to load configuration: {str(e)}")

    def _ensure_config(self) -> bool:
        """Ensure required configuration is present"""
        if not all([self.base_url, self.api_key]):
            logger.error("NetBox not configured. Please configure via Admin panel.")
            return False
        return True

    def _set_auth_headers(self):
        """Set authentication headers for API requests"""
        if self.api_key:
            self.session.headers.update({
                'Authorization': f'Token {self.api_key}',
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            })
            logger.info("Authentication headers set successfully")
            logger.debug(f"Token length: {len(self.api_key)} characters")
        else:
            logger.warning("No API key provided - authentication headers not set")

    def get(self, endpoint: str, params: Optional[Dict] = None) -> Optional[Dict[str, Any]]:
        """
        Make GET request to NetBox API

        Args:
            endpoint: API endpoint (e.g., '/api/ipam/prefixes/')
            params: Optional query parameters

        Returns:
            Response JSON data or None if request failed
        """
        if not self._ensure_config():
            return None

        try:
            url = f"{self.base_url}{endpoint}"
            logger.info(f"Making GET request to: {url}")
            logger.debug(f"Request params: {params}")
            logger.debug(f"Authorization header present: {'Authorization' in self.session.headers}")

            response = self.session.get(url, params=params, verify=False, timeout=30)

            if response.status_code == 200:
                logger.info(f"GET request successful: {endpoint}")
                return response.json()
            elif response.status_code == 403:
                logger.error(f"GET request failed - Permission Denied (403): {response.text}")
                logger.error("This usually means:")
                logger.error("  1. The API token doesn't have read permissions for this resource")
                logger.error("  2. The API token is invalid or expired")
                logger.error("  3. The token needs to be assigned to a user/group with appropriate permissions")
                logger.error(f"Endpoint: {endpoint}")
                return None
            elif response.status_code == 401:
                logger.error(f"GET request failed - Unauthorized (401): {response.text}")
                logger.error("The API token is invalid or not provided correctly")
                return None
            else:
                logger.error(f"GET request failed: {response.status_code} - {response.text}")
                return None

        except requests.exceptions.RequestException as e:
            logger.error(f"GET request failed: {str(e)}")
            return None

    def post(self, endpoint: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Make POST request to NetBox API

        Args:
            endpoint: API endpoint
            data: Request payload

        Returns:
            Response JSON data or None if request failed
        """
        if not self._ensure_config():
            return None

        try:
            url = f"{self.base_url}{endpoint}"
            response = self.session.post(url, json=data, verify=False, timeout=30)

            if response.status_code in [200, 201]:
                return response.json()
            else:
                logger.error(f"POST request failed: {response.status_code} - {response.text}")
                return None

        except requests.exceptions.RequestException as e:
            logger.error(f"POST request failed: {str(e)}")
            return None

    def put(self, endpoint: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Make PUT request to NetBox API

        Args:
            endpoint: API endpoint
            data: Request payload

        Returns:
            Response JSON data or None if request failed
        """
        if not self._ensure_config():
            return None

        try:
            url = f"{self.base_url}{endpoint}"
            response = self.session.put(url, json=data, verify=False, timeout=30)

            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"PUT request failed: {response.status_code} - {response.text}")
                return None

        except requests.exceptions.RequestException as e:
            logger.error(f"PUT request failed: {str(e)}")
            return None

    def patch(self, endpoint: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Make PATCH request to NetBox API

        Args:
            endpoint: API endpoint
            data: Request payload

        Returns:
            Response JSON data or None if request failed
        """
        if not self._ensure_config():
            return None

        try:
            url = f"{self.base_url}{endpoint}"
            response = self.session.patch(url, json=data, verify=False, timeout=30)

            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"PATCH request failed: {response.status_code} - {response.text}")
                return None

        except requests.exceptions.RequestException as e:
            logger.error(f"PATCH request failed: {str(e)}")
            return None

    def delete(self, endpoint: str) -> bool:
        """
        Make DELETE request to NetBox API

        Args:
            endpoint: API endpoint

        Returns:
            True if deletion successful, False otherwise
        """
        if not self._ensure_config():
            return False

        try:
            url = f"{self.base_url}{endpoint}"
            response = self.session.delete(url, verify=False, timeout=30)

            if response.status_code in [200, 204]:
                return True
            else:
                logger.error(f"DELETE request failed: {response.status_code} - {response.text}")
                return False

        except requests.exceptions.RequestException as e:
            logger.error(f"DELETE request failed: {str(e)}")
            return False

    # Convenience methods for common NetBox IPAM operations

    def get_prefixes(self, params: Optional[Dict] = None) -> Optional[Dict[str, Any]]:
        """
        Get IP prefixes from NetBox

        Args:
            params: Optional query parameters (e.g., {'status': 'active', 'family': 4})

        Returns:
            Dictionary with prefix data
        """
        return self.get('/api/ipam/prefixes/', params=params)

    def get_prefix(self, prefix_id: int) -> Optional[Dict[str, Any]]:
        """
        Get specific prefix by ID

        Args:
            prefix_id: NetBox prefix ID

        Returns:
            Prefix details
        """
        return self.get(f'/api/ipam/prefixes/{prefix_id}/')

    def create_prefix(self, prefix_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Create a new prefix in NetBox

        Args:
            prefix_data: Prefix information
                Required: prefix (str) - IP prefix in CIDR notation
                Optional: status (str), description (str), site (int), vlan (int), etc.

        Returns:
            Created prefix details
        """
        return self.post('/api/ipam/prefixes/', prefix_data)

    def update_prefix(self, prefix_id: int, prefix_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Update an existing prefix

        Args:
            prefix_id: NetBox prefix ID
            prefix_data: Updated prefix information

        Returns:
            Updated prefix details
        """
        return self.patch(f'/api/ipam/prefixes/{prefix_id}/', prefix_data)

    def delete_prefix(self, prefix_id: int) -> bool:
        """
        Delete a prefix

        Args:
            prefix_id: NetBox prefix ID

        Returns:
            True if deletion successful
        """
        return self.delete(f'/api/ipam/prefixes/{prefix_id}/')

    def get_ip_addresses(self, params: Optional[Dict] = None) -> Optional[Dict[str, Any]]:
        """
        Get IP addresses from NetBox

        Args:
            params: Optional query parameters

        Returns:
            Dictionary with IP address data
        """
        return self.get('/api/ipam/ip-addresses/', params=params)

    def get_ip_address(self, ip_id: int) -> Optional[Dict[str, Any]]:
        """
        Get specific IP address by ID

        Args:
            ip_id: NetBox IP address ID

        Returns:
            IP address details
        """
        return self.get(f'/api/ipam/ip-addresses/{ip_id}/')

    def create_ip_address(self, ip_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Create a new IP address in NetBox

        Args:
            ip_data: IP address information
                Required: address (str) - IP address with prefix length
                Optional: status (str), dns_name (str), description (str), etc.

        Returns:
            Created IP address details
        """
        return self.post('/api/ipam/ip-addresses/', ip_data)

    def get_vlans(self, params: Optional[Dict] = None) -> Optional[Dict[str, Any]]:
        """
        Get VLANs from NetBox

        Args:
            params: Optional query parameters

        Returns:
            Dictionary with VLAN data
        """
        return self.get('/api/ipam/vlans/', params=params)

    def get_sites(self, params: Optional[Dict] = None) -> Optional[Dict[str, Any]]:
        """
        Get sites from NetBox

        Args:
            params: Optional query parameters

        Returns:
            Dictionary with site data
        """
        return self.get('/api/dcim/sites/', params=params)

    def get_devices(self, params: Optional[Dict] = None) -> Optional[Dict[str, Any]]:
        """
        Get devices from NetBox

        Args:
            params: Optional query parameters

        Returns:
            Dictionary with device data
        """
        return self.get('/api/dcim/devices/', params=params)

    def get_interfaces(self, params: Optional[Dict] = None) -> Optional[Dict[str, Any]]:
        """
        Get interfaces from NetBox

        Args:
            params: Optional query parameters (e.g., {'device_id': 1})

        Returns:
            Dictionary with interface data
        """
        return self.get('/api/dcim/interfaces/', params=params)

    def get_servers(self) -> Optional[list]:
        """
        Get servers from NetBox with their site, row (location) and rack

        Returns:
            List of server summaries, or None if the request failed
        """
        result = self.get_devices({'role': 'server', 'limit': 1000, 'ordering': 'name'})
        if result is None:
            return None

        servers = []
        for device in result.get('results', []):
            servers.append({
                'id': device['id'],
                'name': device['name'],
                'description': device.get('description', ''),
                'site': (device.get('site') or {}).get('name'),
                'row': (device.get('location') or {}).get('name'),
                'rack': (device.get('rack') or {}).get('name'),
                'position': device.get('position'),
            })
        return servers

    def get_server_connections(self, device_id: int) -> Optional[list]:
        """
        Get a server's interfaces and the ACI leaf port each one is cabled to

        Follows each interface's cable to the far-end interface and resolves the
        leaf's ACI node ID from its ``aci_node_id`` custom field. Interface names
        of the form ``Ethernet<module>/<port>`` are parsed into module and port.

        Args:
            device_id: NetBox device ID of the server

        Returns:
            List of interface connection dicts, or None if the request failed
        """
        result = self.get_interfaces({'device_id': device_id, 'limit': 1000})
        if result is None:
            return None

        leaf_node_ids = {}
        connections = []
        for intf in sorted(result.get('results', []), key=lambda i: i['name']):
            connection = {
                'interface_id': intf['id'],
                'interface': intf['name'],
                'cabled': intf.get('cable') is not None,
                'leaf': None,
                'leaf_device_id': None,
                'node_id': None,
                'leaf_interface': None,
                'module': None,
                'port': None,
            }

            far_end = next((
                peer for peer in intf.get('link_peers') or []
                if intf.get('link_peers_type') == 'dcim.interface'
            ), None)
            if far_end:
                leaf_id = far_end['device']['id']
                if leaf_id not in leaf_node_ids:
                    leaf = self.get(f'/api/dcim/devices/{leaf_id}/')
                    leaf_node_ids[leaf_id] = ((leaf or {}).get('custom_fields') or {}).get('aci_node_id')

                connection.update({
                    'leaf': far_end['device']['name'],
                    'leaf_device_id': leaf_id,
                    'node_id': leaf_node_ids[leaf_id],
                    'leaf_interface': far_end['name'],
                })
                match = re.fullmatch(r'Ethernet(\d+)/(\d+)', far_end['name'])
                if match:
                    connection['module'] = int(match.group(1))
                    connection['port'] = int(match.group(2))

            connections.append(connection)
        return connections

    def get_leaf_switches(self) -> Optional[list]:
        """
        Get leaf switches from NetBox with their ACI node ID, row (location) and rack

        Returns:
            List of leaf summaries sorted by name, or None if the request failed
        """
        result = self.get_devices({'role': 'leaf-switch', 'limit': 1000, 'ordering': 'name'})
        if result is None:
            return None

        return [{
            'id': device['id'],
            'name': device['name'],
            'node_id': (device.get('custom_fields') or {}).get('aci_node_id'),
            'row': (device.get('location') or {}).get('name'),
            'rack': (device.get('rack') or {}).get('name'),
        } for device in result.get('results', [])]

    def get_free_leaf_ports(self, leaf_device_id: int) -> Optional[list]:
        """
        Get a leaf switch's uncabled interfaces, i.e. ports a server can be plugged into

        Args:
            leaf_device_id: NetBox device ID of the leaf switch

        Returns:
            List of free ports sorted by module and port, or None if the request failed
        """
        result = self.get_interfaces({'device_id': leaf_device_id, 'cabled': 'false', 'limit': 1000})
        if result is None:
            return None

        ports = []
        for intf in result.get('results', []):
            match = re.fullmatch(r'Ethernet(\d+)/(\d+)', intf['name'])
            if match:
                ports.append({
                    'interface_id': intf['id'],
                    'name': intf['name'],
                    'module': int(match.group(1)),
                    'port': int(match.group(2)),
                })
        return sorted(ports, key=lambda p: (p['module'], p['port']))

    def move_server(self, server_id: int, rack_id: Optional[int], recables: list) -> Optional[str]:
        """
        Record a server move in NetBox: place it in a new rack and re-cable its interfaces

        Every new leaf port is checked to be uncabled before anything is changed, so a
        conflict leaves NetBox untouched.

        Args:
            server_id: NetBox device ID of the server
            rack_id: NetBox rack ID to move the server to, or None to leave it in place
            recables: List of {'server_interface_id', 'leaf_interface_id'} pairs

        Returns:
            None on success, otherwise an error message
        """
        for recable in recables:
            leaf_intf = self.get(f"/api/dcim/interfaces/{recable['leaf_interface_id']}/")
            if leaf_intf is None:
                return f"Leaf interface {recable['leaf_interface_id']} not found in NetBox"
            if leaf_intf.get('cable'):
                return f"{leaf_intf['device']['name']} {leaf_intf['name']} is already cabled in NetBox"

        if rack_id is not None:
            error = self._move_to_rack(server_id, rack_id)
            if error:
                return error

        for recable in recables:
            error = self._recable(recable['server_interface_id'], recable['leaf_interface_id'])
            if error:
                return error

        return None

    def _move_to_rack(self, device_id: int, rack_id: int) -> Optional[str]:
        """Place a device in a rack (and that rack's location), clearing its U position."""
        rack = self.get(f'/api/dcim/racks/{rack_id}/')
        if rack is None:
            return f"Rack {rack_id} not found in NetBox"
        # The old U position may already be taken in the new rack
        if self.patch(f'/api/dcim/devices/{device_id}/', {
            'rack': rack_id,
            'location': (rack.get('location') or {}).get('id'),
            'position': None,
            'face': '',
        }) is None:
            return "Failed to move the server to the new rack in NetBox"
        return None

    def _recable(self, server_interface_id: int, leaf_interface_id: int) -> Optional[str]:
        """Replace a server interface's cable with one to a new leaf interface."""
        server_intf = self.get(f"/api/dcim/interfaces/{server_interface_id}/")
        if server_intf is None:
            return f"Server interface {server_interface_id} not found in NetBox"
        if server_intf.get('cable') and not self.delete(f"/api/dcim/cables/{server_intf['cable']['id']}/"):
            return f"Failed to remove the old cable on {server_intf['name']} in NetBox"
        if self.post('/api/dcim/cables/', {
            'a_terminations': [{'object_type': 'dcim.interface', 'object_id': server_interface_id}],
            'b_terminations': [{'object_type': 'dcim.interface', 'object_id': leaf_interface_id}],
            'status': 'connected',
        }) is None:
            return f"Failed to cable {server_intf['name']} to its new leaf port in NetBox"
        return None

    def get_locations(self, params: Optional[Dict] = None) -> Optional[Dict[str, Any]]:
        """
        Get locations from NetBox

        Args:
            params: Optional query parameters (e.g., {'site_id': 1})

        Returns:
            Dictionary with location data
        """
        return self.get('/api/dcim/locations/', params=params)

    def get_vlan_groups(self, params: Optional[Dict] = None) -> Optional[Dict[str, Any]]:
        """
        Get VLAN groups from NetBox

        Args:
            params: Optional query parameters

        Returns:
            Dictionary with VLAN group data
        """
        return self.get('/api/ipam/vlan-groups/', params=params)

    def create_available_vlan(self, vlan_group_id: int, vlan_name: str) -> Optional[Dict[str, Any]]:
        """
        Create an available VLAN in a VLAN group

        Args:
            vlan_group_id: NetBox VLAN group ID
            vlan_name: Name for the new VLAN

        Returns:
            Dictionary with created VLAN data including 'id' and 'vid' (VLAN ID)
        """
        endpoint = f'/api/ipam/vlan-groups/{vlan_group_id}/available-vlans/'
        payload = [{"name": vlan_name}]

        logger.info(f"Creating available VLAN '{vlan_name}' in group {vlan_group_id}")
        result = self.post(endpoint, payload)

        if result and isinstance(result, list) and len(result) > 0:
            vlan_data = result[0]
            logger.info(f"Created VLAN: id={vlan_data.get('id')}, vid={vlan_data.get('vid')}, name={vlan_data.get('name')}")
            return vlan_data

        return result

    def patch_vlan_custom_fields(self, vlan_id: int, custom_fields: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Update custom fields on a VLAN

        Args:
            vlan_id: NetBox VLAN ID
            custom_fields: Dictionary of custom field names and values

        Returns:
            Dictionary with updated VLAN data
        """
        endpoint = f'/api/ipam/vlans/{vlan_id}/'
        payload = {"custom_fields": custom_fields}

        logger.info(f"Updating VLAN {vlan_id} custom fields: {custom_fields}")
        return self.patch(endpoint, payload)

    def create_available_prefix(self, parent_prefix_id: int, prefix_length: int, name: str, vlan_id: int) -> Optional[Dict[str, Any]]:
        """
        Create an available prefix from a parent prefix

        Args:
            parent_prefix_id: NetBox parent prefix ID
            prefix_length: Length of the prefix to create (e.g., 24 for /24)
            name: Name for the new prefix
            vlan_id: VLAN ID to associate with the prefix

        Returns:
            Dictionary with created prefix data including 'id' and 'prefix'
        """
        endpoint = f'/api/ipam/prefixes/{parent_prefix_id}/available-prefixes/'
        payload = {
            "prefix_length": prefix_length,
            "name": name,
            "vlan": vlan_id
        }

        logger.info(f"Creating available prefix from parent {parent_prefix_id}: /{prefix_length}, name={name}, vlan={vlan_id}")
        result = self.post(endpoint, payload)

        if result and isinstance(result, list) and len(result) > 0:
            prefix_data = result[0]
            logger.info(f"Created prefix: id={prefix_data.get('id')}, prefix={prefix_data.get('prefix')}, name={prefix_data.get('display')}")
            return prefix_data

        return result

    def bulk_create_prefixes(self, prefixes: List[Dict[str, Any]]) -> Optional[List[Dict[str, Any]]]:
        """
        Bulk create multiple prefixes

        Args:
            prefixes: List of prefix data dictionaries

        Returns:
            List of created prefix details
        """
        return self.post('/api/ipam/prefixes/', prefixes)

    def test_connection(self) -> Dict[str, Any]:
        """
        Test connection to NetBox API

        Returns:
            Dictionary with status and message
        """
        if not self._ensure_config():
            return {
                'status': 'error',
                'message': 'NetBox not configured. Please configure via Admin panel.'
            }

        try:
            # Try to get API status as a connection test
            status_response = self.get('/api/status/')

            if status_response is not None:
                # Get some basic info to verify connection
                prefixes_response = self.get_prefixes()

                prefix_count = 0
                if prefixes_response:
                    prefix_count = prefixes_response.get('count', 0)

                return {
                    'status': 'success',
                    'message': 'Successfully connected to NetBox',
                    'netbox_version': status_response.get('netbox-version', 'Unknown'),
                    'prefix_count': prefix_count
                }
            else:
                return {
                    'status': 'error',
                    'message': 'Failed to connect. Please check credentials and URL.'
                }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'Connection test failed: {str(e)}'
            }

    def reload_config(self):
        """
        Reload configuration from YAML file
        This is useful when configuration changes during runtime
        """
        logger.info("Reloading NetBox configuration...")
        self._load_config()
        self._set_auth_headers()
        logger.info("NetBox configuration reloaded successfully")

    def close(self):
        """Close the session"""
        self.session.close()


def get_netbox_client() -> NetBoxClient:
    """
    Get NetBox client instance with fresh configuration

    Note: This function always creates a new instance to ensure
    the latest configuration is loaded from the YAML file.
    This allows configuration changes to take effect immediately
    without restarting the application.

    Returns:
        NetBoxClient instance with current configuration
    """
    # Always create a new instance to pick up latest config changes
    client = NetBoxClient()
    logger.debug("Created new NetBox client instance with current configuration")
    return client
