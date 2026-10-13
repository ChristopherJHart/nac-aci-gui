"""
NaC API endpoints for UI
"""
from flask import Blueprint, jsonify, request
from ...nac_api import get_nac_client
from ...netbox_api import get_netbox_client
import logging
import yaml
import os
from pathlib import Path
import re

logger = logging.getLogger(__name__)

nac_bp = Blueprint('nac', __name__)


def _generate_slug(name: str) -> str:
    slug = name.lower().strip()
    slug = re.sub(r'[^a-z0-9\s_-]', '', slug)
    slug = re.sub(r'[\s]+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    return slug.strip('-')


@nac_bp.route('/tenants', methods=['GET'])
def get_tenants():
    """
    Get Tenants from NaC API data model (apic/tenants path)
    ---
    tags:
      - NaC API
    summary: Get Tenants
    description: Gets all tenants from the NaC API data model at apic/tenants path
    responses:
      200:
        description: Tenant data retrieved successfully
        schema:
          type: object
          properties:
            status:
              type: string
              example: success
            data:
              type: array
              items:
                type: object
                properties:
                  name:
                    type: string
                    example: "production"
                  alias:
                    type: string
                    example: "prod"
                  description:
                    type: string
                    example: "Production tenant"
      500:
        description: Failed to retrieve tenant data
        schema:
          type: object
          properties:
            status:
              type: string
              example: error
            message:
              type: string
              example: "Failed to retrieve tenant data"
    """
    try:
        logger.info("Tenants endpoint called")
        client = get_nac_client()
        tenant_list = client.get_tenants_for_table()

        if tenant_list is not None:
            logger.info(f"Returning {len(tenant_list)} tenants")
            return jsonify({
                'status': 'success',
                'data': tenant_list
            })
        else:
            logger.error("Failed to retrieve tenant data from client")
            return jsonify({
                'status': 'error',
                'message': 'Failed to retrieve tenant data from NaC API'
            }), 500

    except Exception as e:
        logger.error(f"Error in tenants endpoint: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'Failed to retrieve tenant data: {str(e)}'
        }), 500


@nac_bp.route('/bridge-domains', methods=['GET'])
def get_bridge_domains():
    """
    Get Bridge Domains for a specific tenant from NaC API data model
    ---
    tags:
      - NaC API
    summary: Get Bridge Domains
    description: Gets bridge domains for a specific tenant from apic/tenants/name={tenant}/bridge_domains
    parameters:
      - in: query
        name: tenant
        type: string
        required: true
        description: Name of the tenant to get bridge domains for
        example: "production"
    responses:
      200:
        description: Bridge domain data retrieved successfully
        schema:
          type: object
          properties:
            status:
              type: string
              example: success
            data:
              type: array
              items:
                type: object
                properties:
                  name:
                    type: string
                    example: "BD_PROD"
                  tenant:
                    type: string
                    example: "production"
                  vrf:
                    type: string
                    example: "VRF_PROD"
                  l2_unknown_unicast:
                    type: string
                    example: "proxy"
                  arp_flooding:
                    type: boolean
                    example: false
      400:
        description: Missing tenant parameter
      500:
        description: Failed to retrieve bridge domain data
    """
    try:
        # Get tenant parameter from query string
        tenant_name = request.args.get('tenant')

        if not tenant_name:
            return jsonify({
                'status': 'error',
                'message': 'Missing required parameter: tenant'
            }), 400

        logger.info(f"Bridge Domains endpoint called for tenant: {tenant_name}")
        client = get_nac_client()
        bd_list = client.get_bridge_domains_for_tenant(tenant_name)

        if bd_list is not None:
            logger.info(f"Returning {len(bd_list)} bridge domains for tenant '{tenant_name}'")
            return jsonify({
                'status': 'success',
                'data': bd_list
            })
        else:
            logger.error(f"Failed to retrieve bridge domain data for tenant '{tenant_name}'")
            return jsonify({
                'status': 'error',
                'message': f'Failed to retrieve bridge domain data for tenant {tenant_name}'
            }), 500

    except Exception as e:
        logger.error(f"Error in bridge domains endpoint: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'Failed to retrieve bridge domain data: {str(e)}'
        }), 500


