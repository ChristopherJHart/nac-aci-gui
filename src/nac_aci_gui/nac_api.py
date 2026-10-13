"""
NaC API Client
Handles authentication and API interactions with Network-as-Code API
"""

import requests
import yaml
import os
from typing import Dict, Any, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class NacApiClient:
    """Client for interacting with Network-as-Code API"""

    def __init__(self, api_url: Optional[str] = None, api_key: Optional[str] = None,
                 scm_provider: Optional[str] = None, scm_api_url: Optional[str] = None,
                 repository_url: Optional[str] = None, data_sources_dir: Optional[str] = None):
        """
        Initialize NaC API client

        Args:
            api_url: Base URL for NaC API (e.g., https://nd-api.example.com)
            api_key: API key for authentication
            scm_provider: SCM provider (github, gitlab, bitbucket_cloud, bitbucket_local, azure_devops)
            scm_api_url: SCM API URL (e.g., https://api.github.com)
            repository_url: Repository path inside the SCM (e.g., username/repo-name)
            data_sources_dir: Directory path containing data sources
        """
        self.api_url = api_url
        self.api_key = api_key
        self.scm_provider = scm_provider
        self.scm_api_url = scm_api_url
        self.repository_url = repository_url
        self.data_sources_dir = data_sources_dir
        self.session = requests.Session()

        # Load from config if parameters not provided
        if not all([self.api_url, self.api_key]):
            self._load_config()

        # Set authentication headers if credentials available
        self._set_auth_headers()

    def _load_config(self):
        """Load configuration from YAML file"""
        try:
            # Navigate from src/nac_aci_gui/ up to project root, then to yaml/
            project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
            config_path = os.path.join(project_root, 'yaml', 'config.yaml')

            if not os.path.exists(config_path):
                logger.warning("Configuration file not found. Please configure via Admin panel.")
                return

            with open(config_path, 'r') as f:
                config = yaml.safe_load(f)

            if config and 'nac' in config:
                nac_config = config['nac']
                self.api_url = self.api_url or nac_config.get('api_url', '')
                self.api_key = self.api_key or nac_config.get('api_key', '')
                self.scm_provider = self.scm_provider or nac_config.get('scm_provider', '')
                self.scm_api_url = self.scm_api_url or nac_config.get('scm_api_url', '')
                self.repository_url = self.repository_url or nac_config.get('repository_url', '')
                self.data_sources_dir = self.data_sources_dir or nac_config.get('data_sources_dir', '')

                logger.info("NaC API configuration loaded successfully")
                logger.info(f"API URL: {self.api_url}")
                logger.info(f"SCM Provider: {self.scm_provider}")
                logger.info(f"SCM API URL: {self.scm_api_url}")
                if self.api_key:
                    logger.info(f"API Key: {self.api_key[0:10]}...")
        except Exception as e:
            logger.error(f"Failed to load configuration: {str(e)}")

    def _ensure_config(self) -> tuple[bool, str]:
        """
        Ensure required configuration is present

        Returns:
            Tuple of (is_configured, error_message)
        """
        missing_fields = []

        if not self.api_url:
            missing_fields.append("NAC-API URL")
        if not self.api_key:
            missing_fields.append("Passthrough API Key")
        if not self.scm_provider:
            missing_fields.append("SCM Provider")
        if not self.scm_api_url:
            missing_fields.append("SCM API URL")

        if missing_fields:
            error_msg = f"NaC API configuration incomplete. Missing required fields: {', '.join(missing_fields)}. Please configure in Admin panel."
            logger.error(error_msg)
            return False, error_msg

        return True, ""

    def _set_auth_headers(self):
        """Set authentication headers for API requests"""
        if self.api_key and self.scm_provider:
            # Build x-git-config header
            git_config_parts = []
            if self.scm_api_url:
                git_config_parts.append(f"api_url={self.scm_api_url}")
            if self.repository_url:
                git_config_parts.append(f"repository={self.repository_url}")
            if self.data_sources_dir:
                git_config_parts.append(f"data_sources={self.data_sources_dir}")
            if self.scm_provider:
                git_config_parts.append(f"type={self.scm_provider}")

            git_config = ";".join(git_config_parts)

            self.session.headers.update({
                'Authorization': f'passthrough {self.api_key}',
                'x-git-config': git_config,
                'Content-Type': 'application/json'
            })
            logger.info("Authentication headers set successfully")

    def get(self, endpoint: str, params: Optional[Dict] = None) -> Optional[Dict[str, Any]]:
        """
        Make GET request to NaC API

        Args:
            endpoint: API endpoint (e.g., '/api/v1/operations/read')
            params: Optional query parameters

        Returns:
            Response JSON data or None if request failed
        """
        is_configured, _ = self._ensure_config()
        if not is_configured:
            return None

        try:
            url = f"{self.api_url}{endpoint}"
            response = self.session.get(url, params=params, verify=False, timeout=30)

            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"GET request failed: {response.status_code} - {response.text}")
                return None

        except requests.exceptions.RequestException as e:
            logger.error(f"GET request failed: {str(e)}")
            return None

    def post(self, endpoint: str, data: Dict[str, Any], params: Optional[Dict] = None) -> Optional[Dict[str, Any]]:
        """
        Make POST request to NaC API

        Args:
            endpoint: API endpoint
            data: Request payload
            params: Optional query parameters

        Returns:
            Response JSON data or None if request failed
        """
        is_configured, _ = self._ensure_config()
        if not is_configured:
            return None

        try:
            url = f"{self.api_url}{endpoint}"
            response = self.session.post(url, json=data, params=params, verify=False, timeout=30)

            if response.status_code in [200, 201]:
                return response.json()
            elif response.status_code == 204:
                # 204 No Content - successful but no body to return
                return {'status': 'success', 'message': 'Operation completed successfully'}
            else:
                logger.error(f"POST request failed: {response.status_code} - {response.text}")
                return None

        except requests.exceptions.RequestException as e:
            logger.error(f"POST request failed: {str(e)}")
            return None

    def put(self, endpoint: str, data: Dict[str, Any], params: Optional[Dict] = None) -> Optional[Dict[str, Any]]:
        """
        Make PUT request to NaC API

        Args:
            endpoint: API endpoint
            data: Request payload
            params: Optional query parameters

        Returns:
            Response JSON data or None if request failed
        """
        is_configured, _ = self._ensure_config()
        if not is_configured:
            return None

        try:
            url = f"{self.api_url}{endpoint}"
            response = self.session.put(url, json=data, params=params, verify=False, timeout=30)

            if response.status_code == 200:
                return response.json()
            elif response.status_code == 204:
                # 204 No Content - successful but no body to return
                return {'status': 'success', 'message': 'Operation completed successfully'}
            else:
                logger.error(f"PUT request failed: {response.status_code} - {response.text}")
                return None

        except requests.exceptions.RequestException as e:
            logger.error(f"PUT request failed: {str(e)}")
            return None

    def delete(self, endpoint: str, params: Optional[Dict] = None) -> bool:
        """
        Make DELETE request to NaC API

        Args:
            endpoint: API endpoint
            params: Optional query parameters

        Returns:
            True if deletion successful, False otherwise
        """
        is_configured, _ = self._ensure_config()
        if not is_configured:
            return False

        try:
            url = f"{self.api_url}{endpoint}"
            response = self.session.delete(url, params=params, verify=False, timeout=30)

            if response.status_code in [200, 204]:
                return True
            else:
                logger.error(f"DELETE request failed: {response.status_code} - {response.text}")
                return False

        except requests.exceptions.RequestException as e:
            logger.error(f"DELETE request failed: {str(e)}")
            return False

    # Convenience methods for common NaC API operations

    def read_data_model(self) -> Optional[Dict[str, Any]]:
        """
        Read the complete data model from NaC API

        Returns:
            Complete data model or None if request failed
        """
        return self.get('/api/v1/operations/read')

    def get_data_model_summary(self) -> Optional[Dict[str, Any]]:
        """
        Get a summary of the data model (lightweight version)

        Returns:
            Data model summary or None if request failed
        """
        response = self.get('/api/v1/operations/read')
        if response:
            # Return a summary instead of the full model
            return {
                'status': 'success',
                'size_bytes': len(str(response)),
                'keys': list(response.keys()) if isinstance(response, dict) else None
            }
        return None

    # ==========================================
    # ACI-Specific Data Model Functions
    # ==========================================

    def get_tenants_for_table(self) -> Optional[list]:
        """
        Get tenants from the NaC API data model at path apic/tenants.
        Formats the data for display in a Tabulator table.

        Returns:
            List of tenant dictionaries formatted for table display, or None if failed
        """
        try:
            # Read the full data model
            logger.info("=== DEBUG: Starting get_tenants_for_table() ===")
            data_model = self.read_data_model()

            if not data_model:
                logger.warning("DEBUG: No data model returned from NaC API")
                return []

            # Debug: Log top-level keys of data model
            logger.info(f"DEBUG: Data model type: {type(data_model)}")
            if isinstance(data_model, dict):
                logger.info(f"DEBUG: Data model top-level keys: {list(data_model.keys())}")

                # Check for 'apic' key
                if 'apic' in data_model:
                    apic_data = data_model.get('apic', {})
                    logger.info(f"DEBUG: 'apic' data type: {type(apic_data)}")
                    if isinstance(apic_data, dict):
                        logger.info(f"DEBUG: 'apic' keys: {list(apic_data.keys())}")
                else:
                    logger.warning("DEBUG: 'apic' key NOT found in data model")
                    # Log first 500 chars of data model for inspection
                    logger.info(f"DEBUG: Data model preview: {str(data_model)[:500]}")

            # Navigate to apic/tenants path
            tenants_data = data_model.get('apic', {}).get('tenants', [])
            logger.info(f"DEBUG: tenants_data type: {type(tenants_data)}, value: {tenants_data}")

            if not tenants_data:
                logger.info("DEBUG: No tenants found in apic/tenants path")
                return []

            # Format tenants for table display
            tenant_list = []
            for tenant in tenants_data:
                logger.info(f"DEBUG: Processing tenant: {tenant}")
                if isinstance(tenant, dict):
                    tenant_entry = {
                        'name': tenant.get('name', ''),
                        'alias': tenant.get('alias', ''),
                        'description': tenant.get('description', ''),
                    }
                    tenant_list.append(tenant_entry)

            logger.info(f"DEBUG: Retrieved {len(tenant_list)} tenants from NaC API data model")
            logger.info(f"DEBUG: tenant_list = {tenant_list}")
            return tenant_list

        except Exception as e:
            logger.error(f"ERROR retrieving tenants from data model: {str(e)}", exc_info=True)
            return None

    def get_bridge_domains_for_tenant(self, tenant_name: str) -> Optional[list]:
        """
        Get bridge domains for a specific tenant from the NaC API data model.
        Path: apic/tenants/name={tenant_name}/bridge_domains

        Args:
            tenant_name: Name of the tenant to get bridge domains for

        Returns:
            List of bridge domain dictionaries formatted for table display, or None if failed
        """
        try:
            logger.info(f"=== DEBUG: Starting get_bridge_domains_for_tenant('{tenant_name}') ===")
            data_model = self.read_data_model()

            if not data_model:
                logger.warning("DEBUG: No data model returned from NaC API")
                return []

            # Navigate to apic/tenants
            tenants_data = data_model.get('apic', {}).get('tenants', [])
            logger.info(f"DEBUG: Found {len(tenants_data)} tenants in data model")

            if not tenants_data:
                logger.info("DEBUG: No tenants found in apic/tenants path")
                return []

            # Find the specific tenant by name
            target_tenant = None
            for tenant in tenants_data:
                if isinstance(tenant, dict) and tenant.get('name') == tenant_name:
                    target_tenant = tenant
                    break

            if not target_tenant:
                logger.warning(f"DEBUG: Tenant '{tenant_name}' not found in data model")
                return []

            logger.info(f"DEBUG: Found tenant '{tenant_name}', keys: {list(target_tenant.keys())}")

            # Get bridge_domains from the tenant
            bridge_domains_data = target_tenant.get('bridge_domains', [])
            logger.info(f"DEBUG: bridge_domains_data type: {type(bridge_domains_data)}, count: {len(bridge_domains_data) if isinstance(bridge_domains_data, list) else 'N/A'}")

            if not bridge_domains_data:
                logger.info(f"DEBUG: No bridge domains found for tenant '{tenant_name}'")
                return []

            # Format bridge domains for table display
            bd_list = []
            for bd in bridge_domains_data:
                logger.info(f"DEBUG: Processing bridge domain: {bd}")
                if isinstance(bd, dict):
                    # Get subnets information
                    subnets = bd.get('subnets', [])
                    subnet_count = len(subnets) if isinstance(subnets, list) else 0

                    bd_entry = {
                        'name': bd.get('name', ''),
                        'tenant': tenant_name,
                        'vrf': bd.get('vrf', ''),
                        'mac': bd.get('mac', ''),
                        'l2_unknown_unicast': bd.get('l2_unknown_unicast', ''),
                        'arp_flooding': bd.get('arp_flooding', False),
                        'ip_routing': bd.get('ip_routing', False),
                        'description': bd.get('description', ''),
                        'subnet_count': subnet_count,
                        'subnets': subnets,  # Include full subnet data for YAML view
                    }
                    bd_list.append(bd_entry)

            logger.info(f"DEBUG: Retrieved {len(bd_list)} bridge domains for tenant '{tenant_name}'")
            return bd_list

        except Exception as e:
            logger.error(f"ERROR retrieving bridge domains for tenant '{tenant_name}': {str(e)}", exc_info=True)
            return None

    def get_vrfs_for_tenant(self, tenant_name: str) -> Optional[list]:
        """
        Get VRFs for a specific tenant from the NaC API data model.
        Path: apic/tenants/name={tenant_name}/vrfs

        Args:
            tenant_name: Name of the tenant to get VRFs for

        Returns:
            List of VRF dictionaries formatted for table display, or None if failed
        """
        try:
            logger.info(f"=== DEBUG: Starting get_vrfs_for_tenant('{tenant_name}') ===")
            data_model = self.read_data_model()

            if not data_model:
                logger.warning("DEBUG: No data model returned from NaC API")
                return []

            # Navigate to apic/tenants
            tenants_data = data_model.get('apic', {}).get('tenants', [])
            logger.info(f"DEBUG: Found {len(tenants_data)} tenants in data model")

            if not tenants_data:
                logger.info("DEBUG: No tenants found in apic/tenants path")
                return []

            # Find the specific tenant by name
            target_tenant = None
            for tenant in tenants_data:
                if isinstance(tenant, dict) and tenant.get('name') == tenant_name:
                    target_tenant = tenant
                    break

            if not target_tenant:
                logger.warning(f"DEBUG: Tenant '{tenant_name}' not found in data model")
                return []

            logger.info(f"DEBUG: Found tenant '{tenant_name}', keys: {list(target_tenant.keys())}")

            # Get vrfs from the tenant
            vrfs_data = target_tenant.get('vrfs', [])
            logger.info(f"DEBUG: vrfs_data type: {type(vrfs_data)}, count: {len(vrfs_data) if isinstance(vrfs_data, list) else 'N/A'}")

            if not vrfs_data:
                logger.info(f"DEBUG: No VRFs found for tenant '{tenant_name}'")
                return []

            # Format VRFs for table display
            vrf_list = []
            for vrf in vrfs_data:
                logger.info(f"DEBUG: Processing VRF: {vrf}")
                if isinstance(vrf, dict):
                    vrf_entry = {
                        'name': vrf.get('name', ''),
                        'tenant': tenant_name,
                        'alias': vrf.get('alias', ''),
                        'description': vrf.get('description', ''),
                        'data_plane_learning': vrf.get('data_plane_learning', True),
                        'enforcement_direction': vrf.get('enforcement_direction', ''),
                        'enforcement_preference': vrf.get('enforcement_preference', ''),
                        'preferred_group': vrf.get('preferred_group', False),
                    }
                    vrf_list.append(vrf_entry)

            logger.info(f"DEBUG: Retrieved {len(vrf_list)} VRFs for tenant '{tenant_name}'")
            return vrf_list

        except Exception as e:
            logger.error(f"ERROR retrieving VRFs for tenant '{tenant_name}': {str(e)}", exc_info=True)
            return None

    def get_leaf_nodes(self) -> Optional[list]:
        try:
            data_model = self.read_data_model()
            if not data_model:
                return []
            nodes = data_model.get('apic', {}).get('node_policies', {}).get('nodes', [])
            return [n for n in nodes if n.get('role') == 'leaf']
        except Exception as e:
            logger.error(f"Error reading leaf nodes: {str(e)}", exc_info=True)
            return None

    def _expand_port_blocks(self, port_blocks: list) -> list:
        ports = []
        for block in port_blocks:
            from_port = block.get('from_port')
            if from_port is None:
                continue
            to_port = block.get('to_port', from_port)
            from_module = block.get('from_module', block.get('to_module', 1))
            to_module = block.get('to_module', from_module)
            for mod in range(from_module, to_module + 1):
                for p in range(from_port, to_port + 1):
                    ports.append({'module': mod, 'port': p})
        return ports

    def get_ports_for_leaf(self, node_id: int) -> Optional[list]:
        try:
            data_model = self.read_data_model()
            if not data_model:
                return []
            access = data_model.get('apic', {}).get('access_policies', {})

            intf_profile_names = []
            for swp in access.get('leaf_switch_profiles', []):
                for sel in swp.get('selectors', []):
                    for nb in sel.get('node_blocks', []):
                        nb_from = nb.get('from', 0)
                        nb_to = nb.get('to', nb_from)
                        if nb_from <= node_id <= nb_to:
                            intf_profile_names.extend(swp.get('interface_profiles', []))

            ports = []
            seen = set()
            for lip in access.get('leaf_interface_profiles', []):
                if lip.get('name') not in intf_profile_names:
                    continue
                for sel in lip.get('selectors', []):
                    policy_group = sel.get('policy_group', '')
                    expanded = self._expand_port_blocks(sel.get('port_blocks', []))
                    for p in expanded:
                        key = (p['module'], p['port'])
                        if key not in seen:
                            seen.add(key)
                            ports.append({
                                'module': p['module'],
                                'port': p['port'],
                                'policy_group': policy_group,
                                'selector_name': sel.get('name', '')
                            })

            ports.sort(key=lambda x: (x['module'], x['port']))
            return ports
        except Exception as e:
            logger.error(f"Error reading ports for leaf {node_id}: {str(e)}", exc_info=True)
            return None

    def get_available_epgs_for_port(self, node_id: int, module: int, port: int) -> Optional[list]:
        try:
            data_model = self.read_data_model()
            if not data_model:
                return []
            access = data_model.get('apic', {}).get('access_policies', {})

            # Trace port to policy group
            policy_group_name = None
            intf_profile_names = []
            for swp in access.get('leaf_switch_profiles', []):
                for sel in swp.get('selectors', []):
                    for nb in sel.get('node_blocks', []):
                        nb_from = nb.get('from', 0)
                        nb_to = nb.get('to', nb_from)
                        if nb_from <= node_id <= nb_to:
                            intf_profile_names.extend(swp.get('interface_profiles', []))

            for lip in access.get('leaf_interface_profiles', []):
                if lip.get('name') not in intf_profile_names:
                    continue
                for sel in lip.get('selectors', []):
                    expanded = self._expand_port_blocks(sel.get('port_blocks', []))
                    for p in expanded:
                        if p['module'] == module and p['port'] == port:
                            policy_group_name = sel.get('policy_group', '')
                            break
                    if policy_group_name:
                        break
                if policy_group_name:
                    break

            if not policy_group_name:
                return []

            # Resolve policy group to AAEP
            aaep_name = None
            for pg in access.get('leaf_interface_policy_groups', []):
                if pg.get('name') == policy_group_name:
                    aaep_name = pg.get('aaep')
                    break

            if not aaep_name:
                return []

            # Resolve AAEP to endpoint groups
            epg_bindings = []
            for aaep in access.get('aaeps', []):
                if aaep.get('name') == aaep_name:
                    epg_bindings = aaep.get('endpoint_groups', [])
                    break

            if not epg_bindings:
                return []

            # Filter out EPGs already bound on this node+module+port
            tenants = data_model.get('apic', {}).get('tenants', [])
            tenant_map = {t['name']: t for t in tenants}

            available = []
            existing = []
            for binding in epg_bindings:
                tenant_name = binding.get('tenant', '')
                ap_name = binding.get('application_profile', '')
                epg_name = binding.get('endpoint_group', '')
                vlan = binding.get('vlan')

                bound_mode = None
                tenant_obj = tenant_map.get(tenant_name, {})
                for ap in tenant_obj.get('application_profiles', []):
                    if ap.get('name') != ap_name:
                        continue
                    for epg in ap.get('endpoint_groups', []):
                        if epg.get('name') != epg_name:
                            continue
                        for sp in epg.get('static_ports', []):
                            if (sp.get('node_id') == node_id and
                                    sp.get('module', 1) == module and
                                    sp.get('port') == port):
                                bound_mode = sp.get('mode', 'regular')
                                break

                entry = {
                    'tenant': tenant_name,
                    'application_profile': ap_name,
                    'endpoint_group': epg_name,
                    'vlan': vlan,
                    'display': f"{epg_name} (VLAN {vlan})"
                }

                if bound_mode is not None:
                    entry['mode'] = bound_mode
                    existing.append(entry)
                else:
                    available.append(entry)

            return {'available': available, 'existing': existing}
        except Exception as e:
            logger.error(f"Error reading available EPGs for port: {str(e)}", exc_info=True)
            return None

    def test_connection(self) -> Dict[str, Any]:
        """
        Test connection to NaC API and verify configuration

        Returns:
            Dictionary with status and message
        """
        is_configured, error_msg = self._ensure_config()
        if not is_configured:
            return {
                'status': 'error',
                'message': error_msg
            }

        try:
            # Log connection attempt details
            test_url = f"{self.api_url}/api/v1/operations/read"
            logger.info(f"Testing connection to: {test_url}")
            logger.info(f"Authentication: passthrough {self.api_key[:10] if self.api_key else 'None'}...")
            logger.info(f"x-git-config: api_url={self.scm_api_url};repository={self.repository_url};type={self.scm_provider}")

            # Try to read data model as a connection test
            response = self.session.get(
                test_url,
                verify=False,
                timeout=10
            )

            logger.info(f"Response status: {response.status_code}")
            logger.info(f"Response headers: {dict(response.headers)}")

            if response.status_code in [200, 201]:
                return {
                    'status': 'success',
                    'message': f'Successfully connected to NaC API ({self.scm_provider})',
                    'scm_api_url': self.scm_api_url,
                    'scm_provider': self.scm_provider,
                    'size_of_data_model': len(response.content)
                }
            else:
                logger.error(f"Response body: {response.text[:500]}")
                return {
                    'status': 'error',
                    'message': f'NaC API returned status code {response.status_code}: {response.text[:200]}'
                }

        except requests.exceptions.Timeout:
            return {
                'status': 'error',
                'message': 'Connection test failed: Request timeout (10s)'
            }
        except requests.exceptions.ConnectionError:
            return {
                'status': 'error',
                'message': 'Connection test failed: Unable to connect to NaC API'
            }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'Connection test failed: {str(e)}'
            }

    # Generic NaC API operation methods

    def _operation_request(self, operation_type: str, path: str, data: Any,
                          change_message: Optional[str] = None,
                          apply: bool = False,
                          apply_title: Optional[str] = None,
                          apply_message: Optional[str] = None,
                          source: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        """
        Generic method to handle NaC API operations

        Args:
            operation_type: Type of operation (batch, merge, replace, delete, create, apply)
            path: Path within the data model (e.g., 'aci/vrfs', 'aci/bridge-domains')
            data: Data payload for the operation
            change_message: Optional message describing the change
            apply: Whether to apply the changeset immediately
            apply_title: Optional pull/merge request title
            apply_message: Optional message for the apply operation (pull/merge request body)
            source: Optional source information

        Returns:
            Response JSON data or None if request failed
        """
        is_configured, _ = self._ensure_config()
        if not is_configured:
            return None

        # Build operation payload
        operation_payload = {
            "operation": {
                "type": operation_type,
                "path": path,
                "data": data if isinstance(data, list) else [data],
            }
        }

        # Add optional fields
        if change_message:
            operation_payload["operation"]["change_message"] = change_message

        if apply is not None:
            operation_payload["operation"]["apply"] = apply

        if apply_title:
            operation_payload["operation"]["apply_title"] = apply_title

        if apply_message:
            operation_payload["operation"]["apply_message"] = apply_message

        if source:
            operation_payload["source"] = source

        # Call the operation endpoint
        endpoint = f"/api/v1/operations/{operation_type}"
        logger.info(f"Calling {operation_type} operation on path '{path}'")

        return self.post(endpoint, data=operation_payload)

    def batch_operation(self, changes: list,
                       changeset: Optional[str] = None,
                       apply: bool = False,
                       apply_title: Optional[str] = None,
                       apply_message: Optional[str] = None,
                       source: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        """
        Execute a batch operation on NaC API

        Batch operations allow multiple changes (create, merge, replace, delete) to be submitted together.

        Args:
            changes: List of change dictionaries, each containing:
                - type: Operation type (create, merge, replace, delete)
                - path: Path within the data model (e.g., 'aci/vrfs', 'aci/bridge-domains')
                - change_message: Optional message describing the change
                - data: Data payload (for create/merge/replace operations)
                - file: Optional file reference
            changeset: Optional changeset identifier
            apply: Whether to apply the changeset immediately
            apply_title: Optional pull/merge request title
            apply_message: Optional message for the apply operation (pull/merge request body)
            source: Optional source information (dict with 'name' and 'repository' keys)

        Returns:
            Response JSON data or None if request failed

        Example:
            changes = [
                {
                    "type": "merge",
                    "path": "aci/vrfs",
                    "change_message": "Add VRF_PROD",
                    "data": {"name": "VRF_PROD", "tenant": "production"}
                },
                {
                    "type": "merge",
                    "path": "aci/bridge-domains",
                    "change_message": "Add BD_PROD_WEB",
                    "data": {"name": "BD_PROD_WEB", "vrf": "VRF_PROD", "tenant": "production"}
                }
            ]
            client.batch_operation(changes, apply=False)
        """
        is_configured, _ = self._ensure_config()
        if not is_configured:
            return None

        # Build batch operation payload
        batch_payload = {
            "operation": {
                "changes": changes,
                "apply": apply
            }
        }

        # Add optional fields
        if changeset:
            batch_payload["operation"]["changeset"] = changeset

        if apply_title:
            batch_payload["operation"]["apply_title"] = apply_title

        if apply_message:
            batch_payload["operation"]["apply_message"] = apply_message

        if source:
            batch_payload["source"] = source

        # Call the batch operation endpoint
        logger.info(f"Calling batch operation with {len(changes)} changes")

        return self.post("/api/v1/operations/batch", data=batch_payload)

    def merge_operation(self, path: str, data: Any,
                       change_message: Optional[str] = None,
                       apply: bool = False,
                       apply_title: Optional[str] = None,
                       apply_message: Optional[str] = None,
                       source: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        """
        Execute a merge operation on NaC API

        Args:
            path: Path within the data model (e.g., 'aci/vrfs', 'aci/bridge-domains')
            data: Data payload for the merge operation (list or single item)
            change_message: Optional message describing the change
            apply: Whether to apply the changeset immediately
            apply_title: Optional pull/merge request title
            apply_message: Optional message for the apply operation (pull/merge request body)
            source: Optional source information

        Returns:
            Response JSON data or None if request failed
        """
        return self._operation_request("merge", path, data, change_message, apply, apply_title, apply_message, source)

    def replace_operation(self, path: str, data: Any,
                         change_message: Optional[str] = None,
                         apply: bool = False,
                         apply_title: Optional[str] = None,
                         apply_message: Optional[str] = None,
                         source: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        """
        Execute a replace operation on NaC API

        Args:
            path: Path within the data model (e.g., 'aci/vrfs', 'aci/bridge-domains')
            data: Data payload for the replace operation (list or single item)
            change_message: Optional message describing the change
            apply: Whether to apply the changeset immediately
            apply_title: Optional pull/merge request title
            apply_message: Optional message for the apply operation (pull/merge request body)
            source: Optional source information

        Returns:
            Response JSON data or None if request failed
        """
        return self._operation_request("replace", path, data, change_message, apply, apply_title, apply_message, source)

    def delete_operation(self, path: str, data: Any,
                        change_message: Optional[str] = None,
                        apply: bool = False,
                        apply_title: Optional[str] = None,
                        apply_message: Optional[str] = None,
                        source: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        """
        Execute a delete operation on NaC API

        Args:
            path: Path within the data model (e.g., 'aci/vrfs', 'aci/bridge-domains')
            data: Data payload for the delete operation (list or single item)
            change_message: Optional message describing the change
            apply: Whether to apply the changeset immediately
            apply_title: Optional pull/merge request title
            apply_message: Optional message for the apply operation (pull/merge request body)
            source: Optional source information

        Returns:
            Response JSON data or None if request failed
        """
        return self._operation_request("delete", path, data, change_message, apply, apply_title, apply_message, source)

    def create_operation(self, path: str, data: Any,
                        change_message: Optional[str] = None,
                        apply: bool = False,
                        apply_title: Optional[str] = None,
                        apply_message: Optional[str] = None,
                        source: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        """
        Execute a create operation on NaC API

        Args:
            path: Path within the data model (e.g., 'aci/vrfs', 'aci/bridge-domains')
            data: Data payload for the create operation (list or single item)
            change_message: Optional message describing the change
            apply: Whether to apply the changeset immediately
            apply_title: Optional pull/merge request title
            apply_message: Optional message for the apply operation (pull/merge request body)
            source: Optional source information

        Returns:
            Response JSON data or None if request failed
        """
        return self._operation_request("create", path, data, change_message, apply, apply_title, apply_message, source)

    def apply_operation(self, path: str, data: Any,
                       change_message: Optional[str] = None,
                       apply: bool = False,
                       apply_title: Optional[str] = None,
                       apply_message: Optional[str] = None,
                       source: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        """
        Execute an apply operation on NaC API

        Args:
            path: Path within the data model (e.g., 'aci/vrfs', 'aci/bridge-domains')
            data: Data payload for the apply operation (list or single item)
            change_message: Optional message describing the change
            apply: Whether to apply the changeset immediately
            apply_title: Optional pull/merge request title
            apply_message: Optional message for the apply operation (pull/merge request body)
            source: Optional source information

        Returns:
            Response JSON data or None if request failed
        """
        return self._operation_request("apply", path, data, change_message, apply, apply_title, apply_message, source)

    def close(self):
        """Close the session"""
        self.session.close()



# Singleton instance for reuse across the application
_nac_client_instance = None


def get_nac_client(reload_config: bool = False) -> NacApiClient:
    """
    Get or create singleton NaC API client instance

    Args:
        reload_config: If True, force reload of configuration from file

    Returns:
        NacApiClient instance
    """
    global _nac_client_instance

    if _nac_client_instance is None:
        _nac_client_instance = NacApiClient()
    elif reload_config:
        # Reload configuration for existing client
        _nac_client_instance._load_config()
        _nac_client_instance._set_auth_headers()
        logger.info("NaC API client configuration reloaded")

    return _nac_client_instance


def reset_nac_client():
    """
    Reset the singleton NaC API client instance.
    This forces a fresh client to be created on next get_nac_client() call.
    """
    global _nac_client_instance
    _nac_client_instance = None
    logger.info("NaC API client instance reset")
