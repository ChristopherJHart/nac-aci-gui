"""
NetBox API endpoints
"""
from flask import Blueprint, jsonify, request
from ...netbox_api import get_netbox_client
import logging
import os
import yaml

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

netbox_bp = Blueprint('netbox', __name__)


@netbox_bp.route('/prefixes', methods=['GET'])
def get_prefixes():
    """
    Get all IP prefixes from NetBox
    ---
    tags:
      - NetBox
    summary: Get IP prefixes
    description: Retrieves all IP prefixes from NetBox IPAM
    parameters:
      - name: status
        in: query
        type: string
        description: Filter by status (e.g., 'active', 'reserved', 'deprecated')
      - name: family
        in: query
        type: integer
        description: Filter by IP family (4 for IPv4, 6 for IPv6)
      - name: role
        in: query
        type: string
        description: Filter by role slug (e.g., 'nac-tf-fabric1')
      - name: q
        in: query
        type: string
        description: Search query
    responses:
      200:
        description: List of prefixes
        schema:
          type: object
          properties:
            status:
              type: string
              example: success
            data:
              type: object
              properties:
                count:
                  type: integer
                results:
                  type: array
                  items:
                    type: object
      500:
        description: Failed to retrieve prefixes
    """
    try:
        client = get_netbox_client()

        # Get query parameters
        params = {}
        if request.args.get('status'):
            params['status'] = request.args.get('status')
        if request.args.get('family'):
            params['family'] = request.args.get('family')
        if request.args.get('role'):
            params['role'] = request.args.get('role')
        if request.args.get('q'):
            params['q'] = request.args.get('q')

        result = client.get_prefixes(params if params else None)

        if result is not None:
            return jsonify({
                'status': 'success',
                'data': result
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Failed to retrieve prefixes from NetBox'
            }), 500
    except Exception as e:
        logger.error(f"Error getting prefixes: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Failed to retrieve prefixes: {str(e)}'
        }), 500


@netbox_bp.route('/prefixes/<int:prefix_id>', methods=['GET'])
def get_prefix(prefix_id):
    """
    Get specific prefix by ID
    ---
    tags:
      - NetBox
    summary: Get prefix by ID
    description: Retrieves a specific IP prefix from NetBox by ID
    parameters:
      - name: prefix_id
        in: path
        type: integer
        required: true
        description: NetBox prefix ID
    responses:
      200:
        description: Prefix details
      404:
        description: Prefix not found
      500:
        description: Failed to retrieve prefix
    """
    try:
        client = get_netbox_client()
        result = client.get_prefix(prefix_id)

        if result is not None:
            return jsonify({
                'status': 'success',
                'data': result
            })
        else:
            return jsonify({
                'status': 'error',
                'message': f'Prefix {prefix_id} not found'
            }), 404
    except Exception as e:
        logger.error(f"Error getting prefix: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Failed to retrieve prefix: {str(e)}'
        }), 500


@netbox_bp.route('/prefixes', methods=['POST'])
def create_prefix():
    """
    Create a new IP prefix in NetBox
    ---
    tags:
      - NetBox
    summary: Create IP prefix
    description: Creates a new IP prefix in NetBox IPAM
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - prefix
          properties:
            prefix:
              type: string
              description: IP prefix in CIDR notation
              example: "10.0.1.0/24"
            status:
              type: string
              description: Prefix status
              example: "active"
            description:
              type: string
              description: Prefix description
              example: "NaC-Test-1"
            site:
              type: integer
              description: Site ID
            vlan:
              type: integer
              description: VLAN ID
    responses:
      201:
        description: Prefix created successfully
      400:
        description: Invalid request data
      500:
        description: Failed to create prefix
    """
    try:
        data = request.get_json()

        if not data or 'prefix' not in data:
            return jsonify({
                'status': 'error',
                'message': 'Missing required field: prefix'
            }), 400

        client = get_netbox_client()
        result = client.create_prefix(data)

        if result is not None:
            return jsonify({
                'status': 'success',
                'data': result
            }), 201
        else:
            return jsonify({
                'status': 'error',
                'message': 'Failed to create prefix in NetBox'
            }), 500
    except Exception as e:
        logger.error(f"Error creating prefix: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Failed to create prefix: {str(e)}'
        }), 500