@nac_bp.route('/tenant-vrfs', methods=['GET'])
def get_tenant_vrfs():
    """
    Get VRFs for a specific tenant from NaC API data model
    ---
    tags:
      - NaC API
    summary: Get VRFs for Tenant
    description: Gets VRFs for a specific tenant from apic/tenants/name={tenant}/vrfs
    parameters:
      - in: query
        name: tenant
        type: string
        required: true
        description: Name of the tenant to get VRFs for
        example: "production"
    responses:
      200:
        description: VRF data retrieved successfully
        schema:
          type: object
          properties:
            status:
              type: string
              example: success
            data:
              type: array
              items:
                type: object
                properties:
                  name:
                    type: string
                    example: "VRF_PROD"
                  tenant:
                    type: string
                    example: "production"
                  alias:
                    type: string
                    example: "prod-vrf"
                  description:
                    type: string
                    example: "Production VRF"
      400:
        description: Missing tenant parameter
      500:
        description: Failed to retrieve VRF data
    """
    try:
        # Get tenant parameter from query string
        tenant_name = request.args.get('tenant')

        if not tenant_name:
            return jsonify({
                'status': 'error',
                'message': 'Missing required parameter: tenant'
            }), 400

        logger.info(f"Tenant VRFs endpoint called for tenant: {tenant_name}")
        client = get_nac_client()
        vrf_list = client.get_vrfs_for_tenant(tenant_name)

        if vrf_list is not None:
            logger.info(f"Returning {len(vrf_list)} VRFs for tenant '{tenant_name}'")
            return jsonify({
                'status': 'success',
                'data': vrf_list
            })
        else:
            logger.error(f"Failed to retrieve VRF data for tenant '{tenant_name}'")
            return jsonify({
                'status': 'error',
                'message': f'Failed to retrieve VRF data for tenant {tenant_name}'
            }), 500

    except Exception as e:
        logger.error(f"Error in tenant VRFs endpoint: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'Failed to retrieve VRF data: {str(e)}'
        }), 500


@nac_bp.route('/vrfs', methods=['GET'])
def get_vrfs():
    """
    Get VRFs from NaC API
    ---
    tags:
      - NaC API
    summary: Get VRFs
    description: Gets all VRFs from the NaC API data model
    responses:
      200:
        description: VRF data retrieved successfully
        schema:
          type: object
          properties:
            status:
              type: string
              example: success
            data:
              type: array
              items:
                type: object
      500:
        description: Failed to retrieve VRF data
        schema:
          type: object
          properties:
            status:
              type: string
              example: error
            message:
              type: string
              example: "Failed to retrieve VRF data"
    """
    try:
        logger.info("VRF endpoint called")
        client = get_nac_client()
        vrf_list = client.get_vrfs_for_table()

        if vrf_list is not None:
            logger.info(f"Returning {len(vrf_list)} VRFs")
            return jsonify({
                'status': 'success',
                'data': vrf_list
            })
        else:
            logger.error("Failed to retrieve VRF data from client")
            return jsonify({
                'status': 'error',
                'message': 'Failed to retrieve VRF data from NaC API'
            }), 500

    except Exception as e:
        logger.error(f"Error in VRF endpoint: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'Failed to retrieve VRF data: {str(e)}'
        }), 500


@nac_bp.route('/networks', methods=['GET'])
def get_networks():
    """
    Get Networks from NaC API
    ---
    tags:
      - NaC API
    summary: Get Networks
    description: Gets all networks from the NaC API data model
    responses:
      200:
        description: Network data retrieved successfully
      500:
        description: Failed to retrieve network data
    """
    try:
        logger.info("Network endpoint called")
        client = get_nac_client()
        network_list = client.get_networks_for_table()

        if network_list is not None:
            logger.info(f"Returning {len(network_list)} networks")
            return jsonify({
                'status': 'success',
                'data': network_list
            })
        else:
            logger.error("Failed to retrieve network data from client")
            return jsonify({
                'status': 'error',
                'message': 'Failed to retrieve network data from NaC API'
            }), 500

    except Exception as e:
        logger.error(f"Error in network endpoint: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'Failed to retrieve network data: {str(e)}'
        }), 500


@nac_bp.route('/switches', methods=['GET'])
def get_switches():
    """
    Get Switches from NaC API
    ---
    tags:
      - NaC API
    summary: Get Switches
    description: Gets all switches from the NaC API data model
    responses:
      200:
        description: Switch data retrieved successfully
      500:
        description: Failed to retrieve switch data
    """
    try:
        logger.info("Switch endpoint called")
        client = get_nac_client()
        switch_list = client.get_switches_for_table()

        if switch_list is not None:
            logger.info(f"Returning {len(switch_list)} switches")
            return jsonify({
                'status': 'success',
                'data': switch_list
            })
        else:
            logger.error("Failed to retrieve switch data from client")
            return jsonify({
                'status': 'error',
                'message': 'Failed to retrieve switch data from NaC API'
            }), 500

    except Exception as e:
        logger.error(f"Error in switch endpoint: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'Failed to retrieve switch data: {str(e)}'
        }), 500


@nac_bp.route('/fabric', methods=['GET'])
def get_fabric():
    """
    Get Fabric details from NaC API
    ---
    tags:
      - NaC API
    summary: Get Fabric Details
    description: Gets fabric details from vxlan/global and vxlan/fabric endpoints
    responses:
      200:
        description: Fabric data retrieved successfully
      500:
        description: Failed to retrieve fabric data
    """
    try:
        logger.info("Fabric endpoint called")
        client = get_nac_client()
        fabric_data = client.get_fabric_details()

        if fabric_data is not None:
            logger.info("Returning fabric details")
            return jsonify({
                'status': 'success',
                'data': fabric_data
            })
        else:
            logger.error("Failed to retrieve fabric data from client")
            return jsonify({
                'status': 'error',
                'message': 'Failed to retrieve fabric data from NaC API'
            }), 500

    except Exception as e:
        logger.error(f"Error in fabric endpoint: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'Failed to retrieve fabric data: {str(e)}'
        }), 500