@netbox_bp.route('/prefixes/<int:prefix_id>', methods=['PATCH'])
def update_prefix(prefix_id):
    """
    Update an existing IP prefix
    ---
    tags:
      - NetBox
    summary: Update IP prefix
    description: Updates an existing IP prefix in NetBox
    parameters:
      - name: prefix_id
        in: path
        type: integer
        required: true
        description: NetBox prefix ID
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            status:
              type: string
              example: "reserved"
            description:
              type: string
              example: "Updated description"
    responses:
      200:
        description: Prefix updated successfully
      404:
        description: Prefix not found
      500:
        description: Failed to update prefix
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No update data provided'
            }), 400

        client = get_netbox_client()
        result = client.update_prefix(prefix_id, data)

        if result is not None:
            return jsonify({
                'status': 'success',
                'data': result
            })
        else:
            return jsonify({
                'status': 'error',
                'message': f'Failed to update prefix {prefix_id}'
            }), 500
    except Exception as e:
        logger.error(f"Error updating prefix: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Failed to update prefix: {str(e)}'
        }), 500


@netbox_bp.route('/prefixes/<int:prefix_id>', methods=['DELETE'])
def delete_prefix(prefix_id):
    """
    Delete an IP prefix
    ---
    tags:
      - NetBox
    summary: Delete IP prefix
    description: Deletes an IP prefix from NetBox
    parameters:
      - name: prefix_id
        in: path
        type: integer
        required: true
        description: NetBox prefix ID
    responses:
      204:
        description: Prefix deleted successfully
      404:
        description: Prefix not found
      500:
        description: Failed to delete prefix
    """
    try:
        client = get_netbox_client()
        result = client.delete_prefix(prefix_id)

        if result:
            return '', 204
        else:
            return jsonify({
                'status': 'error',
                'message': f'Failed to delete prefix {prefix_id}'
            }), 500
    except Exception as e:
        logger.error(f"Error deleting prefix: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Failed to delete prefix: {str(e)}'
        }), 500


@netbox_bp.route('/ip-addresses', methods=['GET'])
def get_ip_addresses():
    """
    Get all IP addresses from NetBox
    ---
    tags:
      - NetBox
    summary: Get IP addresses
    description: Retrieves all IP addresses from NetBox IPAM
    responses:
      200:
        description: List of IP addresses
      500:
        description: Failed to retrieve IP addresses
    """
    try:
        client = get_netbox_client()

        # Get query parameters
        params = {}
        if request.args.get('status'):
            params['status'] = request.args.get('status')
        if request.args.get('q'):
            params['q'] = request.args.get('q')

        result = client.get_ip_addresses(params if params else None)

        if result is not None:
            return jsonify({
                'status': 'success',
                'data': result
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Failed to retrieve IP addresses from NetBox'
            }), 500
    except Exception as e:
        logger.error(f"Error getting IP addresses: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Failed to retrieve IP addresses: {str(e)}'
        }), 500


@netbox_bp.route('/vlans', methods=['GET'])
def get_vlans():
    """
    Get all VLANs from NetBox
    ---
    tags:
      - NetBox
    summary: Get VLANs
    description: Retrieves all VLANs from NetBox (handles pagination automatically)
    responses:
      200:
        description: List of VLANs
      403:
        description: Permission denied - check API token permissions
      500:
        description: Failed to retrieve VLANs
    """
    try:
        client = get_netbox_client()

        # Fetch all VLANs with pagination handling
        all_vlans = []
        offset = 0
        limit = 100  # NetBox default page size

        while True:
            # Request VLANs with pagination parameters
            params = {'limit': limit, 'offset': offset}
            result = client.get_vlans(params)

            if result is None:
                # Check if it was a permission issue (403)
                return jsonify({
                    'status': 'error',
                    'message': 'Failed to retrieve VLANs from NetBox. Please check: 1) NetBox API token has read permissions for IPAM > VLANs, 2) Token is valid and not expired, 3) NetBox URL is correct'
                }), 500

            # Add VLANs from this page
            vlans_page = result.get('results', [])
            all_vlans.extend(vlans_page)

            # Check if there are more pages
            next_page = result.get('next')
            if not next_page or len(vlans_page) == 0:
                break

            # Move to next page
            offset += limit
            logger.debug(f"Fetched {len(all_vlans)} VLANs so far, fetching next page...")

        logger.info(f"Successfully retrieved {len(all_vlans)} VLANs from NetBox")

        return jsonify({
            'status': 'success',
            'data': {
                'count': len(all_vlans),
                'results': all_vlans
            }
        })

    except Exception as e:
        logger.error(f"Error getting VLANs: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Failed to retrieve VLANs: {str(e)}'
        }), 500


@netbox_bp.route('/sites', methods=['GET'])
def get_sites():
    """
    Get all sites from NetBox
    ---
    tags:
      - NetBox
    summary: Get sites
    description: Retrieves all sites from NetBox DCIM
    responses:
      200:
        description: List of sites
      500:
        description: Failed to retrieve sites
    """
    try:
        client = get_netbox_client()
        result = client.get_sites()

        if result is not None:
            return jsonify({
                'status': 'success',
                'data': result
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Failed to retrieve sites from NetBox'
            }), 500
    except Exception as e:
        logger.error(f"Error getting sites: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Failed to retrieve sites: {str(e)}'
        }), 500


@netbox_bp.route('/servers', methods=['GET'])
def get_servers():
    """
    Get servers from NetBox
    ---
    tags:
      - NetBox
    summary: Get servers
    description: Retrieves devices with the Server role, including their site, row (location) and rack
    responses:
      200:
        description: List of servers
      500:
        description: Failed to retrieve servers
    """
    try:
        client = get_netbox_client()
        servers = client.get_servers()
        if servers is not None:
            return jsonify({'status': 'success', 'data': servers})
        return jsonify({'status': 'error', 'message': 'Failed to retrieve servers from NetBox'}), 500
    except Exception as e:
        logger.error(f"Error getting servers: {str(e)}", exc_info=True)
        return jsonify({'status': 'error', 'message': f'Failed to retrieve servers: {str(e)}'}), 500


@netbox_bp.route('/racks', methods=['GET'])
def get_racks():
    """
    Get racks from NetBox with their row (location)
    ---
    tags:
      - NetBox
    summary: Get racks
    responses:
      200:
        description: List of racks
      500:
        description: Failed to retrieve racks
    """
    try:
        client = get_netbox_client()
        result = client.get('/api/dcim/racks/', params={'limit': 1000, 'ordering': 'name'})
        if result is None:
            return jsonify({'status': 'error', 'message': 'Failed to retrieve racks from NetBox'}), 500
        racks = [{'id': r['id'], 'name': r['name'], 'row': (r.get('location') or {}).get('name')}
                 for r in result.get('results', [])]
        return jsonify({'status': 'success', 'data': racks})
    except Exception as e:
        logger.error(f"Error getting racks: {str(e)}", exc_info=True)
        return jsonify({'status': 'error', 'message': f'Failed to retrieve racks: {str(e)}'}), 500


@netbox_bp.route('/servers/<int:device_id>/connections', methods=['GET'])
def get_server_connections(device_id):
    """
    Get a server's interfaces and the ACI leaf ports they are cabled to
    ---
    tags:
      - NetBox
    summary: Get server connections
    description: Follows each server interface's cable to its leaf switch and port, resolving the leaf's ACI node ID
    parameters:
      - name: device_id
        in: path
        type: integer
        required: true
        description: NetBox device ID of the server
    responses:
      200:
        description: List of server interfaces with their leaf connections
      500:
        description: Failed to retrieve connections
    """
    try:
        client = get_netbox_client()
        connections = client.get_server_connections(device_id)
        if connections is not None:
            return jsonify({'status': 'success', 'data': connections})
        return jsonify({'status': 'error', 'message': 'Failed to retrieve server connections from NetBox'}), 500
    except Exception as e:
        logger.error(f"Error getting server connections: {str(e)}", exc_info=True)
        return jsonify({'status': 'error', 'message': f'Failed to retrieve server connections: {str(e)}'}), 500


@netbox_bp.route('/devices', methods=['GET'])
def get_devices():
    """
    Get all devices from NetBox
    ---
    tags:
      - NetBox
    summary: Get devices
    description: Retrieves all devices from NetBox DCIM
    responses:
      200:
        description: List of devices
      500:
        description: Failed to retrieve devices
    """
    try:
        client = get_netbox_client()
        result = client.get_devices()

        if result is not None:
            return jsonify({
                'status': 'success',
                'data': result
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Failed to retrieve devices from NetBox'
            }), 500
    except Exception as e:
        logger.error(f"Error getting devices: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Failed to retrieve devices: {str(e)}'
        }), 500


@netbox_bp.route('/sites-dashboard', methods=['GET'])
def get_sites_dashboard():
    """
    Get sites with hierarchical statistics
    ---
    tags:
      - NetBox
    summary: Get sites dashboard data
    description: Retrieves all sites with statistics about locations, VLANs, VLAN groups, and prefixes
    responses:
      200:
        description: List of sites with statistics
      500:
        description: Failed to retrieve sites dashboard
    """
    try:
        client = get_netbox_client()

        # Get all sites
        sites_response = client.get_sites()
        if sites_response is None:
            return jsonify({
                'status': 'error',
                'message': 'Failed to retrieve sites from NetBox'
            }), 500

        sites = sites_response.get('results', [])

        # Build dashboard data for each site
        dashboard_data = []
        for site in sites:
            site_id = site.get('id')
            site_name = site.get('name')
            site_slug = site.get('slug')

            # Get locations for this site
            locations_response = client.get_locations({'site_id': site_id})
            locations_count = locations_response.get('count', 0) if locations_response else 0
            locations_list = locations_response.get('results', []) if locations_response else []

            # Get VLANs for this site
            vlans_response = client.get_vlans({'site_id': site_id})
            vlans_count = vlans_response.get('count', 0) if vlans_response else 0

            # Get VLAN groups - they are scoped to locations, not sites directly
            # We need to count VLAN groups across all locations in this site
            vlan_groups_set = set()  # Use set to avoid duplicate counts
            logger.debug(f"Site '{site_name}' has {locations_count} locations")

            for location in locations_list:
                location_id = location.get('id')
                location_name = location.get('name')
                if location_id:
                    # Query VLAN groups scoped to this location
                    # NetBox uses scope_type and scope_id for filtering
                    vlan_groups_response = client.get_vlan_groups({
                        'scope_type': 'dcim.location',
                        'scope_id': location_id
                    })
                    if vlan_groups_response and 'results' in vlan_groups_response:
                        location_vg_count = len(vlan_groups_response['results'])
                        logger.debug(f"  Location '{location_name}' has {location_vg_count} VLAN groups")
                        for vg in vlan_groups_response['results']:
                            vlan_groups_set.add(vg.get('id'))

            vlan_groups_count = len(vlan_groups_set)
            logger.debug(f"Site '{site_name}' total unique VLAN groups: {vlan_groups_count}")

            # Get prefixes for this site - fetch ALL prefixes including children with pagination
            all_prefixes = []
            offset = 0
            limit = 100

            while True:
                prefixes_response = client.get_prefixes({'site_id': site_id, 'limit': limit, 'offset': offset})
                if not prefixes_response:
                    break

                prefixes_page = prefixes_response.get('results', [])
                all_prefixes.extend(prefixes_page)

                # Check if there are more pages
                next_page = prefixes_response.get('next')
                if not next_page or len(prefixes_page) == 0:
                    break

                offset += limit

            prefixes_count = len(all_prefixes)
            logger.debug(f"Site '{site_name}' has {prefixes_count} total prefixes (including children)")

            # Count available prefixes (status = active)
            available_prefixes = sum(1 for p in all_prefixes
                                    if p.get('status', {}).get('value') == 'active')

            dashboard_data.append({
                'id': site_id,
                'name': site_name,
                'slug': site_slug,
                'description': site.get('description', ''),
                'status': site.get('status', {}),
                'facility': site.get('facility', ''),
                'region': site.get('region', {}),
                'statistics': {
                    'locations': locations_count,
                    'vlans': vlans_count,
                    'vlan_groups': vlan_groups_count,
                    'prefixes': prefixes_count,
                    'available_prefixes': available_prefixes
                }
            })

        return jsonify({
            'status': 'success',
            'data': {
                'count': len(dashboard_data),
                'sites': dashboard_data
            }
        })

    except Exception as e:
        logger.error(f"Error getting sites dashboard: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Failed to retrieve sites dashboard: {str(e)}'
        }), 500


@netbox_bp.route('/roles', methods=['GET'])
def get_roles():
    """
    Get all VLAN/prefix roles from NetBox
    ---
    tags:
      - NetBox
    summary: Get VLAN/prefix roles
    description: Retrieves all roles from NetBox IPAM that can be assigned to VLANs and prefixes
    responses:
      200:
        description: List of roles
        schema:
          type: object
          properties:
            status:
              type: string
              example: success
            data:
              type: object
              properties:
                count:
                  type: integer
                results:
                  type: array
                  items:
                    type: object
                    properties:
                      id:
                        type: integer
                      name:
                        type: string
                      slug:
                        type: string
                      description:
                        type: string
      500:
        description: Failed to retrieve roles
    """
    try:
        client = get_netbox_client()

        result = client.get('/api/ipam/roles/')

        if result is not None:
            return jsonify({
                'status': 'success',
                'data': result
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Failed to retrieve roles from NetBox'
            }), 500
    except Exception as e:
        logger.error(f"Error getting roles: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Failed to retrieve roles: {str(e)}'
        }), 500


@netbox_bp.route('/vlan-groups', methods=['GET'])
def get_vlan_groups():
    """
    Get all VLAN groups from NetBox
    ---
    tags:
      - NetBox
    summary: Get VLAN groups
    description: Retrieves all VLAN groups from NetBox IPAM
    parameters:
      - name: site_id
        in: query
        type: integer
        description: Filter by site ID
      - name: scope_type
        in: query
        type: string
        description: Scope type (e.g., 'dcim.location', 'dcim.site')
      - name: scope_id
        in: query
        type: integer
        description: Scope ID
    responses:
      200:
        description: List of VLAN groups
        schema:
          type: object
          properties:
            status:
              type: string
              example: success
            data:
              type: object
              properties:
                count:
                  type: integer
                results:
                  type: array
                  items:
                    type: object
                    properties:
                      id:
                        type: integer
                      name:
                        type: string
                      slug:
                        type: string
                      min_vid:
                        type: integer
                      max_vid:
                        type: integer
                      description:
                        type: string
      500:
        description: Failed to retrieve VLAN groups
    """
    try:
        client = get_netbox_client()

        # Get query parameters
        params = {}
        if request.args.get('site_id'):
            params['site_id'] = request.args.get('site_id')
        if request.args.get('scope_type'):
            params['scope_type'] = request.args.get('scope_type')
        if request.args.get('scope_id'):
            params['scope_id'] = request.args.get('scope_id')

        result = client.get_vlan_groups(params if params else None)

        if result is not None:
            return jsonify({
                'status': 'success',
                'data': result
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Failed to retrieve VLAN groups from NetBox'
            }), 500
    except Exception as e:
        logger.error(f"Error getting VLAN groups: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Failed to retrieve VLAN groups: {str(e)}'
        }), 500


@netbox_bp.route('/test-connection', methods=['GET'])
def test_connection():
    """
    Test connection to NetBox API
    ---
    tags:
      - NetBox
    summary: Test NetBox connectivity
    description: Tests the connection to NetBox API using configured credentials
    responses:
      200:
        description: Connection test result
      500:
        description: Connection test failed
    """
    try:
        client = get_netbox_client()
        result = client.test_connection()

        if result['status'] == 'success':
            return jsonify(result)
        else:
            return jsonify(result), 500
    except Exception as e:
        logger.error(f"Error testing NetBox connection: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Connection test failed: {str(e)}'
        }), 500


@netbox_bp.route('/create-network-vlan', methods=['POST'])
def create_network_vlan():
    """
    Create a VLAN and Prefix in NetBox for a network
    ---
    tags:
      - NetBox
    summary: Create VLAN with VNID and /24 Prefix for network
    description: |
      Creates an available VLAN in the configured VLAN group, sets the L2_VNID custom field,
      and creates a /24 prefix from the configured parent prefix.
      VNID is calculated as VLAN ID + 30000.
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - network_name
          properties:
            network_name:
              type: string
              description: Name for the network/VLAN
              example: "NET_PROD_WEB"
    responses:
      200:
        description: VLAN and Prefix created successfully
        schema:
          type: object
          properties:
            status:
              type: string
              example: success
            message:
              type: string
              example: "Network created successfully: VLAN 1000, Prefix 10.1.2.0/24"
            vlan:
              type: object
              properties:
                id:
                  type: integer
                  description: NetBox VLAN ID
                vid:
                  type: integer
                  description: VLAN ID (1-4094)
                name:
                  type: string
                  description: VLAN name
                vnid:
                  type: integer
                  description: Calculated VNID (VLAN ID + 30000)
            prefix:
              type: object
              properties:
                id:
                  type: integer
                  description: NetBox Prefix ID
                prefix:
                  type: string
                  description: Prefix CIDR (e.g., 10.1.2.0/24)
                name:
                  type: string
                  description: Prefix name
      400:
        description: Bad request or configuration error
      500:
        description: Server error
    """
    try:
        data = request.get_json()
        network_name = data.get('network_name')

        if not network_name:
            return jsonify({
                'status': 'error',
                'message': 'network_name is required'
            }), 400

        # Load configuration to get VLAN group settings
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))
        config_path = os.path.join(project_root, 'yaml', 'config.yaml')

        if not os.path.exists(config_path):
            return jsonify({
                'status': 'error',
                'message': 'Configuration file not found. Please configure VLAN groups in NetBox Admin.'
            }), 400

        with open(config_path, 'r') as f:
            config = yaml.safe_load(f)

        vlan_group_settings = config.get('netbox', {}).get('vlan_group_settings', [])
        prefix_settings = config.get('netbox', {}).get('prefix_settings', [])

        if not vlan_group_settings:
            return jsonify({
                'status': 'error',
                'message': 'No VLAN groups configured. Please configure VLAN groups in NetBox Admin.'
            }), 400

        if not prefix_settings:
            return jsonify({
                'status': 'error',
                'message': 'No prefix settings configured. Please configure prefix roles in NetBox Admin.'
            }), 400

        # Use the first configured VLAN group and prefix
        vlan_group = vlan_group_settings[0]
        vlan_group_id = vlan_group.get('id')

        prefix_setting = prefix_settings[0]
        prefix_id = prefix_setting.get('prefix_id')

        if not prefix_id:
            return jsonify({
                'status': 'error',
                'message': 'Prefix ID not found in configuration. Please reconfigure prefix settings.'
            }), 400

        logger.info(f"Creating VLAN '{network_name}' in VLAN group {vlan_group_id} ({vlan_group.get('name')})")
        logger.info(f"Will create prefix from parent prefix ID {prefix_id}")

        # Step 1: Create available VLAN
        client = get_netbox_client()
        vlan_data = client.create_available_vlan(vlan_group_id, network_name)

        if not vlan_data:
            return jsonify({
                'status': 'error',
                'message': 'Failed to create VLAN in NetBox'
            }), 500

        vlan_id = vlan_data.get('id')
        vlan_vid = vlan_data.get('vid')

        if not vlan_id or vlan_vid is None:
            return jsonify({
                'status': 'error',
                'message': 'Invalid VLAN data returned from NetBox'
            }), 500

        # Step 2: Calculate VNID (VLAN ID + 30000)
        vnid = vlan_vid + 30000
        logger.info(f"Calculated VNID: {vnid} (VLAN ID {vlan_vid} + 30000)")

        # Step 3: Patch VLAN to add L2_VNID custom field
        custom_fields = {"L2VNID": vnid}
        updated_vlan = client.patch_vlan_custom_fields(vlan_id, custom_fields)

        if not updated_vlan:
            logger.warning(f"VLAN created but failed to update custom fields for VLAN {vlan_id}")
            # Return error since custom field is important
            return jsonify({
                'status': 'error',
                'message': 'VLAN created but custom field update failed',
                'vlan': {
                    'id': vlan_id,
                    'vid': vlan_vid,
                    'name': network_name,
                    'vnid': vnid
                }
            }), 500

        # Step 4: Create available prefix with /24 length
        logger.info(f"Creating /24 prefix from parent {prefix_id} for VLAN {vlan_id}")
        prefix_data = client.create_available_prefix(
            parent_prefix_id=prefix_id,
            prefix_length=24,
            name=network_name,
            vlan_id=vlan_id
        )

        if not prefix_data:
            logger.error(f"Failed to create prefix for network {network_name}")
            return jsonify({
                'status': 'error',
                'message': 'VLAN created but prefix creation failed',
                'vlan': {
                    'id': vlan_id,
                    'vid': vlan_vid,
                    'name': network_name,
                    'vnid': vnid
                }
            }), 500

        prefix_netbox_id = prefix_data.get('id')
        prefix_cidr = prefix_data.get('prefix')

        logger.info(f"Successfully created network: VLAN {vlan_vid} (VNID {vnid}), Prefix {prefix_cidr}")

        return jsonify({
            'status': 'success',
            'message': f'Network created successfully: VLAN {vlan_vid}, Prefix {prefix_cidr}',
            'vlan': {
                'id': vlan_id,
                'vid': vlan_vid,
                'name': network_name,
                'vnid': vnid,
                'custom_fields': updated_vlan.get('custom_fields', {})
            },
            'prefix': {
                'id': prefix_netbox_id,
                'prefix': prefix_cidr,
                'name': network_name
            }
        })

    except Exception as e:
        logger.error(f"Error creating network VLAN: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Failed to create network VLAN: {str(e)}'
        }), 500