@nac_bp.route('/interfaces', methods=['GET'])
def get_interfaces():
    """
    Get Interfaces from NaC API
    ---
    tags:
      - NaC API
    summary: Get Interfaces
    description: Gets all interfaces from the NaC API data model (extracted from switches)
    responses:
      200:
        description: Interface data retrieved successfully
      500:
        description: Failed to retrieve interface data
    """
    try:
        logger.info("Interface endpoint called")
        client = get_nac_client()
        interface_list = client.get_interfaces_for_table()

        if interface_list is not None:
            logger.info(f"Returning {len(interface_list)} interfaces")
            return jsonify({
                'status': 'success',
                'data': interface_list
            })
        else:
            logger.error("Failed to retrieve interface data from client")
            return jsonify({
                'status': 'error',
                'message': 'Failed to retrieve interface data from NaC API'
            }), 500

    except Exception as e:
        logger.error(f"Error in interface endpoint: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'Failed to retrieve interface data: {str(e)}'
        }), 500


@nac_bp.route('/network-attach-groups', methods=['GET'])
def get_network_attach_groups():
    """
    Get Network Attach Groups from NaC API
    ---
    tags:
      - NaC API
    summary: Get Network Attach Groups
    description: Gets all network attach groups from vxlan/overlay/network_attach_groups
    responses:
      200:
        description: Network attach groups retrieved successfully
        schema:
          type: object
          properties:
            status:
              type: string
              example: success
            data:
              type: array
              items:
                type: object
                properties:
                  name:
                    type: string
                    example: "ATTACH_GROUP_1"
      500:
        description: Failed to retrieve network attach groups
    """
    try:
        logger.info("Network Attach Groups endpoint called")
        client = get_nac_client()

        # Use the client's method to get network attach groups
        attach_groups_list = client.get_network_attach_groups_full()

        if attach_groups_list is not None:
            logger.info(f"Returning {len(attach_groups_list)} network attach groups")
            return jsonify({
                'status': 'success',
                'data': attach_groups_list
            })
        else:
            logger.error("Failed to retrieve network attach groups from client")
            return jsonify({
                'status': 'error',
                'message': 'Failed to retrieve network attach groups from NaC API'
            }), 500

    except Exception as e:
        logger.error(f"Error in network attach groups endpoint: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'Failed to retrieve network attach groups: {str(e)}'
        }), 500


@nac_bp.route('/vrfs/merge', methods=['POST'])
def merge_vrf():
    """
    Merge a new VRF in NaC API
    ---
    tags:
      - NaC API
    summary: Merge VRF
    description: Merges a new VRF into the NaC API data model using merge operation
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - name
            - vrf_id
            - vlan_id
          properties:
            name:
              type: string
              description: VRF name
              example: "VRF_PROD"
            vrf_id:
              type: integer
              description: VRF ID
              example: 50001
            vlan_id:
              type: integer
              description: VLAN ID
              example: 2001
            vrf_vlan_name:
              type: string
              description: VRF VLAN name (optional)
              example: "VLAN_PROD"
            vrf_description:
              type: string
              description: VRF description (optional)
              example: "Production VRF"
            change_message:
              type: string
              description: Optional change message for the merge operation
              example: "Adding new VRF"
            apply:
              type: boolean
              description: Whether to apply the changeset immediately
              example: false
            apply_message:
              type: string
              description: Optional message for the apply operation
              example: "Applying VRF changes"
    responses:
      200:
        description: VRF merged successfully
        schema:
          type: object
          properties:
            status:
              type: string
              example: success
            message:
              type: string
              example: "VRF merged successfully"
            data:
              type: object
      400:
        description: Invalid request data
      500:
        description: Failed to merge VRF
    """
    try:
        logger.info("Merge VRF endpoint called")

        # Get request data
        data = request.get_json()

        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No data provided'
            }), 400

        # Validate required fields
        required_fields = ['name', 'vrf_id', 'vlan_id']
        missing_fields = [field for field in required_fields if field not in data]

        if missing_fields:
            return jsonify({
                'status': 'error',
                'message': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400

        # Get NaC client
        client = get_nac_client()

        # Create VRF data with required fields
        vrf_data = {
            'name': data['name'],
            'vrf_id': data['vrf_id'],
            'vlan_id': data['vlan_id']
        }

        # Add optional fields if provided
        if 'vrf_vlan_name' in data and data['vrf_vlan_name']:
            vrf_data['vrf_vlan_name'] = data['vrf_vlan_name']

        if 'vrf_description' in data and data['vrf_description']:
            vrf_data['vrf_description'] = data['vrf_description']

        logger.info(f"Merging VRF: {vrf_data}")

        # Call NaC API merge operation using the client's merge_operation method
        response = client.merge_operation(
            path='vxlan/overlay/vrfs',
            data=vrf_data,
            change_message=data.get('change_message', f"Adding VRF {data['name']}"),
            apply=data.get('apply', False),
            apply_title=data.get('apply_title', f"Add VXLAN VRF: {data['name']}"),
            apply_message=data.get('apply_message',
                                   f"## VRF Configuration\n\n"
                                   f"- **VRF Name**: {data['name']}\n"
                                   f"- **VRF ID**: {data['vrf_id']}\n"
                                   f"- **VLAN ID**: {data['vlan_id']}\n"
                                   f"\nSubmitted via NAC ACI GUI."),
            source=data.get('source')
        )

        if response:
            logger.info(f"VRF merged successfully: {data['name']}")
            return jsonify({
                'status': 'success',
                'message': f"VRF '{data['name']}' merged successfully",
                'data': response
            })
        else:
            logger.error("Failed to merge VRF - NaC API returned None")
            return jsonify({
                'status': 'error',
                'message': 'Failed to merge VRF in NaC API'
            }), 500

    except Exception as e:
        logger.error(f"Error in merge VRF endpoint: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'Failed to merge VRF: {str(e)}'
        }), 500


def load_network_template(template_vars: dict) -> dict:
    """
    Load network template from YAML file and replace template variables.

    Args:
        template_vars: Dictionary containing variable names and their values
                      e.g., {'name': 'NET_PROD', 'vrf_name': 'VRF_PROD', ...}

    Returns:
        Dictionary with template variables replaced and defaults preserved
    """
    try:
        # Get the path to the YAML template file
        template_path = Path(__file__).parent.parent.parent.parent.parent/ 'yaml' / 'nac-network.yaml'

        if not template_path.exists():
            logger.error(f"Network template file not found: {template_path}")
            return None

        # Read the YAML template as text
        with open(template_path, 'r') as f:
            template_content = f.read()

        # Replace template variables using regex
        # Pattern matches {{ variable_name }} and replaces with actual values
        for var_name, var_value in template_vars.items():
            pattern = r'\{\{\s*' + re.escape(var_name) + r'\s*\}\}'
            template_content = re.sub(pattern, str(var_value), template_content)

        # Parse the resulting YAML into a dictionary
        network_data = yaml.safe_load(template_content)

        logger.info(f"Network template loaded with variables: {list(template_vars.keys())}")
        return network_data

    except Exception as e:
        logger.error(f"Error loading network template: {str(e)}", exc_info=True)
        return None


@nac_bp.route('/networks/merge', methods=['POST'])
def merge_network():
    """
    Merge a new Network in NaC API using YAML template
    ---
    tags:
      - NaC API
    summary: Merge Network
    description: |
      Merges a new network into the NaC API data model using merge operation.
      Uses a YAML template (yaml/nac-network.yaml) with default values.
      Template variables are replaced with provided values, while non-template
      fields maintain their default values from the template.
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - name
            - vrf_name
            - net_id
            - vlan_id
            - vlan_name
            - gw_ip_address
            - network_attach_group
          properties:
            name:
              type: string
              description: Network name
              example: "NET_PROD_WEB"
            vrf_name:
              type: string
              description: Associated VRF name
              example: "VRF_PROD"
            net_id:
              type: integer
              description: Network ID (VNID)
              example: 30001
            vlan_id:
              type: integer
              description: VLAN ID
              example: 101
            vlan_name:
              type: string
              description: VLAN name
              example: "vlan_net_prod_web"
            gw_ip_address:
              type: string
              description: Gateway IP address in CIDR notation
              example: "10.1.1.1/24"
            network_attach_group:
              type: string
              description: Network attach group name (from NaC API attach groups)
              example: "ATTACH_GROUP_1"
            change_message:
              type: string
              description: Optional change message for the merge operation
              example: "Adding new production network"
            apply:
              type: boolean
              description: Whether to apply the changeset immediately
              example: false
            apply_message:
              type: string
              description: Optional message for the apply operation
              example: "Applying network changes"
    responses:
      200:
        description: Network merged successfully
        schema:
          type: object
          properties:
            status:
              type: string
              example: success
            message:
              type: string
              example: "Network merged successfully"
            data:
              type: object
      400:
        description: Invalid request data or missing required fields
      500:
        description: Failed to merge network or load template
    """
    try:
        logger.info("Merge Network endpoint called")

        # Get request data
        data = request.get_json()

        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No data provided'
            }), 400

        # Validate required fields (matching template variables)
        required_fields = ['name', 'vrf_name', 'net_id', 'vlan_id', 'vlan_name', 'gw_ip_address', 'network_attach_group']
        missing_fields = [field for field in required_fields if field not in data]

        if missing_fields:
            return jsonify({
                'status': 'error',
                'message': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400

        # Get NaC client
        client = get_nac_client()

        # Prepare template variables mapping
        # Map incoming data fields to template variable names
        template_vars = {
            'name': data['name'],
            'vrf_name': data['vrf_name'],
            'vnid': data['net_id'],                    # Template uses 'vnid', API uses 'net_id'
            'vlan_id': data['vlan_id'],
            'vlan_name': data['vlan_name'],
            'vlan_gateway_ip': data['gw_ip_address'],  # Template uses 'vlan_gateway_ip', API uses 'gw_ip_address'
            'network_attach_group': data['network_attach_group']
        }

        # Load network template with variable substitution
        network_data = load_network_template(template_vars)

        if not network_data:
            return jsonify({
                'status': 'error',
                'message': 'Failed to load network template'
            }), 500

        logger.info(f"Merging Network with template: {network_data}")

        # Call NaC API merge operation using the client's merge_operation method
        response = client.merge_operation(
            path='vxlan/overlay/networks',
            data=network_data,
            change_message=data.get('change_message', f"Adding network {data['name']}"),
            apply=data.get('apply', False),
            apply_title=data.get('apply_title', f"Add VXLAN Network: {data['name']}"),
            apply_message=data.get('apply_message',
                                   f"## Network Configuration\n\n"
                                   f"- **Network Name**: {data['name']}\n"
                                   f"- **VRF**: {data.get('vrf_name', 'N/A')}\n"
                                   f"- **Network ID**: {data.get('net_id', 'N/A')}\n"
                                   f"- **VLAN ID**: {data.get('vlan_id', 'N/A')}\n"
                                   f"\nSubmitted via NAC ACI GUI."),
            source=data.get('source')
        )

        if response:
            logger.info(f"Network merged successfully: {data['name']}")
            return jsonify({
                'status': 'success',
                'message': f"Network '{data['name']}' merged successfully",
                'data': response
            })
        else:
            logger.error("Failed to merge Network - NaC API returned None")
            return jsonify({
                'status': 'error',
                'message': 'Failed to merge Network in NaC API'
            }), 500

    except Exception as e:
        logger.error(f"Error in merge Network endpoint: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'Failed to merge Network: {str(e)}'
        }), 500


@nac_bp.route('/create-network', methods=['POST'])
def create_network():
    """
    Create a new network (Bridge Domain) in NaC API
    ---
    tags:
      - NaC API
    summary: Create Network
    description: |
      Creates a new network by:
      1. Requesting next available /24 prefix from NetBox
      2. Using the nac-aci-bd.yaml template to create bridge domain structure
      3. Sending merge operation to NaC API at apic/tenants/name={tenant}/bridge_domains
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - tenant
            - vrf
            - network_name
          properties:
            tenant:
              type: string
              description: Tenant name
              example: "production"
            vrf:
              type: string
              description: VRF name
              example: "VRF_PROD"
            network_name:
              type: string
              description: Network/Bridge Domain name
              example: "BD_PROD_WEB"
    responses:
      200:
        description: Network created successfully
      400:
        description: Missing required parameters
      500:
        description: Failed to create network
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No JSON data provided'
            }), 400

        # Validate required fields
        tenant = data.get('tenant')
        vrf = data.get('vrf')
        network_name = data.get('network_name')

        if not all([tenant, vrf, network_name]):
            return jsonify({
                'status': 'error',
                'message': 'Missing required fields: tenant, vrf, network_name'
            }), 400

        logger.info(f"Creating network: tenant={tenant}, vrf={vrf}, network_name={network_name}")

        # Step 1: Load NetBox configuration to get prefix ID
        # Navigate from api/v1/nac.py up to project root (5 levels)
        # nac.py -> v1/ -> api/ -> nac_aci_gui/ -> src/ -> project_root/
        project_root = Path(__file__).parent.parent.parent.parent.parent
        config_path = project_root / 'yaml' / 'config.yaml'

        logger.info(f"Loading config from: {config_path}")

        netbox_prefix_id = None
        with open(config_path, 'r') as f:
            config = yaml.safe_load(f)
            prefix_settings = config.get('netbox', {}).get('prefix_settings', [])
            if prefix_settings and len(prefix_settings) > 0:
                # Use the first prefix setting - field is 'prefix_id' not 'id'
                netbox_prefix_id = prefix_settings[0].get('prefix_id')

        if not netbox_prefix_id:
            return jsonify({
                'status': 'error',
                'message': 'NetBox prefix not configured. Please configure prefix settings in Admin panel.'
            }), 400

        logger.info(f"Using NetBox prefix ID: {netbox_prefix_id}")

        # Step 2: Get next available /24 prefix from NetBox
        netbox_client = get_netbox_client()

        # First, we need to create or get a VLAN for this network
        # For now, we'll create the prefix without a VLAN association
        # The create_available_prefix method requires a vlan_id, so we'll use a simplified approach
        endpoint = f'/api/ipam/prefixes/{netbox_prefix_id}/available-prefixes/'
        payload = {
            "prefix_length": 24,
            "description": f"Subnet for {network_name} Bridge Domain"
        }

        logger.info(f"Requesting next available /24 from prefix {netbox_prefix_id}")
        prefix_response = netbox_client.post(endpoint, payload)

        if not prefix_response:
            return jsonify({
                'status': 'error',
                'message': 'Failed to allocate prefix from NetBox'
            }), 500

        # Handle both list and dict responses
        if isinstance(prefix_response, list) and len(prefix_response) > 0:
            allocated_prefix = prefix_response[0].get('prefix')
        elif isinstance(prefix_response, dict):
            allocated_prefix = prefix_response.get('prefix')
        else:
            return jsonify({
                'status': 'error',
                'message': 'Unexpected response format from NetBox'
            }), 500

        logger.info(f"Allocated prefix from NetBox: {allocated_prefix}")

        # Convert prefix to gateway IP (first usable IP, e.g., 10.0.1.0/24 -> 10.0.1.1/24)
        prefix_parts = allocated_prefix.split('/')
        ip_parts = prefix_parts[0].split('.')
        ip_parts[3] = '1'  # Set last octet to 1 for gateway
        gateway_ip = '.'.join(ip_parts) + '/' + prefix_parts[1]

        logger.info(f"Gateway IP for bridge domain: {gateway_ip}")

        # Step 3: Load and populate the YAML template from package templates directory
        package_dir = Path(__file__).parent.parent.parent  # src/nac_aci_gui/
        template_path = package_dir / 'templates' / 'nac-aci-bd.yaml'

        logger.info(f"Loading template from: {template_path}")

        with open(template_path, 'r') as f:
            template_content = f.read()

        # Replace template variables
        bd_yaml = template_content.replace('{{ bd_name }}', network_name)
        bd_yaml = bd_yaml.replace('{{bd_name}}', network_name)
        bd_yaml = bd_yaml.replace('{{ vrf_name }}', vrf)
        bd_yaml = bd_yaml.replace('{{vrf_name}}', vrf)
        bd_yaml = bd_yaml.replace('{{ bd_subnet }}', gateway_ip)
        bd_yaml = bd_yaml.replace('{{bd_subnet}}', gateway_ip)

        # Parse the populated YAML
        bd_data = yaml.safe_load(bd_yaml)

        logger.info(f"Bridge Domain data prepared: {bd_data}")

        # Step 4: Send merge operation to NaC API
        nac_client = get_nac_client()
        path = f"apic/tenants/name={tenant}/bridge_domains"

        response = nac_client.merge_operation(
            path=path,
            data=bd_data,
            change_message=f"Creating bridge domain {network_name} in tenant {tenant}",
            apply=False,  # Don't auto-apply, let user review
            apply_title=f"Add Bridge Domain: {network_name} (tenant: {tenant})",
            apply_message=f"## Bridge Domain Configuration\n\n"
                          f"- **Tenant**: {tenant}\n"
                          f"- **VRF**: {vrf}\n"
                          f"- **Bridge Domain**: {network_name}\n"
                          f"- **Subnet**: {gateway_ip}\n"
                          f"- **Allocated Prefix**: {allocated_prefix}\n"
                          f"\nSubnet allocated from NetBox. Submitted via NAC ACI GUI."
        )

        if response:
            logger.info(f"Network created successfully: {network_name}")
            return jsonify({
                'status': 'success',
                'message': f"Network '{network_name}' created successfully",
                'data': {
                    'tenant': tenant,
                    'vrf': vrf,
                    'network_name': network_name,
                    'subnet': gateway_ip,
                    'allocated_prefix': allocated_prefix,
                    'bridge_domain': bd_data,
                    'nac_response': response
                }
            })
        else:
            logger.error("Failed to create network - NaC API returned None")
            return jsonify({
                'status': 'error',
                'message': 'Failed to create network in NaC API'
            }), 500

    except FileNotFoundError as e:
        logger.error(f"Template or config file not found: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Configuration file not found: {str(e)}'
        }), 500
    except Exception as e:
        logger.error(f"Error in create network endpoint: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'Failed to create network: {str(e)}'
        }), 500


@nac_bp.route('/create-tenant', methods=['POST'])
def create_tenant():
    """Create a new tenant in both NetBox and the NaC data model"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No JSON data provided'
            }), 400

        name = data.get('name')
        if not name:
            return jsonify({
                'status': 'error',
                'message': 'Missing required field: name'
            }), 400

        description = data.get('description', '')
        slug = _generate_slug(name)

        logger.info(f"Creating tenant: name={name}, slug={slug}")

        # Step 1: Create tenant in NetBox
        netbox_client = get_netbox_client()
        netbox_payload = {
            'name': name,
            'slug': slug,
        }
        if description:
            netbox_payload['description'] = description

        netbox_response = netbox_client.post('/api/tenancy/tenants/', netbox_payload)

        if not netbox_response:
            return jsonify({
                'status': 'error',
                'message': 'Failed to create tenant in NetBox'
            }), 500

        logger.info(f"Tenant created in NetBox: {netbox_response.get('name')}")

        # Step 2: Merge tenant into NaC data model
        nac_client = get_nac_client()
        tenant_data = {'name': name}
        if description:
            tenant_data['description'] = description

        nac_response = nac_client.merge_operation(
            path='apic/tenants',
            data=tenant_data,
            change_message=f"Creating tenant {name} via GUI",
            apply=False,
            apply_title=f"Add Tenant: {name}",
            apply_message=f"## Tenant Configuration\n\n"
                          f"- **Tenant Name**: {name}\n"
                          f"- **Description**: {description or 'N/A'}\n"
                          f"\nTenant also created in NetBox. Submitted via NAC ACI GUI."
        )

        if nac_response:
            logger.info(f"Tenant created in NaC data model: {name}")
            return jsonify({
                'status': 'success',
                'message': f"Tenant '{name}' created successfully",
                'data': {
                    'name': name,
                    'description': description,
                    'netbox_tenant': netbox_response,
                    'nac_response': nac_response
                }
            })
        else:
            logger.error("Tenant created in NetBox but NaC API merge failed")
            return jsonify({
                'status': 'partial',
                'message': f"Tenant '{name}' created in NetBox but failed to update NaC data model",
                'data': {
                    'name': name,
                    'netbox_tenant': netbox_response
                }
            }), 500

    except Exception as e:
        logger.error(f"Error in create tenant endpoint: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'Failed to create tenant: {str(e)}'
        }), 500


@nac_bp.route('/create-vrf', methods=['POST'])
def create_vrf():
    """Create a new VRF under a tenant in both NetBox and the NaC data model"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No JSON data provided'
            }), 400

        tenant = data.get('tenant')
        name = data.get('name')

        if not all([tenant, name]):
            return jsonify({
                'status': 'error',
                'message': 'Missing required fields: tenant, name'
            }), 400

        description = data.get('description', '')

        logger.info(f"Creating VRF: tenant={tenant}, name={name}")

        # Step 1: Look up tenant ID in NetBox
        netbox_client = get_netbox_client()
        tenant_lookup = netbox_client.get('/api/tenancy/tenants/', params={'name': tenant})

        if not tenant_lookup or tenant_lookup.get('count', 0) == 0:
            return jsonify({
                'status': 'error',
                'message': f"Tenant '{tenant}' not found in NetBox"
            }), 400

        tenant_id = tenant_lookup['results'][0]['id']
        logger.info(f"Found NetBox tenant ID: {tenant_id}")

        # Step 2: Create VRF in NetBox
        vrf_payload = {
            'name': name,
            'tenant': tenant_id,
        }
        if description:
            vrf_payload['description'] = description

        netbox_response = netbox_client.post('/api/ipam/vrfs/', vrf_payload)

        if not netbox_response:
            return jsonify({
                'status': 'error',
                'message': 'Failed to create VRF in NetBox'
            }), 500

        logger.info(f"VRF created in NetBox: {netbox_response.get('name')}")

        # Step 3: Merge VRF into NaC data model under the tenant
        nac_client = get_nac_client()
        vrf_data = {'name': name}
        if description:
            vrf_data['description'] = description

        nac_response = nac_client.merge_operation(
            path=f'apic/tenants/name={tenant}/vrfs',
            data=vrf_data,
            change_message=f"Creating VRF {name} in tenant {tenant} via GUI",
            apply=False,
            apply_title=f"Add VRF: {name} (tenant: {tenant})",
            apply_message=f"## VRF Configuration\n\n"
                          f"- **Tenant**: {tenant}\n"
                          f"- **VRF Name**: {name}\n"
                          f"- **Description**: {description or 'N/A'}\n"
                          f"\nVRF also created in NetBox. Submitted via NAC ACI GUI."
        )

        if nac_response:
            logger.info(f"VRF created in NaC data model: {name}")
            return jsonify({
                'status': 'success',
                'message': f"VRF '{name}' created successfully in tenant '{tenant}'",
                'data': {
                    'tenant': tenant,
                    'name': name,
                    'description': description,
                    'netbox_vrf': netbox_response,
                    'nac_response': nac_response
                }
            })
        else:
            logger.error("VRF created in NetBox but NaC API merge failed")
            return jsonify({
                'status': 'partial',
                'message': f"VRF '{name}' created in NetBox but failed to update NaC data model",
                'data': {
                    'name': name,
                    'tenant': tenant,
                    'netbox_vrf': netbox_response
                }
            }), 500

    except Exception as e:
        logger.error(f"Error in create VRF endpoint: {str(e)}", exc_info=True)
        return jsonify({
            'status': 'error',
            'message': f'Failed to create VRF: {str(e)}'
        }), 500


@nac_bp.route('/leaf-nodes', methods=['GET'])
def get_leaf_nodes_endpoint():
    """Get leaf nodes from the data model"""
    try:
        client = get_nac_client()
        nodes = client.get_leaf_nodes()
        if nodes is not None:
            return jsonify({'status': 'success', 'data': nodes})
        else:
            return jsonify({'status': 'error', 'message': 'Failed to retrieve leaf nodes'}), 500
    except Exception as e:
        logger.error(f"Error in leaf-nodes endpoint: {str(e)}", exc_info=True)
        return jsonify({'status': 'error', 'message': str(e)}), 500


@nac_bp.route('/leaf-ports', methods=['GET'])
def get_leaf_ports():
    """Get ports for a leaf node from the data model"""
    try:
        node_id = request.args.get('node_id')
        if not node_id:
            return jsonify({'status': 'error', 'message': 'Missing required parameter: node_id'}), 400
        try:
            node_id = int(node_id)
        except ValueError:
            return jsonify({'status': 'error', 'message': 'node_id must be an integer'}), 400

        client = get_nac_client()
        ports = client.get_ports_for_leaf(node_id)
        if ports is not None:
            return jsonify({'status': 'success', 'data': ports})
        else:
            return jsonify({'status': 'error', 'message': 'Failed to retrieve ports'}), 500
    except Exception as e:
        logger.error(f"Error in leaf-ports endpoint: {str(e)}", exc_info=True)
        return jsonify({'status': 'error', 'message': str(e)}), 500


@nac_bp.route('/port-available-epgs', methods=['GET'])
def get_port_available_epgs():
    """Get available EPGs for a specific port (not yet bound as static ports)"""
    try:
        node_id = request.args.get('node_id')
        module = request.args.get('module')
        port = request.args.get('port')

        if not all([node_id, module, port]):
            return jsonify({'status': 'error', 'message': 'Missing required parameters: node_id, module, port'}), 400
        try:
            node_id = int(node_id)
            module = int(module)
            port = int(port)
        except ValueError:
            return jsonify({'status': 'error', 'message': 'node_id, module, and port must be integers'}), 400

        client = get_nac_client()
        result = client.get_available_epgs_for_port(node_id, module, port)
        if result is not None:
            if isinstance(result, dict):
                return jsonify({'status': 'success', 'data': result.get('available', []), 'existing': result.get('existing', [])})
            return jsonify({'status': 'success', 'data': result, 'existing': []})
        else:
            return jsonify({'status': 'error', 'message': 'Failed to retrieve available EPGs'}), 500
    except Exception as e:
        logger.error(f"Error in port-available-epgs endpoint: {str(e)}", exc_info=True)
        return jsonify({'status': 'error', 'message': str(e)}), 500


@nac_bp.route('/add-static-port', methods=['POST'])
def add_static_port():
    """Add a static port binding to an EPG in the NaC data model"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'status': 'error', 'message': 'No JSON data provided'}), 400

        required = ['tenant', 'application_profile', 'endpoint_group', 'node_id', 'module', 'port', 'vlan']
        missing = [f for f in required if f not in data]
        if missing:
            return jsonify({'status': 'error', 'message': f'Missing required fields: {", ".join(missing)}'}), 400

        mode = data.get('mode', 'regular')
        if mode not in ('regular', 'native', 'untagged'):
            return jsonify({'status': 'error', 'message': 'mode must be regular, native, or untagged'}), 400

        tenant = data['tenant']
        app_profile = data['application_profile']
        epg = data['endpoint_group']

        static_port_data = {
            'node_id': int(data['node_id']),
            'module': int(data['module']),
            'port': int(data['port']),
            'vlan': int(data['vlan']),
            'mode': mode
        }

        path = f"apic/tenants/name={tenant}/application_profiles/name={app_profile}/endpoint_groups/name={epg}/static_ports"

        logger.info(f"Adding static port binding: node {static_port_data['node_id']} port {static_port_data['module']}/{static_port_data['port']} to EPG {epg}")

        client = get_nac_client()
        response = client.merge_operation(
            path=path,
            data=static_port_data,
            change_message=f"Adding VLAN {static_port_data['vlan']} on node {static_port_data['node_id']} port {static_port_data['module']}/{static_port_data['port']} to EPG {epg} via GUI",
            apply=False,
            apply_title=data.get('apply_title', f"Add Static Port: node {static_port_data['node_id']} {static_port_data['module']}/{static_port_data['port']} to {epg}"),
            apply_message=data.get('apply_message',
                                   f"## Static Port Binding\n\n"
                                   f"- **Tenant**: {tenant}\n"
                                   f"- **App Profile**: {app_profile}\n"
                                   f"- **EPG**: {epg}\n"
                                   f"- **Node ID**: {static_port_data['node_id']}\n"
                                   f"- **Port**: {static_port_data['module']}/{static_port_data['port']}\n"
                                   f"- **VLAN**: {static_port_data['vlan']}\n"
                                   f"- **Mode**: {mode}\n"
                                   f"\nSubmitted via NAC ACI GUI.")
        )

        if response:
            return jsonify({
                'status': 'success',
                'message': f"Static port binding added: VLAN {static_port_data['vlan']} on node {static_port_data['node_id']} port {static_port_data['module']}/{static_port_data['port']} → EPG {epg}",
                'data': {
                    'tenant': tenant,
                    'application_profile': app_profile,
                    'endpoint_group': epg,
                    'static_port': static_port_data,
                    'nac_response': response
                }
            })
        else:
            return jsonify({'status': 'error', 'message': 'Failed to add static port binding in NaC API'}), 500

    except Exception as e:
        logger.error(f"Error in add-static-port endpoint: {str(e)}", exc_info=True)
        return jsonify({'status': 'error', 'message': f'Failed to add static port binding: {str(e)}'}), 500
