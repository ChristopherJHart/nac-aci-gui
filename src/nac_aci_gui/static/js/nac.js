// NaC YAML specific JavaScript
// Handles all NaC API related tables, modals, and visualizations

/**
 * Initialize NaC table for a specific page
 */
function initializeNacTableForPage(page, commonConfig, tableInstances) {
    // Initialize Bridge Domains Page (with Tenant Selector)
    if (page === 'bridge-domains' && document.getElementById('bridgeDomainsTable') && !tableInstances['bridgeDomainsTable']) {
        // Create table without auto-loading data (user must select a tenant first)
        tableInstances['bridgeDomainsTable'] = new Tabulator("#bridgeDomainsTable", {
            ...commonConfig,
            data: [], // Start with empty data
            columns: [
                {
                    title: "Bridge Domain Name",
                    field: "name",
                    formatter: (cell) => `<strong>${cell.getValue()}</strong>`,
                    sorter: "string",
                    headerFilter: "input",
                    minWidth: 200
                },
                {
                    title: "Tenant",
                    field: "tenant",
                    sorter: "string",
                    headerFilter: "input",
                    minWidth: 150
                },
                {
                    title: "VRF",
                    field: "vrf",
                    sorter: "string",
                    headerFilter: "input",
                    minWidth: 150
                },
                {
                    title: "MAC Address",
                    field: "mac",
                    sorter: "string",
                    minWidth: 150
                },
                {
                    title: "L2 Unknown Unicast",
                    field: "l2_unknown_unicast",
                    sorter: "string",
                    minWidth: 150
                },
                {
                    title: "ARP Flooding",
                    field: "arp_flooding",
                    formatter: (cell) => {
                        const value = cell.getValue();
                        const badgeClass = value === 'yes' || value === true ? 'bg-success' : 'bg-secondary';
                        return `<span class="badge ${badgeClass}">${value || 'no'}</span>`;
                    },
                    sorter: "string",
                    hozAlign: "center",
                    minWidth: 120
                },
                {
                    title: "IP Routing",
                    field: "ip_routing",
                    formatter: (cell) => {
                        const value = cell.getValue();
                        const badgeClass = value === 'yes' || value === true ? 'bg-success' : 'bg-secondary';
                        return `<span class="badge ${badgeClass}">${value || 'no'}</span>`;
                    },
                    sorter: "string",
                    hozAlign: "center",
                    minWidth: 120
                },
                {
                    title: "Subnets",
                    field: "subnet_count",
                    formatter: (cell) => {
                        const count = cell.getValue() || 0;
                        if (count > 0) {
                            return `<span class="badge bg-info">${count}</span>`;
                        } else {
                            return `<span class="badge bg-secondary">0</span>`;
                        }
                    },
                    sorter: "number",
                    hozAlign: "center",
                    minWidth: 100
                },
                {
                    title: "",
                    field: "actions",
                    formatter: function(cell) {
                        const rowData = cell.getRow().getData();
                        return `<button class="btn btn-sm btn-outline-primary view-bd-yaml-btn" data-bd-name="${rowData.name}">
                            <i class="bi bi-file-earmark-code me-1"></i>YAML
                        </button>`;
                    },
                    hozAlign: "center",
                    headerSort: false,
                    width: 90
                }
            ],
            initialSort: [{ column: "name", dir: "asc" }],
            placeholder: "Select a tenant and click 'Load Bridge Domains' to view data"
        });

        // Initialize the tenant selector
        initializeBridgeDomainsTenantSelector(tableInstances);

        // Add click handler for View YAML buttons (using event delegation)
        document.getElementById('bridgeDomainsTable').addEventListener('click', function(e) {
            const btn = e.target.closest('.view-bd-yaml-btn');
            if (btn) {
                const bdName = btn.dataset.bdName;
                showBridgeDomainYamlModal(bdName, tableInstances);
            }
        });
    }

    // Initialize NaC Tenants Table (from YAML data model)
    if (page === 'nac-tenants' && document.getElementById('nacTenantsTable') && !tableInstances['nacTenantsTable']) {
        tableInstances['nacTenantsTable'] = new Tabulator("#nacTenantsTable", {
            ...commonConfig,
            ajaxURL: "/api/v1/nac/tenants",
            columns: [
                {
                    title: "Tenant Name",
                    field: "name",
                    formatter: (cell) => `<strong>${cell.getValue()}</strong>`,
                    sorter: "string",
                    headerFilter: "input",
                    minWidth: 200
                },
                {
                    title: "Alias",
                    field: "alias",
                    sorter: "string",
                    headerFilter: "input",
                    minWidth: 150
                },
                {
                    title: "Description",
                    field: "description",
                    sorter: "string",
                    headerFilter: "input",
                    minWidth: 300
                }
            ],
            initialSort: [{ column: "name", dir: "asc" }]
        });

        // Add refresh button handler for NaC Tenants
        const refreshNacTenantsBtn = document.getElementById('refreshNacTenantsBtn');
        if (refreshNacTenantsBtn) {
            refreshNacTenantsBtn.addEventListener('click', function() {
                tableInstances['nacTenantsTable'].setData("/api/v1/nac/tenants");
            });
        }
    }

    // Initialize NaC VRFs Table (from YAML data model with tenant selector)
    if (page === 'nac-vrfs' && document.getElementById('nacVrfsTable') && !tableInstances['nacVrfsTable']) {
        // Create table without auto-loading data (user must select a tenant first)
        tableInstances['nacVrfsTable'] = new Tabulator("#nacVrfsTable", {
            ...commonConfig,
            data: [], // Start with empty data
            columns: [
                {
                    title: "VRF Name",
                    field: "name",
                    formatter: (cell) => `<strong>${cell.getValue()}</strong>`,
                    sorter: "string",
                    headerFilter: "input",
                    minWidth: 200
                },
                {
                    title: "Tenant",
                    field: "tenant",
                    sorter: "string",
                    headerFilter: "input",
                    minWidth: 150
                },
                {
                    title: "Alias",
                    field: "alias",
                    sorter: "string",
                    headerFilter: "input",
                    minWidth: 150
                },
                {
                    title: "Description",
                    field: "description",
                    sorter: "string",
                    minWidth: 200
                },
                {
                    title: "Data Plane Learning",
                    field: "data_plane_learning",
                    formatter: (cell) => {
                        const value = cell.getValue();
                        const badgeClass = value === true || value === 'enabled' ? 'bg-success' : 'bg-secondary';
                        return `<span class="badge ${badgeClass}">${value === true || value === 'enabled' ? 'enabled' : 'disabled'}</span>`;
                    },
                    sorter: "string",
                    hozAlign: "center",
                    minWidth: 150
                },
                {
                    title: "Preferred Group",
                    field: "preferred_group",
                    formatter: (cell) => {
                        const value = cell.getValue();
                        const badgeClass = value === true ? 'bg-success' : 'bg-secondary';
                        return `<span class="badge ${badgeClass}">${value ? 'yes' : 'no'}</span>`;
                    },
                    sorter: "string",
                    hozAlign: "center",
                    minWidth: 130
                },
                {
                    title: "",
                    field: "actions",
                    formatter: function(cell) {
                        const rowData = cell.getRow().getData();
                        return `<button class="btn btn-sm btn-outline-primary view-nac-vrf-yaml-btn" data-vrf-name="${rowData.name}">
                            <i class="bi bi-file-earmark-code me-1"></i>YAML
                        </button>`;
                    },
                    hozAlign: "center",
                    headerSort: false,
                    width: 90
                }
            ],
            initialSort: [{ column: "name", dir: "asc" }],
            placeholder: "Select a tenant and click 'Load VRFs' to view data"
        });

        // Initialize the tenant selector for VRFs
        initializeVrfsTenantSelector(tableInstances);

        // Add click handler for View YAML buttons (using event delegation)
        document.getElementById('nacVrfsTable').addEventListener('click', function(e) {
            const btn = e.target.closest('.view-nac-vrf-yaml-btn');
            if (btn) {
                const vrfName = btn.dataset.vrfName;
                showNacVrfYamlModal(vrfName, tableInstances);
            }
        });
    }

    // Initialize VRF Instances Table (Action VRFs page)
    if (page === 'action-vrfs' && document.getElementById('actionVrfInstancesTable') && !tableInstances['actionVrfInstancesTable']) {
        tableInstances['actionVrfInstancesTable'] = new Tabulator("#actionVrfInstancesTable", {
            ...commonConfig,
            ajaxURL: "/api/v1/nac/vrfs",
            columns: [
                {
                    title: "VRF Name",
                    field: "name",
                    formatter: (cell) => `<strong>${cell.getValue()}</strong>`,
                    sorter: "string",
                    minWidth: 200
                },
                {
                    title: "VRF ID",
                    field: "vrf_id",
                    sorter: "number",
                    minWidth: 100
                },
                {
                    title: "VLAN ID",
                    field: "vlan_id",
                    sorter: "number",
                    minWidth: 100
                },
                {
                    title: "VRF Attach Group",
                    field: "vrf_attach_group",
                    sorter: "string",
                    minWidth: 200
                },
                {
                    title: "View YAML",
                    formatter: (cell) => {
                        const rowData = cell.getRow().getData();
                        const vrfName = rowData.name;
                        return `
                            <button class="btn btn-sm btn-outline-info view-action-vrf-yaml"
                                    data-vrf-name="${vrfName}"
                                    title="View YAML">
                                <i class="bi bi-file-earmark-code"></i>
                            </button>
                        `;
                    },
                    headerSort: false,
                    hozAlign: "center",
                    minWidth: 100
                }
            ],
            initialSort: [{ column: "name", dir: "asc" }]
        });

        // Add refresh button handler for action VRFs
        const refreshBtn = document.getElementById('refreshActionVrfsBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', function() {
                tableInstances['actionVrfInstancesTable'].setData("/api/v1/nac/vrfs");
            });
        }
    }

    // Initialize Networks Table (Networks page)
    if (page === 'networks' && document.getElementById('networksTable') && !tableInstances['networksTable']) {
        tableInstances['networksTable'] = new Tabulator("#networksTable", {
            ...commonConfig,
            ajaxURL: "/api/v1/nac/networks",
            columns: [
                {
                    title: "Network Name",
                    field: "name",
                    formatter: (cell) => `<strong>${cell.getValue()}</strong>`,
                    sorter: "string",
                    minWidth: 200
                },
                {
                    title: "Network ID",
                    field: "network_id",
                    sorter: "number",
                    minWidth: 100
                },
                {
                    title: "VLAN ID",
                    field: "vlan_id",
                    sorter: "number",
                    minWidth: 100
                },
                {
                    title: "VRF Name",
                    field: "vrf_name",
                    sorter: "string",
                    minWidth: 200
                },
                {
                    title: "View YAML",
                    formatter: (cell) => {
                        const rowData = cell.getRow().getData();
                        const networkName = rowData.name;
                        return `
                            <button class="btn btn-sm btn-outline-success view-network-yaml"
                                    data-network-name="${networkName}"
                                    title="View YAML">
                                <i class="bi bi-file-earmark-code"></i>
                            </button>
                        `;
                    },
                    headerSort: false,
                    hozAlign: "center",
                    minWidth: 100
                }
            ],
            initialSort: [{ column: "name", dir: "asc" }]
        });
    }

    // Initialize Network Instances Table (Action Networks page)
    if (page === 'action-networks' && document.getElementById('actionNetworkInstancesTable') && !tableInstances['actionNetworkInstancesTable']) {
        tableInstances['actionNetworkInstancesTable'] = new Tabulator("#actionNetworkInstancesTable", {
            ...commonConfig,
            ajaxURL: "/api/v1/nac/networks",
            columns: [
                {
                    title: "Network Name",
                    field: "name",
                    formatter: (cell) => `<strong>${cell.getValue()}</strong>`,
                    sorter: "string",
                    minWidth: 200
                },
                {
                    title: "Network ID",
                    field: "network_id",
                    sorter: "number",
                    minWidth: 100
                },
                {
                    title: "VLAN ID",
                    field: "vlan_id",
                    sorter: "number",
                    minWidth: 100
                },
                {
                    title: "VRF Name",
                    field: "vrf_name",
                    sorter: "string",
                    minWidth: 200
                },
                {
                    title: "View YAML",
                    formatter: (cell) => {
                        const rowData = cell.getRow().getData();
                        const networkName = rowData.name;
                        return `
                            <button class="btn btn-sm btn-outline-success view-action-network-yaml"
                                    data-network-name="${networkName}"
                                    title="View YAML">
                                <i class="bi bi-file-earmark-code"></i>
                            </button>
                        `;
                    },
                    headerSort: false,
                    hozAlign: "center",
                    minWidth: 100
                }
            ],
            initialSort: [{ column: "name", dir: "asc" }]
        });

        // Add refresh button handler for action Networks
        const refreshBtn = document.getElementById('refreshActionNetworksBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', function() {
                tableInstances['actionNetworkInstancesTable'].setData("/api/v1/nac/networks");
            });
        }
    }

    console.log(`NaC Tabulator table initialized for page: ${page}`);
}


/**
 * Load and display Fabric details from NaC API
 */
function loadFabricDetails() {
    const contentDiv = document.getElementById('fabricContent');
    if (!contentDiv) return;

    // Fetch fabric details
    fetch('/api/v1/nac/fabric')
        .then(response => response.json())
        .then(fabricData => {
            if (fabricData.status === 'success' && fabricData.data) {
                const data = fabricData.data;
                const global = data.global || {};
                const fabric = data.fabric || {};

                // Build HTML for fabric details in grouped cards
                let html = '<div class="row g-4">';

                // Helper to separate simple and complex properties
                function separateProperties(obj) {
                    const simple = {};
                    const complex = {};
                    const excludeFromSimple = ['dns_servers', 'ntp_servers', 'syslog_servers', 'netflow', 'bgp'];

                    for (const [key, value] of Object.entries(obj)) {
                        // Skip keys that have dedicated cards
                        if (excludeFromSimple.includes(key)) {
                            continue;
                        }

                        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                            complex[key] = value;
                        } else {
                            simple[key] = value;
                        }
                    }

                    return { simple, complex };
                }

                // Global Configuration Card (simple properties only)
                const globalProps = separateProperties(global);
                if (Object.keys(globalProps.simple).length > 0) {
                    html += `
                        <div class="col-lg-6">
                            <div class="card shadow-sm">
                                <div class="card-header bg-primary text-white">
                                    <h5 class="mb-0"><i class="bi bi-globe me-2"></i>Global Configuration</h5>
                                </div>
                                <div class="card-body">
                                    <div class="row g-3">
                                        ${Object.entries(globalProps.simple).map(([key, value]) => `
                                            <div class="col-md-6">
                                                <label class="text-muted small">${key.replace(/_/g, ' ').toUpperCase()}</label>
                                                <p class="mb-0 fw-bold">${formatValue(value)}</p>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }

                // Fabric Configuration Card (simple properties only)
                const fabricProps = separateProperties(fabric);
                if (Object.keys(fabricProps.simple).length > 0) {
                    html += `
                        <div class="col-lg-6">
                            <div class="card shadow-sm">
                                <div class="card-header bg-success text-white">
                                    <h5 class="mb-0"><i class="bi bi-diagram-3 me-2"></i>Fabric Configuration</h5>
                                </div>
                                <div class="card-body">
                                    <div class="row g-3">
                                        ${Object.entries(fabricProps.simple).map(([key, value]) => `
                                            <div class="col-md-6">
                                                <label class="text-muted small">${key.replace(/_/g, ' ').toUpperCase()}</label>
                                                <p class="mb-0 fw-bold">${formatValue(value)}</p>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }

                // BGP Configuration Cards (if available in fabric or global)
                const bgpData = fabric.bgp || global.bgp || {};
                if (Object.keys(bgpData).length > 0) {
                    // eBGP Card
                    if (bgpData.ebgp) {
                        html += `
                            <div class="col-lg-6">
                                <div class="card shadow-sm">
                                    <div class="card-header bg-info text-white">
                                        <h5 class="mb-0"><i class="bi bi-arrows-angle-expand me-2"></i>eBGP Configuration</h5>
                                    </div>
                                    <div class="card-body">
                                        <div class="row g-3">
                                            ${Object.entries(bgpData.ebgp).map(([key, value]) => `
                                                <div class="col-md-6">
                                                    <label class="text-muted small">${key.replace(/_/g, ' ').toUpperCase()}</label>
                                                    <p class="mb-0 fw-bold">${formatValue(value)}</p>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }

                    // iBGP Card
                    if (bgpData.ibgp) {
                        html += `
                            <div class="col-lg-6">
                                <div class="card shadow-sm">
                                    <div class="card-header bg-warning text-dark">
                                        <h5 class="mb-0"><i class="bi bi-arrows-angle-contract me-2"></i>iBGP Configuration</h5>
                                    </div>
                                    <div class="card-body">
                                        <div class="row g-3">
                                            ${Object.entries(bgpData.ibgp).map(([key, value]) => `
                                                <div class="col-md-6">
                                                    <label class="text-muted small">${key.replace(/_/g, ' ').toUpperCase()}</label>
                                                    <p class="mb-0 fw-bold">${formatValue(value)}</p>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }
                }

                // DNS Servers Card
                const dnsServers = global.dns_servers || fabric.dns_servers;
                if (dnsServers && typeof dnsServers === 'object') {
                    html += createComplexCard('DNS Servers', dnsServers, 'dns', 'secondary', 'dnsServersTable');
                }

                // NTP Servers Card
                const ntpServers = global.ntp_servers || fabric.ntp_servers;
                if (ntpServers && typeof ntpServers === 'object') {
                    html += createComplexCard('NTP Servers', ntpServers, 'clock', 'info', 'ntpServersTable');
                }

                // Syslog Servers Card
                const syslogServers = global.syslog_servers || fabric.syslog_servers;
                if (syslogServers && typeof syslogServers === 'object') {
                    html += createComplexCard('Syslog Servers', syslogServers, 'journal-text', 'warning', 'syslogServersTable');
                }

                // NETFLOW Configuration Card
                const netflow = global.netflow || fabric.netflow;
                if (netflow && typeof netflow === 'object') {
                    html += createComplexCard('NETFLOW Configuration', netflow, 'diagram-2', 'dark', 'netflowTable');
                }

                html += '</div>';

                contentDiv.innerHTML = html;

                // Initialize Tabulator tables for complex objects
                if (dnsServers && typeof dnsServers === 'object') {
                    initializeComplexTable('dnsServersTable', dnsServers);
                }
                if (ntpServers && typeof ntpServers === 'object') {
                    initializeComplexTable('ntpServersTable', ntpServers);
                }
                if (syslogServers && typeof syslogServers === 'object') {
                    initializeComplexTable('syslogServersTable', syslogServers);
                }
                if (netflow && typeof netflow === 'object') {
                    initializeComplexTable('netflowTable', netflow);
                }
            } else {
                contentDiv.innerHTML = `<div class="alert alert-danger">Failed to load fabric details: ${fabricData.message || 'Unknown error'}</div>`;
            }
        })
        .catch(error => {
            console.error('Failed to load fabric details:', error);
            contentDiv.innerHTML = '<div class="alert alert-danger">Failed to load fabric details. Please check the console for errors.</div>';
        });

    // Helper function to create card for complex objects
    function createComplexCard(title, data, icon, colorClass, tableId) {
        const entries = Object.entries(data);
        if (entries.length === 0) return '';

        const textClass = ['warning', 'dark'].includes(colorClass) ? 'text-dark' : 'text-white';

        return `
            <div class="col-lg-6">
                <div class="card shadow-sm">
                    <div class="card-header bg-${colorClass} ${textClass}">
                        <h5 class="mb-0"><i class="bi bi-${icon} me-2"></i>${title}</h5>
                    </div>
                    <div class="card-body p-0">
                        <div id="${tableId}"></div>
                    </div>
                </div>
            </div>
        `;
    }

    // Helper function to initialize Tabulator for complex objects
    function initializeComplexTable(tableId, data) {
        // Check if data is an array of dictionaries or a single object
        let tableData = [];
        let columns = [];

        if (Array.isArray(data)) {
            // Data is a list of dictionaries - use each dictionary as a row
            tableData = data;

            // Extract column names from the first dictionary
            if (tableData.length > 0) {
                const firstItem = tableData[0];
                columns = Object.keys(firstItem).map(key => ({
                    title: key.replace(/_/g, ' ').toUpperCase(),
                    field: key,
                    formatter: (cell) => {
                        const value = cell.getValue();
                        return formatComplexValue(value);
                    }
                }));
            }
        } else if (typeof data === 'object') {
            // Data is a single object - convert to property/value pairs
            tableData = Object.entries(data).map(([key, value]) => ({
                property: key.replace(/_/g, ' ').toUpperCase(),
                value: value
            }));

            columns = [
                {
                    title: "Property",
                    field: "property",
                    widthGrow: 1,
                    formatter: (cell) => `<strong>${cell.getValue()}</strong>`
                },
                {
                    title: "Value",
                    field: "value",
                    widthGrow: 2,
                    formatter: (cell) => {
                        const value = cell.getValue();
                        return formatComplexValue(value);
                    }
                }
            ];
        }

        new Tabulator(`#${tableId}`, {
            data: tableData,
            layout: "fitColumns",
            responsiveLayout: "collapse",
            placeholder: "No Data Available",
            columns: columns
        });
    }

    // Helper function to format values
    function formatValue(value) {
        if (value === null || value === undefined) {
            return '<span class="text-muted">N/A</span>';
        }
        if (typeof value === 'boolean') {
            const icon = value ? 'check-circle-fill text-success' : 'x-circle text-muted';
            return `<i class="bi bi-${icon}"></i> ${value}`;
        }
        if (Array.isArray(value)) {
            if (value.length === 0) return '<span class="text-muted">Empty</span>';
            return value.join(', ');
        }
        if (typeof value === 'object') {
            return '<span class="text-muted">[Complex Object]</span>';
        }
        return value;
    }

    // Helper function to format complex nested values
    function formatComplexValue(value) {
        if (value === null || value === undefined) {
            return '<span class="text-muted">N/A</span>';
        }
        if (typeof value === 'boolean') {
            const icon = value ? 'check-circle-fill text-success' : 'x-circle text-muted';
            return `<i class="bi bi-${icon}"></i> ${value}`;
        }
        if (Array.isArray(value)) {
            if (value.length === 0) return '<span class="text-muted">Empty</span>';
            // Display array items as a comma-separated list or each on a new line for better readability
            if (value.length === 1) {
                return value[0];
            }
            return value.map(item => `<div class="mb-1">${item}</div>`).join('');
        }
        if (typeof value === 'object') {
            // Format nested objects as key-value pairs
            return Object.entries(value).map(([k, v]) =>
                `<div class="mb-1"><span class="text-muted">${k}:</span> <strong>${v}</strong></div>`
            ).join('');
        }
        return value;
    }
}


/**
 * YAML Modal Functions for NaC Resources
 */

/**
 * Show VRF YAML modal
 */
async function showVrfYamlModal(vrfName, tableInstances) {
    try {
        // Get the VRF data from the table
        const vrfTable = tableInstances['vrfInstancesTable'];
        if (!vrfTable) {
            console.error('VRF table not found');
            return;
        }

        // Find the VRF row data
        const rows = vrfTable.getData();
        const vrfData = rows.find(row => row.name === vrfName);

        if (!vrfData) {
            console.error(`VRF ${vrfName} not found in table data`);
            return;
        }

        // Use the complete original API data instead of just table fields
        const completeData = vrfData._originalData || vrfData;

        // Convert complete VRF data to YAML format
        const yamlContent = convertToYaml(completeData);

        // Update modal content
        document.querySelector('#vrfYamlName span').textContent = vrfName;
        const codeElement = document.getElementById('vrfYamlContent');
        codeElement.textContent = yamlContent;

        // Apply syntax highlighting
        codeElement.removeAttribute('data-highlighted');
        if (typeof hljs !== 'undefined') {
            hljs.highlightElement(codeElement);
        }

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('vrfYamlModal'));
        modal.show();

    } catch (error) {
        console.error('Error showing VRF YAML modal:', error);
        alert('Failed to display VRF YAML. Please try again.');
    }
}

/**
 * Show VRF YAML modal (Action VRFs page)
 */
async function showActionVrfYamlModal(vrfName, tableInstances) {
    try {
        // Get the VRF data from the action VRF table
        const vrfTable = tableInstances['actionVrfInstancesTable'];
        if (!vrfTable) {
            console.error('Action VRF table not found');
            return;
        }

        // Find the VRF row data
        const rows = vrfTable.getData();
        const vrfData = rows.find(row => row.name === vrfName);

        if (!vrfData) {
            console.error(`VRF ${vrfName} not found in action VRF table data`);
            return;
        }

        // Use the complete original API data instead of just table fields
        const completeData = vrfData._originalData || vrfData;

        // Convert complete VRF data to YAML format
        const yamlContent = convertToYaml(completeData);

        // Update modal content
        document.querySelector('#vrfYamlName span').textContent = vrfName;
        const codeElement = document.getElementById('vrfYamlContent');
        codeElement.textContent = yamlContent;

        // Apply syntax highlighting
        codeElement.removeAttribute('data-highlighted');
        if (typeof hljs !== 'undefined') {
            hljs.highlightElement(codeElement);
        }

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('vrfYamlModal'));
        modal.show();

    } catch (error) {
        console.error('Error showing Action VRF YAML modal:', error);
        alert('Failed to display VRF YAML. Please try again.');
    }
}

/**
 * Show Network YAML modal
 */
async function showNetworkYamlModal(networkName, tableInstances) {
    try {
        const networkTable = tableInstances['networksTable'];
        if (!networkTable) {
            console.error('Network table not found');
            return;
        }

        const rows = networkTable.getData();
        const networkData = rows.find(row => row.name === networkName);

        if (!networkData) {
            console.error(`Network ${networkName} not found in table data`);
            return;
        }

        const completeData = networkData._originalData || networkData;
        const yamlContent = convertToYaml(completeData);

        document.querySelector('#networkYamlName span').textContent = networkName;
        const codeElement = document.getElementById('networkYamlContent');
        codeElement.textContent = yamlContent;

        // Apply syntax highlighting
        codeElement.removeAttribute('data-highlighted');
        if (typeof hljs !== 'undefined') {
            hljs.highlightElement(codeElement);
        }

        const modal = new bootstrap.Modal(document.getElementById('networkYamlModal'));
        modal.show();

    } catch (error) {
        console.error('Error showing Network YAML modal:', error);
        alert('Failed to display Network YAML. Please try again.');
    }
}

/**
 * Show Network YAML modal (Action Networks page)
 */
async function showActionNetworkYamlModal(networkName, tableInstances) {
    try {
        // Get the Network data from the action Network table
        const networkTable = tableInstances['actionNetworkInstancesTable'];
        if (!networkTable) {
            console.error('Action Network table not found');
            return;
        }

        // Find the Network row data
        const rows = networkTable.getData();
        const networkData = rows.find(row => row.name === networkName);

        if (!networkData) {
            console.error(`Network ${networkName} not found in action Network table data`);
            return;
        }

        // Use the complete original API data instead of just table fields
        const completeData = networkData._originalData || networkData;

        // Convert complete Network data to YAML format
        const yamlContent = convertToYaml(completeData);

        // Update modal content
        document.querySelector('#networkYamlName span').textContent = networkName;
        const codeElement = document.getElementById('networkYamlContent');
        codeElement.textContent = yamlContent;

        // Apply syntax highlighting
        codeElement.removeAttribute('data-highlighted');
        if (typeof hljs !== 'undefined') {
            hljs.highlightElement(codeElement);
        }

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('networkYamlModal'));
        modal.show();

    } catch (error) {
        console.error('Error showing Action Network YAML modal:', error);
        alert('Failed to display Network YAML. Please try again.');
    }
}

/**
 * Show Switch YAML modal
 */
async function showSwitchYamlModal(hostname, tableInstances) {
    try {
        const switchTable = tableInstances['switchesTable'];
        if (!switchTable) {
            console.error('Switch table not found');
            return;
        }

        const rows = switchTable.getData();
        const switchData = rows.find(row => row.hostname === hostname);

        if (!switchData) {
            console.error(`Switch ${hostname} not found in table data`);
            return;
        }

        const completeData = switchData._originalData || switchData;
        const yamlContent = convertToYaml(completeData);

        document.querySelector('#switchYamlName span').textContent = hostname;
        const codeElement = document.getElementById('switchYamlContent');
        codeElement.textContent = yamlContent;

        // Apply syntax highlighting
        codeElement.removeAttribute('data-highlighted');
        if (typeof hljs !== 'undefined') {
            hljs.highlightElement(codeElement);
        }

        const modal = new bootstrap.Modal(document.getElementById('switchYamlModal'));
        modal.show();

    } catch (error) {
        console.error('Error showing Switch YAML modal:', error);
        alert('Failed to display Switch YAML. Please try again.');
    }
}

/**
 * Show Interface YAML modal
 */
async function showInterfaceYamlModal(interfaceName, switchHostname, tableInstances) {
    try {
        const interfaceTable = tableInstances['interfacesTable'];
        if (!interfaceTable) {
            console.error('Interface table not found');
            return;
        }

        const rows = interfaceTable.getData();
        const interfaceData = rows.find(row =>
            row.name === interfaceName && row.switch_hostname === switchHostname
        );

        if (!interfaceData) {
            console.error(`Interface ${interfaceName} on ${switchHostname} not found in table data`);
            return;
        }

        const completeData = interfaceData._originalData || interfaceData;
        const yamlContent = convertToYaml(completeData);

        document.querySelector('#interfaceYamlName span').textContent = `${interfaceName} (${switchHostname})`;
        const codeElement = document.getElementById('interfaceYamlContent');
        codeElement.textContent = yamlContent;

        // Apply syntax highlighting
        codeElement.removeAttribute('data-highlighted');
        if (typeof hljs !== 'undefined') {
            hljs.highlightElement(codeElement);
        }

        const modal = new bootstrap.Modal(document.getElementById('interfaceYamlModal'));
        modal.show();

    } catch (error) {
        console.error('Error showing Interface YAML modal:', error);
        alert('Failed to display Interface YAML. Please try again.');
    }
}

/**
 * Convert data to YAML format
 * Generic function that handles all data types
 */
function convertToYaml(data) {
    // Helper function to convert value to YAML format
    function formatValue(value, indent = 0) {
        const spaces = '  '.repeat(indent);

        if (value === null || value === undefined) {
            return 'null';
        } else if (typeof value === 'string') {
            // Quote strings if they contain special characters or are numeric
            if (value.includes(':') || value.includes('#') || !isNaN(value)) {
                return `"${value}"`;
            }
            return value;
        } else if (typeof value === 'boolean') {
            return value.toString();
        } else if (typeof value === 'number') {
            return value.toString();
        } else if (Array.isArray(value)) {
            if (value.length === 0) return '[]';
            return '\n' + value.map(item => {
                if (typeof item === 'object' && item !== null) {
                    return spaces + '  - ' + formatValue(item, indent + 1).trim();
                }
                return spaces + '  - ' + formatValue(item, indent + 1);
            }).join('\n');
        } else if (typeof value === 'object') {
            const entries = Object.entries(value);
            if (entries.length === 0) return '{}';
            return '\n' + entries.map(([k, v]) => {
                return spaces + '  ' + k + ': ' + formatValue(v, indent + 1);
            }).join('\n');
        }
        return String(value);
    }

    // Convert all fields to YAML
    const yamlLines = [];
    for (const [key, value] of Object.entries(data)) {
        // Skip internal fields starting with underscore
        if (key.startsWith('_')) continue;

        yamlLines.push(key + ': ' + formatValue(value));
    }

    return yamlLines.join('\n');
}


/**
 * Load VRFs into dropdown for action-networks page
 */
async function loadVrfDropdown() {
    const vrfSelect = document.getElementById('networkVrfName');
    if (!vrfSelect) {
        console.error('VRF select element not found');
        return;
    }

    try {
        const response = await fetch('/api/v1/nac/vrfs');
        const result = await response.json();

        if (result.status === 'success' && result.data) {
            // Clear existing options except the first one
            vrfSelect.innerHTML = '<option value="">Select a VRF</option>';

            // Add VRF options
            result.data.forEach(vrf => {
                const option = document.createElement('option');
                option.value = vrf.name;
                option.textContent = vrf.name;
                vrfSelect.appendChild(option);
            });

            console.log(`Loaded ${result.data.length} VRFs into dropdown`);
        } else {
            console.error('Failed to load VRFs:', result.message);
        }
    } catch (error) {
        console.error('Error loading VRFs:', error);
    }
}


/**
 * Load Network Attach Groups into dropdown for action-networks page
 */
async function loadAttachGroupsDropdown() {
    const attachGroupSelect = document.getElementById('networkAttachGroup');
    if (!attachGroupSelect) {
        console.error('Network Attach Group select element not found');
        return;
    }

    try {
        const response = await fetch('/api/v1/nac/network-attach-groups');
        const result = await response.json();

        if (result.status === 'success' && result.data) {
            // Clear existing options except the first one
            attachGroupSelect.innerHTML = '<option value="">Select an Attach Group</option>';

            // Add attach group options
            result.data.forEach(group => {
                const option = document.createElement('option');
                option.value = group.name;
                option.textContent = group.name;
                attachGroupSelect.appendChild(option);
            });

            console.log(`Loaded ${result.data.length} Network Attach Groups into dropdown`);
        } else {
            console.error('Failed to load Network Attach Groups:', result.message);
        }
    } catch (error) {
        console.error('Error loading Network Attach Groups:', error);
    }
}


/**
 * Event delegation for NaC YAML modal buttons
 * This must be called after DOM is loaded
 */
function initializeNacYamlEventListeners(tableInstances) {
    document.addEventListener('click', function(event) {
        // VRF YAML buttons (NaC YAML VRF page)
        if (event.target.closest('.view-vrf-yaml')) {
            const button = event.target.closest('.view-vrf-yaml');
            const vrfName = button.dataset.vrfName;
            showVrfYamlModal(vrfName, tableInstances);
        }

        // VRF YAML buttons (Action VRFs page)
        if (event.target.closest('.view-action-vrf-yaml')) {
            const button = event.target.closest('.view-action-vrf-yaml');
            const vrfName = button.dataset.vrfName;
            showActionVrfYamlModal(vrfName, tableInstances);
        }

        // Network YAML buttons (NaC YAML Networks page)
        if (event.target.closest('.view-network-yaml')) {
            const button = event.target.closest('.view-network-yaml');
            const networkName = button.dataset.networkName;
            showNetworkYamlModal(networkName, tableInstances);
        }

        // Network YAML buttons (Action Networks page)
        if (event.target.closest('.view-action-network-yaml')) {
            const button = event.target.closest('.view-action-network-yaml');
            const networkName = button.dataset.networkName;
            showActionNetworkYamlModal(networkName, tableInstances);
        }

        // Switch YAML buttons
        if (event.target.closest('.view-switch-yaml')) {
            const button = event.target.closest('.view-switch-yaml');
            const hostname = button.dataset.switchHostname;
            showSwitchYamlModal(hostname, tableInstances);
        }

        // Interface YAML buttons
        if (event.target.closest('.view-interface-yaml')) {
            const button = event.target.closest('.view-interface-yaml');
            const interfaceName = button.dataset.interfaceName;
            const switchHostname = button.dataset.switchHostname;
            showInterfaceYamlModal(interfaceName, switchHostname, tableInstances);
        }
    });
}


/**
 * Initialize form handlers for NaC action forms
 */
function initializeNacActionFormHandlers() {
    // VRF Action Form Handler
    const vrfActionForm = document.getElementById('vrfActionForm');
    if (vrfActionForm) {
        vrfActionForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            const responseDiv = document.getElementById('vrfActionResponse');
            const submitBtn = event.target.querySelector('button[type="submit"]');

            // Show loading state
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Merging...';

            // Get form data (required fields)
            const formData = {
                name: document.getElementById('vrfName').value,
                vrf_id: parseInt(document.getElementById('vrfId').value),
                vlan_id: parseInt(document.getElementById('vlanId').value)
            };

            // Add optional fields if provided
            const vrfVlanName = document.getElementById('vrfVlanName').value;
            if (vrfVlanName) {
                formData.vrf_vlan_name = vrfVlanName;
            }

            const vrfDescription = document.getElementById('vrfDescription').value;
            if (vrfDescription) {
                formData.vrf_description = vrfDescription;
            }

            try {
                const response = await fetch('/api/v1/nac/vrfs/merge', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();

                if (result.status === 'success') {
                    responseDiv.innerHTML = `<strong><i class="bi bi-check-circle me-2"></i>Success!</strong><p class="mb-0 mt-2">${result.message}. ${pullRequestSentence(result.pull_request_url)}</p>` +
                        changeRequestNotice(result.change_request);
                    responseDiv.className = 'alert alert-success';
                    responseDiv.style.display = 'block';

                    // Reset form after success
                    vrfActionForm.reset();
                } else {
                    responseDiv.innerHTML = `<strong><i class="bi bi-x-circle me-2"></i>Error</strong><p class="mb-0 mt-2">${result.message}</p>`;
                    responseDiv.className = 'alert alert-danger';
                    responseDiv.style.display = 'block';
                }
            } catch (error) {
                console.error('VRF merge error:', error);
                responseDiv.innerHTML = `<strong><i class="bi bi-x-circle me-2"></i>Error</strong><p class="mb-0 mt-2">Failed to merge VRF: ${error.message}</p>`;
                responseDiv.className = 'alert alert-danger';
                responseDiv.style.display = 'block';
            } finally {
                // Restore button state
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;

                // Smooth scroll to response
                responseDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });
    }

    // Network Action Form Handler
    const networkActionForm = document.getElementById('networkActionForm');
    if (networkActionForm) {
        networkActionForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            const responseDiv = document.getElementById('networkActionResponse');
            const submitBtn = event.target.querySelector('button[type="submit"]');

            // Show loading state
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Merging...';

            // Get form data (required fields)
            const formData = {
                name: document.getElementById('networkName').value,
                vrf_name: document.getElementById('networkVrfName').value,
                net_id: parseInt(document.getElementById('netId').value),
                vlan_id: parseInt(document.getElementById('networkVlanId').value)
            };

            // Add optional fields if provided
            const vlanName = document.getElementById('vlanName').value;
            if (vlanName) {
                formData.vlan_name = vlanName;
            }

            const gwIpAddress = document.getElementById('gwIpAddress').value;
            if (gwIpAddress) {
                formData.gw_ip_address = gwIpAddress;
            }

            const gwIpv6 = document.getElementById('gwIpv6Address').value;
            if (gwIpv6) {
                formData.gw_ipv6_address = gwIpv6;
            }

            const secondaryIp = document.getElementById('secondaryIpAddress').value;
            if (secondaryIp) {
                formData.secondary_ip_address = secondaryIp;
            }

            try {
                const response = await fetch('/api/v1/nac/networks/merge', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();

                if (result.status === 'success') {
                    responseDiv.innerHTML = `<strong><i class="bi bi-check-circle me-2"></i>Success!</strong><p class="mb-0 mt-2">${result.message}. ${pullRequestSentence(result.pull_request_url)}</p>` +
                        changeRequestNotice(result.change_request);
                    responseDiv.className = 'alert alert-success';
                    responseDiv.style.display = 'block';

                    // Reset form after success
                    networkActionForm.reset();
                } else {
                    responseDiv.innerHTML = `<strong><i class="bi bi-x-circle me-2"></i>Error</strong><p class="mb-0 mt-2">${result.message}</p>`;
                    responseDiv.className = 'alert alert-danger';
                    responseDiv.style.display = 'block';
                }
            } catch (error) {
                console.error('Network merge error:', error);
                responseDiv.innerHTML = `<strong><i class="bi bi-x-circle me-2"></i>Error</strong><p class="mb-0 mt-2">Failed to merge Network: ${error.message}</p>`;
                responseDiv.className = 'alert alert-danger';
                responseDiv.style.display = 'block';
            } finally {
                // Restore button state
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;

                // Smooth scroll to response
                responseDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });
    }
}


/**
 * Copy YAML to clipboard handlers
 */
function initializeNacYamlCopyHandlers() {
    // Copy YAML to clipboard (VRF)
    const copyYamlBtn = document.getElementById('copyYamlBtn');
    if (copyYamlBtn) {
        copyYamlBtn.addEventListener('click', function() {
            const yamlContent = document.getElementById('vrfYamlContent').textContent;

            navigator.clipboard.writeText(yamlContent).then(() => {
                // Show success feedback
                const originalText = this.innerHTML;
                this.innerHTML = '<i class="bi bi-check-lg me-1"></i>Copied!';
                this.classList.remove('btn-outline-secondary');
                this.classList.add('btn-success');

                setTimeout(() => {
                    this.innerHTML = originalText;
                    this.classList.remove('btn-success');
                    this.classList.add('btn-outline-secondary');
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy YAML:', err);
                alert('Failed to copy YAML to clipboard');
            });
        });
    }

    // Copy YAML to clipboard (Network)
    const copyNetworkYamlBtn = document.getElementById('copyNetworkYamlBtn');
    if (copyNetworkYamlBtn) {
        copyNetworkYamlBtn.addEventListener('click', function() {
            const yamlContent = document.getElementById('networkYamlContent').textContent;

            navigator.clipboard.writeText(yamlContent).then(() => {
                const originalText = this.innerHTML;
                this.innerHTML = '<i class="bi bi-check-lg me-1"></i>Copied!';
                this.classList.remove('btn-outline-secondary');
                this.classList.add('btn-success');

                setTimeout(() => {
                    this.innerHTML = originalText;
                    this.classList.remove('btn-success');
                    this.classList.add('btn-outline-secondary');
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy YAML:', err);
                alert('Failed to copy YAML to clipboard');
            });
        });
    }

    // Copy YAML to clipboard (Switch)
    const copySwitchYamlBtn = document.getElementById('copySwitchYamlBtn');
    if (copySwitchYamlBtn) {
        copySwitchYamlBtn.addEventListener('click', function() {
            const yamlContent = document.getElementById('switchYamlContent').textContent;

            navigator.clipboard.writeText(yamlContent).then(() => {
                const originalText = this.innerHTML;
                this.innerHTML = '<i class="bi bi-check-lg me-1"></i>Copied!';
                this.classList.remove('btn-outline-secondary');
                this.classList.add('btn-success');

                setTimeout(() => {
                    this.innerHTML = originalText;
                    this.classList.remove('btn-success');
                    this.classList.add('btn-outline-secondary');
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy YAML:', err);
                alert('Failed to copy YAML to clipboard');
            });
        });
    }

    // Copy YAML to clipboard (Interface)
    const copyInterfaceYamlBtn = document.getElementById('copyInterfaceYamlBtn');
    if (copyInterfaceYamlBtn) {
        copyInterfaceYamlBtn.addEventListener('click', function() {
            const yamlContent = document.getElementById('interfaceYamlContent').textContent;

            navigator.clipboard.writeText(yamlContent).then(() => {
                const originalText = this.innerHTML;
                this.innerHTML = '<i class="bi bi-check-lg me-1"></i>Copied!';
                this.classList.remove('btn-outline-secondary');
                this.classList.add('btn-success');

                setTimeout(() => {
                    this.innerHTML = originalText;
                    this.classList.remove('btn-success');
                    this.classList.add('btn-outline-secondary');
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy YAML:', err);
                alert('Failed to copy YAML to clipboard');
            });
        });
    }
}


/**
 * Convert JavaScript object to YAML-like string format
 */
function objectToYaml(obj, indent = 0) {
    const spaces = '  '.repeat(indent);
    let yaml = '';

    if (Array.isArray(obj)) {
        obj.forEach(item => {
            if (typeof item === 'object' && item !== null) {
                yaml += `${spaces}-\n${objectToYaml(item, indent + 1)}`;
            } else {
                yaml += `${spaces}- ${item}\n`;
            }
        });
    } else if (typeof obj === 'object' && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'object' && value !== null) {
                if (Array.isArray(value) && value.length === 0) {
                    yaml += `${spaces}${key}: []\n`;
                } else if (typeof value === 'object' && Object.keys(value).length === 0) {
                    yaml += `${spaces}${key}: {}\n`;
                } else {
                    yaml += `${spaces}${key}:\n${objectToYaml(value, indent + 1)}`;
                }
            } else if (value === null || value === undefined) {
                yaml += `${spaces}${key}: null\n`;
            } else if (typeof value === 'boolean') {
                yaml += `${spaces}${key}: ${value}\n`;
            } else if (typeof value === 'number') {
                yaml += `${spaces}${key}: ${value}\n`;
            } else {
                // String value - quote if contains special characters
                const needsQuotes = /[:#\[\]{}|>*&!%@`]/.test(value) || value === '';
                yaml += `${spaces}${key}: ${needsQuotes ? `"${value}"` : value}\n`;
            }
        }
    }

    return yaml;
}

/**
 * Show Bridge Domain YAML modal
 */
function showBridgeDomainYamlModal(bdName, tableInstances) {
    try {
        // Get the bridge domain data from the table
        const bdTable = tableInstances['bridgeDomainsTable'];
        if (!bdTable) {
            console.error('Bridge Domains table not found');
            return;
        }

        // Find the row data for the specified bridge domain
        const tableData = bdTable.getData();
        const bdData = tableData.find(row => row.name === bdName);

        if (!bdData) {
            console.error(`Bridge Domain '${bdName}' not found in table data`);
            return;
        }

        // Convert to YAML format
        const yamlContent = objectToYaml(bdData);

        // Update modal content
        document.getElementById('bridgeDomainYamlName').innerHTML = `Bridge Domain: <span class="fw-bold">${bdName}</span>`;

        const codeElement = document.getElementById('bridgeDomainYamlContent');
        codeElement.textContent = yamlContent;

        // Remove any previous highlighting and apply new highlighting
        codeElement.removeAttribute('data-highlighted');
        if (typeof hljs !== 'undefined') {
            hljs.highlightElement(codeElement);
        }

        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('bridgeDomainYamlModal'));
        modal.show();

    } catch (error) {
        console.error('Error showing Bridge Domain YAML modal:', error);
        alert('Error displaying YAML: ' + error.message);
    }
}

/**
 * Initialize Bridge Domain YAML modal copy button
 */
function initializeBridgeDomainYamlCopyButton() {
    const copyBtn = document.getElementById('copyBridgeDomainYamlBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', function() {
            const yamlContent = document.getElementById('bridgeDomainYamlContent').textContent;

            navigator.clipboard.writeText(yamlContent).then(() => {
                const originalText = this.innerHTML;
                this.innerHTML = '<i class="bi bi-check-lg me-1"></i>Copied!';
                this.classList.remove('btn-outline-secondary');
                this.classList.add('btn-success');

                setTimeout(() => {
                    this.innerHTML = originalText;
                    this.classList.remove('btn-success');
                    this.classList.add('btn-outline-secondary');
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy YAML:', err);
                alert('Failed to copy YAML to clipboard');
            });
        });
    }
}

// Initialize copy button when DOM is ready
document.addEventListener('DOMContentLoaded', initializeBridgeDomainYamlCopyButton);

/**
 * Initialize the Bridge Domains tenant selector and related functionality
 */
function initializeBridgeDomainsTenantSelector(tableInstances) {
    const tenantSelect = document.getElementById('bdTenantSelect');
    const loadBtn = document.getElementById('loadBridgeDomainsBtn');
    const tenantBadge = document.getElementById('bdTenantBadge');

    if (!tenantSelect || !loadBtn) {
        console.error('Bridge Domains: Tenant selector or load button not found');
        return;
    }

    // Load tenants into the dropdown
    fetch('/api/v1/nac/tenants')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success' && data.data) {
                // Clear existing options except the default
                tenantSelect.innerHTML = '<option value="">-- Select a Tenant --</option>';

                // Add tenant options
                data.data.forEach(tenant => {
                    const option = document.createElement('option');
                    option.value = tenant.name;
                    option.textContent = tenant.name + (tenant.alias ? ` (${tenant.alias})` : '');
                    tenantSelect.appendChild(option);
                });

                console.log(`Bridge Domains: Loaded ${data.data.length} tenants into dropdown`);
            } else {
                console.error('Bridge Domains: Failed to load tenants', data);
            }
        })
        .catch(error => {
            console.error('Bridge Domains: Error loading tenants', error);
        });

    // Enable/disable load button based on selection
    tenantSelect.addEventListener('change', function() {
        loadBtn.disabled = !this.value;
    });

    // Load bridge domains when button is clicked
    loadBtn.addEventListener('click', function() {
        const selectedTenant = tenantSelect.value;

        if (!selectedTenant) {
            alert('Please select a tenant first');
            return;
        }

        // Show loading state
        loadBtn.disabled = true;
        loadBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Loading...';

        // Fetch bridge domains for selected tenant
        fetch(`/api/v1/nac/bridge-domains?tenant=${encodeURIComponent(selectedTenant)}`)
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    // Update the table with new data
                    tableInstances['bridgeDomainsTable'].setData(data.data);

                    // Show tenant badge
                    if (tenantBadge) {
                        tenantBadge.textContent = `Tenant: ${selectedTenant}`;
                        tenantBadge.style.display = 'inline';
                    }

                    console.log(`Bridge Domains: Loaded ${data.data.length} bridge domains for tenant '${selectedTenant}'`);
                } else {
                    console.error('Bridge Domains: Failed to load data', data);
                    alert('Failed to load bridge domains: ' + (data.message || 'Unknown error'));
                }
            })
            .catch(error => {
                console.error('Bridge Domains: Error loading data', error);
                alert('Error loading bridge domains: ' + error.message);
            })
            .finally(() => {
                // Reset button state
                loadBtn.disabled = false;
                loadBtn.innerHTML = '<i class="bi bi-search me-2"></i>Load Bridge Domains';
            });
    });
}


/**
 * Initialize the Create Network form
 */
function initializeCreateNetworkForm() {
    const tenantSelect = document.getElementById('createNetworkTenant');
    const vrfSelect = document.getElementById('createNetworkVrf');
    const networkNameInput = document.getElementById('createNetworkName');
    const form = document.getElementById('createNetworkForm');
    const resetBtn = document.getElementById('resetCreateNetworkBtn');

    if (!tenantSelect || !vrfSelect || !form) {
        console.log('Create Network form elements not found');
        return;
    }

    // Load tenants into the dropdown
    fetch('/api/v1/nac/tenants')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success' && data.data) {
                // Clear existing options except the default
                tenantSelect.innerHTML = '<option value="">-- Select a Tenant --</option>';

                // Add tenant options
                data.data.forEach(tenant => {
                    const option = document.createElement('option');
                    option.value = tenant.name;
                    option.textContent = tenant.name + (tenant.alias ? ` (${tenant.alias})` : '');
                    tenantSelect.appendChild(option);
                });

                console.log(`Create Network: Loaded ${data.data.length} tenants into dropdown`);
            } else {
                console.error('Create Network: Failed to load tenants', data);
            }
        })
        .catch(error => {
            console.error('Create Network: Error loading tenants', error);
        });

    // Load VRFs when tenant is selected
    tenantSelect.addEventListener('change', function() {
        const selectedTenant = this.value;

        // Reset VRF dropdown
        vrfSelect.innerHTML = '<option value="">-- Loading VRFs... --</option>';
        vrfSelect.disabled = true;

        if (!selectedTenant) {
            vrfSelect.innerHTML = '<option value="">-- Select a Tenant first --</option>';
            return;
        }

        // Fetch VRFs for selected tenant
        fetch(`/api/v1/nac/tenant-vrfs?tenant=${encodeURIComponent(selectedTenant)}`)
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success' && data.data) {
                    vrfSelect.innerHTML = '<option value="">-- Select a VRF --</option>';

                    if (data.data.length === 0) {
                        vrfSelect.innerHTML = '<option value="">-- No VRFs found for this tenant --</option>';
                        vrfSelect.disabled = true;
                    } else {
                        // Add VRF options
                        data.data.forEach(vrf => {
                            const option = document.createElement('option');
                            option.value = vrf.name;
                            option.textContent = vrf.name + (vrf.alias ? ` (${vrf.alias})` : '');
                            vrfSelect.appendChild(option);
                        });
                        vrfSelect.disabled = false;
                    }

                    console.log(`Create Network: Loaded ${data.data.length} VRFs for tenant '${selectedTenant}'`);
                } else {
                    console.error('Create Network: Failed to load VRFs', data);
                    vrfSelect.innerHTML = '<option value="">-- Error loading VRFs --</option>';
                }
            })
            .catch(error => {
                console.error('Create Network: Error loading VRFs', error);
                vrfSelect.innerHTML = '<option value="">-- Error loading VRFs --</option>';
            });
    });

    // Handle form reset
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            form.reset();
            tenantSelect.value = '';
            vrfSelect.innerHTML = '<option value="">-- Select a Tenant first --</option>';
            vrfSelect.disabled = true;
        });
    }

    // Handle form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const tenant = tenantSelect.value;
        const vrf = vrfSelect.value;
        const networkName = networkNameInput.value.trim();

        if (!tenant) {
            alert('Please select a tenant');
            tenantSelect.focus();
            return;
        }

        if (!vrf) {
            alert('Please select a VRF');
            vrfSelect.focus();
            return;
        }

        if (!networkName) {
            alert('Please enter a network name');
            networkNameInput.focus();
            return;
        }

        // Show loading state on submit button
        const submitBtn = document.getElementById('submitCreateNetworkBtn');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating Network...';

        // Call the create network API
        fetch('/api/v1/nac/create-network', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tenant: tenant,
                vrf: vrf,
                network_name: networkName
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // Show success message with details
                const resultData = data.data;
                showCreateNetworkResultModal(true, {
                    message: data.message,
                    tenant: resultData.tenant,
                    vrf: resultData.vrf,
                    networkName: resultData.network_name,
                    subnet: resultData.subnet,
                    allocatedPrefix: resultData.allocated_prefix,
                    bridgeDomain: resultData.bridge_domain,
                    pullRequestUrl: data.pull_request_url,
                    changeRequest: data.change_request
                });

                // Reset form
                form.reset();
                vrfSelect.innerHTML = '<option value="">-- Select a Tenant first --</option>';
                vrfSelect.disabled = true;
            } else {
                // Show error message
                showCreateNetworkResultModal(false, {
                    message: data.message || 'Unknown error occurred'
                });
            }
        })
        .catch(error => {
            console.error('Create Network error:', error);
            showCreateNetworkResultModal(false, {
                message: 'Network error: ' + error.message
            });
        })
        .finally(() => {
            // Reset button state
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        });
    });
}

/**
 * Show Create Network result modal
 */
function showCreateNetworkResultModal(success, data) {
    // Remove existing modal if present
    const existingModal = document.getElementById('createNetworkResultModal');
    if (existingModal) {
        existingModal.remove();
    }

    const headerClass = success ? 'bg-success' : 'bg-danger';
    const icon = success ? 'bi-check-circle' : 'bi-x-circle';
    const title = success ? 'Network Created Successfully' : 'Network Creation Failed';

    let bodyContent = '';
    if (success) {
        const yamlContent = objectToYaml(data.bridgeDomain);
        bodyContent = `
            <div class="alert alert-success">
                <i class="bi bi-check-circle me-2"></i>${data.message}. ${pullRequestSentence(data.pullRequestUrl)}
                ${changeRequestNotice(data.changeRequest)}
            </div>
            <div class="row">
                <div class="col-md-6">
                    <p><strong>Tenant:</strong> ${data.tenant}</p>
                    <p><strong>VRF:</strong> ${data.vrf}</p>
                </div>
                <div class="col-md-6">
                    <p><strong>Network Name:</strong> ${data.networkName}</p>
                    <p><strong>Allocated Subnet:</strong> <span class="badge bg-info">${data.subnet}</span></p>
                </div>
            </div>
            <hr>
            <h6><i class="bi bi-file-earmark-code me-2"></i>Bridge Domain YAML</h6>
            <pre class="rounded" style="max-height: 300px; overflow-y: auto;"><code id="createNetworkYamlContent" class="language-yaml">${yamlContent}</code></pre>
        `;
    } else {
        bodyContent = `
            <div class="alert alert-danger">
                <i class="bi bi-x-circle me-2"></i>${data.message}
            </div>
            <p>Please check the following:</p>
            <ul>
                <li>NetBox prefix is configured in Admin settings</li>
                <li>NetBox has available prefixes in the pool</li>
                <li>NaC API is accessible and configured</li>
            </ul>
        `;
    }

    const modalHtml = `
        <div class="modal fade" id="createNetworkResultModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header ${headerClass} text-white">
                        <h5 class="modal-title">
                            <i class="bi ${icon} me-2"></i>${title}
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        ${bodyContent}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Apply syntax highlighting if success
    if (success) {
        const codeElement = document.getElementById('createNetworkYamlContent');
        if (codeElement && typeof hljs !== 'undefined') {
            hljs.highlightElement(codeElement);
        }
    }

    // Show the modal
    const modalElement = document.getElementById('createNetworkResultModal');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();

    // Clean up modal after it's hidden
    modalElement.addEventListener('hidden.bs.modal', function() {
        modalElement.remove();
    });
}

// Initialize Create Network form when DOM is ready
document.addEventListener('DOMContentLoaded', initializeCreateNetworkForm);


/**
 * Initialize the Create Tenant form
 */
function initializeCreateTenantForm() {
    const form = document.getElementById('createTenantForm');
    if (!form) return;

    const nameInput = document.getElementById('createTenantName');
    const descInput = document.getElementById('createTenantDescription');
    const submitBtn = document.getElementById('submitCreateTenantBtn');
    const resetBtn = document.getElementById('resetCreateTenantBtn');
    const responseDiv = document.getElementById('createTenantResponse');

    form.addEventListener('submit', async function(event) {
        event.preventDefault();

        const name = nameInput.value.trim();
        if (!name) return;

        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Creating...';
        submitBtn.disabled = true;
        responseDiv.style.display = 'none';

        try {
            const payload = { name: name };
            const description = descInput.value.trim();
            if (description) payload.description = description;

            const response = await fetch('/api/v1/nac/create-tenant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.status === 'success') {
                responseDiv.className = 'alert alert-success';
                responseDiv.innerHTML = `<strong><i class="bi bi-check-circle me-1"></i>Success!</strong> Tenant <strong>${name}</strong> created in both NetBox and the NaC data model. ${pullRequestSentence(result.pull_request_url)}` +
                    changeRequestNotice(result.change_request);
                form.reset();
            } else {
                responseDiv.className = 'alert alert-danger';
                responseDiv.innerHTML = `<strong><i class="bi bi-exclamation-triangle me-1"></i>Error:</strong> ${result.message}`;
            }
        } catch (error) {
            responseDiv.className = 'alert alert-danger';
            responseDiv.innerHTML = `<strong><i class="bi bi-exclamation-triangle me-1"></i>Error:</strong> ${error.message}`;
        }

        responseDiv.style.display = 'block';
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
        responseDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    resetBtn.addEventListener('click', function() {
        form.reset();
        responseDiv.style.display = 'none';
    });
}

document.addEventListener('DOMContentLoaded', initializeCreateTenantForm);


/**
 * Initialize the Create VRF form (with tenant dropdown)
 */
function initializeCreateTenantVrfForm() {
    const form = document.getElementById('createTenantVrfForm');
    if (!form) return;

    const tenantSelect = document.getElementById('createVrfTenant');
    const nameInput = document.getElementById('createVrfName');
    const descInput = document.getElementById('createVrfDescription');
    const submitBtn = document.getElementById('submitCreateVrfBtn');
    const resetBtn = document.getElementById('resetCreateVrfBtn');
    const responseDiv = document.getElementById('createTenantVrfResponse');

    // Load tenants into dropdown
    async function loadTenants() {
        try {
            const response = await fetch('/api/v1/nac/tenants');
            const result = await response.json();

            // Clear existing options except placeholder
            while (tenantSelect.options.length > 1) {
                tenantSelect.remove(1);
            }

            if (result.status === 'success' && result.data) {
                result.data.forEach(function(tenant) {
                    const option = document.createElement('option');
                    option.value = tenant.name;
                    option.textContent = tenant.name;
                    tenantSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Failed to load tenants:', error);
        }
    }

    loadTenants();

    form.addEventListener('submit', async function(event) {
        event.preventDefault();

        const tenant = tenantSelect.value;
        const name = nameInput.value.trim();
        if (!tenant || !name) return;

        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Creating...';
        submitBtn.disabled = true;
        responseDiv.style.display = 'none';

        try {
            const payload = { tenant: tenant, name: name };
            const description = descInput.value.trim();
            if (description) payload.description = description;

            const response = await fetch('/api/v1/nac/create-vrf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.status === 'success') {
                responseDiv.className = 'alert alert-success';
                responseDiv.innerHTML = `<strong><i class="bi bi-check-circle me-1"></i>Success!</strong> VRF <strong>${name}</strong> created in tenant <strong>${tenant}</strong> in both NetBox and the NaC data model. ${pullRequestSentence(result.pull_request_url)}` +
                    changeRequestNotice(result.change_request);
                form.reset();
                loadTenants();
            } else {
                responseDiv.className = 'alert alert-danger';
                responseDiv.innerHTML = `<strong><i class="bi bi-exclamation-triangle me-1"></i>Error:</strong> ${result.message}`;
            }
        } catch (error) {
            responseDiv.className = 'alert alert-danger';
            responseDiv.innerHTML = `<strong><i class="bi bi-exclamation-triangle me-1"></i>Error:</strong> ${error.message}`;
        }

        responseDiv.style.display = 'block';
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
        responseDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    resetBtn.addEventListener('click', function() {
        form.reset();
        responseDiv.style.display = 'none';
    });
}

document.addEventListener('DOMContentLoaded', initializeCreateTenantVrfForm);


/**
 * Describe the pull request created by an operation, linking to it when the URL is known
 */
function pullRequestSentence(url) {
    if (url && /^https?:\/\//.test(url)) {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.className = 'alert-link';
        link.textContent = 'pull request #' + (url.match(/\/pull\/(\d+)/) || [, ''])[1];
        return 'Review ' + link.outerHTML + ' <i class="bi bi-box-arrow-up-right small"></i> before it is merged.';
    }
    return 'A pull request has been created for review.';
}


/**
 * Describe the change request email sent for an operation
 *
 * Returns an HTML snippet: a confirmation when the email was sent, a warning when
 * sending failed (the pull request still exists), and nothing when email is disabled.
 */
function changeRequestNotice(changeRequest) {
    if (!changeRequest || changeRequest.message === 'Change request email is not configured') return '';
    const escape = function(value) {
        const div = document.createElement('div');
        div.textContent = value == null ? '' : String(value);
        return div.innerHTML;
    };
    if (changeRequest.sent) {
        return '<div class="change-request-notice mt-2 small"><i class="bi bi-envelope-check me-1"></i>' +
            'Change request emailed to ' + escape((changeRequest.recipients || []).join(', ')) +
            ' to open a ServiceNow change.</div>';
    }
    return '<div class="change-request-notice change-request-failed mt-2 small"><i class="bi bi-envelope-exclamation me-1"></i>' +
        '<strong>Change request email was not sent</strong>, so no ServiceNow change has been opened. ' +
        'The pull request was still created. <span class="d-block mt-1 opacity-75">' + escape(changeRequest.message) + '</span></div>';
}


/**
 * Initialize the Add VLAN to Trunk Port form (cascading dropdowns)
 */
function initializeAddStaticPortForm() {
    const form = document.getElementById('addStaticPortForm');
    if (!form) return;

    const leafSelect = document.getElementById('staticPortLeafNode');
    const portSelect = document.getElementById('staticPortPort');
    const epgSelect = document.getElementById('staticPortEpg');
    const modeSelect = document.getElementById('staticPortMode');
    const submitBtn = document.getElementById('submitAddStaticPortBtn');
    const resetBtn = document.getElementById('resetAddStaticPortBtn');
    const responseDiv = document.getElementById('addStaticPortResponse');

    function resetDownstream(from) {
        if (from <= 1) {
            portSelect.innerHTML = '<option value="">-- Select a Leaf Node first --</option>';
            portSelect.disabled = true;
        }
        if (from <= 2) {
            epgSelect.innerHTML = '<option value="">-- Select a Port first --</option>';
            epgSelect.disabled = true;
        }
        if (from <= 3) {
            modeSelect.disabled = true;
        }
    }

    async function loadLeafNodes() {
        try {
            const response = await fetch('/api/v1/nac/leaf-nodes');
            const result = await response.json();
            leafSelect.innerHTML = '<option value="">-- Select a Leaf Node --</option>';
            if (result.status === 'success' && result.data) {
                result.data.forEach(function(node) {
                    const option = document.createElement('option');
                    option.value = node.id;
                    option.textContent = node.name + ' (Node ' + node.id + ')';
                    leafSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading leaf nodes:', error);
        }
    }

    loadLeafNodes();

    leafSelect.addEventListener('change', async function() {
        resetDownstream(1);
        const nodeId = this.value;
        if (!nodeId) return;

        portSelect.innerHTML = '<option value="">-- Loading... --</option>';
        try {
            const response = await fetch('/api/v1/nac/leaf-ports?node_id=' + nodeId);
            const result = await response.json();
            portSelect.innerHTML = '<option value="">-- Select a Port --</option>';
            if (result.status === 'success' && result.data && result.data.length > 0) {
                result.data.forEach(function(port) {
                    const option = document.createElement('option');
                    option.value = port.module + '/' + port.port;
                    option.textContent = port.module + '/' + port.port + ' (' + port.policy_group + ')';
                    portSelect.appendChild(option);
                });
                portSelect.disabled = false;
            } else {
                portSelect.innerHTML = '<option value="">-- No ports found --</option>';
            }
        } catch (error) {
            console.error('Error loading ports:', error);
            portSelect.innerHTML = '<option value="">-- Error loading ports --</option>';
        }
    });

    // Existing bindings display element (inserted after the port dropdown)
    var existingDiv = document.getElementById('staticPortExisting');
    if (!existingDiv) {
        existingDiv = document.createElement('div');
        existingDiv.id = 'staticPortExisting';
        existingDiv.style.display = 'none';
        portSelect.parentNode.after(existingDiv);
    }

    portSelect.addEventListener('change', async function() {
        resetDownstream(2);
        existingDiv.style.display = 'none';
        const portValue = this.value;
        const nodeId = leafSelect.value;
        if (!portValue || !nodeId) return;

        const parts = portValue.split('/');
        epgSelect.innerHTML = '<option value="">-- Loading... --</option>';
        try {
            const response = await fetch(
                '/api/v1/nac/port-available-epgs?node_id=' + nodeId + '&module=' + parts[0] + '&port=' + parts[1]
            );
            const result = await response.json();

            // Show existing bindings
            if (result.existing && result.existing.length > 0) {
                var items = result.existing.map(function(epg) {
                    var badge = epg.mode === 'native' ? 'bg-warning text-dark' :
                                epg.mode === 'untagged' ? 'bg-secondary' : 'bg-primary';
                    return '<li class="list-group-item d-flex justify-content-between align-items-center py-2">' +
                        '<span><i class="bi bi-check-circle-fill text-success me-2"></i>' + epg.display +
                        ((epg.subnets || []).length ? ' <span class="text-muted small">' + epg.subnets.join(', ') + '</span>' : '') + '</span>' +
                        '<span class="badge ' + badge + '">' + (epg.mode || 'regular') + '</span></li>';
                }).join('');
                existingDiv.innerHTML = '<div class="mb-4"><small class="form-text fw-bold text-muted d-block mb-2">' +
                    '<i class="bi bi-info-circle me-1"></i>Currently trunked on port ' + portValue + ':</small>' +
                    '<ul class="list-group list-group-flush">' + items + '</ul></div>';
                existingDiv.style.display = 'block';
            } else {
                existingDiv.innerHTML = '';
                existingDiv.style.display = 'none';
            }

            // Populate available EPGs dropdown
            epgSelect.innerHTML = '<option value="">-- Select an EPG --</option>';
            if (result.status === 'success' && result.data && result.data.length > 0) {
                result.data.forEach(function(epg) {
                    var option = document.createElement('option');
                    option.value = JSON.stringify({
                        tenant: epg.tenant,
                        application_profile: epg.application_profile,
                        endpoint_group: epg.endpoint_group,
                        vlan: epg.vlan
                    });
                    option.textContent = epg.display + ((epg.subnets || []).length ? ' \u2014 ' + epg.subnets.join(', ') : '');
                    epgSelect.appendChild(option);
                });
                epgSelect.disabled = false;
            } else {
                epgSelect.innerHTML = '<option value="">-- No available EPGs for this port --</option>';
            }
        } catch (error) {
            console.error('Error loading EPGs:', error);
            epgSelect.innerHTML = '<option value="">-- Error loading EPGs --</option>';
        }
    });

    epgSelect.addEventListener('change', function() {
        modeSelect.disabled = !this.value;
        if (this.value) modeSelect.value = 'regular';
    });

    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        if (!epgSelect.value) return;

        const epgData = JSON.parse(epgSelect.value);
        const portParts = portSelect.value.split('/');
        const payload = {
            tenant: epgData.tenant,
            application_profile: epgData.application_profile,
            endpoint_group: epgData.endpoint_group,
            node_id: parseInt(leafSelect.value),
            module: parseInt(portParts[0]),
            port: parseInt(portParts[1]),
            vlan: epgData.vlan,
            mode: modeSelect.value
        };

        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Adding...';
        submitBtn.disabled = true;
        responseDiv.style.display = 'none';

        try {
            const response = await fetch('/api/v1/nac/add-static-port', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();

            if (result.status === 'success') {
                responseDiv.className = 'alert alert-success';
                responseDiv.innerHTML = '<strong><i class="bi bi-check-circle me-1"></i>Success!</strong> ' + result.message + '. ' + pullRequestSentence(result.pull_request_url) +
                    changeRequestNotice(result.change_request);
                form.reset();
                resetDownstream(1);
                loadLeafNodes();
            } else {
                responseDiv.className = 'alert alert-danger';
                responseDiv.innerHTML = '<strong><i class="bi bi-exclamation-triangle me-1"></i>Error:</strong> ' + result.message;
            }
        } catch (error) {
            responseDiv.className = 'alert alert-danger';
            responseDiv.innerHTML = '<strong><i class="bi bi-exclamation-triangle me-1"></i>Error:</strong> ' + error.message;
        }

        responseDiv.style.display = 'block';
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        responseDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    resetBtn.addEventListener('click', function() {
        form.reset();
        resetDownstream(1);
        existingDiv.style.display = 'none';
        responseDiv.style.display = 'none';
    });
}

document.addEventListener('DOMContentLoaded', initializeAddStaticPortForm);


/**
 * Initialize the VRFs tenant selector and related functionality
 */
function initializeVrfsTenantSelector(tableInstances) {
    const tenantSelect = document.getElementById('vrfTenantSelect');
    const loadBtn = document.getElementById('loadVrfsBtn');
    const tenantBadge = document.getElementById('vrfTenantBadge');

    if (!tenantSelect || !loadBtn) {
        console.error('VRFs: Tenant selector or load button not found');
        return;
    }

    // Load tenants into the dropdown
    fetch('/api/v1/nac/tenants')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success' && data.data) {
                // Clear existing options except the default
                tenantSelect.innerHTML = '<option value="">-- Select a Tenant --</option>';

                // Add tenant options
                data.data.forEach(tenant => {
                    const option = document.createElement('option');
                    option.value = tenant.name;
                    option.textContent = tenant.name + (tenant.alias ? ` (${tenant.alias})` : '');
                    tenantSelect.appendChild(option);
                });

                console.log(`VRFs: Loaded ${data.data.length} tenants into dropdown`);
            } else {
                console.error('VRFs: Failed to load tenants', data);
            }
        })
        .catch(error => {
            console.error('VRFs: Error loading tenants', error);
        });

    // Enable/disable load button based on selection
    tenantSelect.addEventListener('change', function() {
        loadBtn.disabled = !this.value;
    });

    // Load VRFs when button is clicked
    loadBtn.addEventListener('click', function() {
        const selectedTenant = tenantSelect.value;

        if (!selectedTenant) {
            alert('Please select a tenant first');
            return;
        }

        // Show loading state
        loadBtn.disabled = true;
        loadBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Loading...';

        // Fetch VRFs for selected tenant
        fetch(`/api/v1/nac/tenant-vrfs?tenant=${encodeURIComponent(selectedTenant)}`)
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    // Update the table with new data
                    tableInstances['nacVrfsTable'].setData(data.data);

                    // Show tenant badge
                    if (tenantBadge) {
                        tenantBadge.textContent = `Tenant: ${selectedTenant}`;
                        tenantBadge.style.display = 'inline';
                    }

                    console.log(`VRFs: Loaded ${data.data.length} VRFs for tenant '${selectedTenant}'`);
                } else {
                    console.error('VRFs: Failed to load data', data);
                    alert('Failed to load VRFs: ' + (data.message || 'Unknown error'));
                }
            })
            .catch(error => {
                console.error('VRFs: Error loading data', error);
                alert('Error loading VRFs: ' + error.message);
            })
            .finally(() => {
                // Reset button state
                loadBtn.disabled = false;
                loadBtn.innerHTML = '<i class="bi bi-search me-2"></i>Load VRFs';
            });
    });
}


/**
 * Show NaC VRF YAML modal
 */
function showNacVrfYamlModal(vrfName, tableInstances) {
    try {
        // Get the VRF data from the table
        const vrfTable = tableInstances['nacVrfsTable'];
        if (!vrfTable) {
            console.error('NaC VRFs table not found');
            return;
        }

        // Find the row data for the specified VRF
        const tableData = vrfTable.getData();
        const vrfData = tableData.find(row => row.name === vrfName);

        if (!vrfData) {
            console.error(`VRF '${vrfName}' not found in table data`);
            return;
        }

        // Convert to YAML format
        const yamlContent = objectToYaml(vrfData);

        // Update modal content (reuse the VRF YAML modal)
        document.getElementById('vrfYamlName').innerHTML = `VRF: <span class="fw-bold">${vrfName}</span>`;

        const codeElement = document.getElementById('vrfYamlContent');
        codeElement.textContent = yamlContent;

        // Apply syntax highlighting
        codeElement.removeAttribute('data-highlighted');
        if (typeof hljs !== 'undefined') {
            hljs.highlightElement(codeElement);
        }

        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('vrfYamlModal'));
        modal.show();

    } catch (error) {
        console.error('Error showing NaC VRF YAML modal:', error);
        alert('Error displaying YAML: ' + error.message);
    }
}


/**
 * Initialize the Server Connections page
 *
 * One page for the three things a server team asks the network team to do. Nothing
 * but the three action buttons shows until one is chosen; then the form for that
 * action appears. All three start from a server in NetBox and its profile: each
 * interface, the leaf port it is cabled to, and the VLANs bound to that port.
 *
 * - Modify: add and remove VLANs on the server's ports (one PR)
 * - Copy:   give another server the same VLANs, interface by interface (one PR)
 * - Move:   follow the server to the free ports it was re-cabled to (one PR, NetBox updated)
 */
function initializeServerConnections() {
    const page = document.getElementById('page-server-connections');
    if (!page) return;

    const $ = id => document.getElementById(id);
    const form = $('serverConnectionsForm');
    const actionButtons = page.querySelectorAll('.sc-action');
    const steps = page.querySelectorAll('.sc-step');
    const rowSelect = $('scRow'), rackSelect = $('scRack'), searchInput = $('scSearch');
    const serverSelect = $('scServer'), serverHelp = $('scServerHelp'), profileDiv = $('scProfile');
    const modifyEditor = $('scModifyEditor');
    const targetSearch = $('scTargetSearch'), targetSelect = $('scTarget'), copyMappings = $('scCopyMappings');
    const targetHelp = $('scTargetHelp');
    const moveRack = $('scMoveRack'), moveMappings = $('scMoveMappings'), moveRemoveSource = $('scMoveRemoveSource');
    const submitBtn = $('scSubmitBtn'), submitLabel = $('scSubmitLabel'), resetBtn = $('scResetBtn');
    const responseDiv = $('scResponse');

    const ACTIONS = {
        modify: { heading: 'Server', submit: 'Submit VLAN Changes' },
        copy: { heading: 'Copy From', submit: 'Copy Profile' },
        move: { heading: 'Server', submit: 'Request Move' }
    };

    let action = null;
    let servers = [], racks = [], targets = [];
    // Server IDs by configuration state, from /server-config-status; null until loaded
    let movable = null;      // VLANs on their cabled ports: can be moved
    let copyTargets = null;  // cabled but nothing configured: valid copy destinations
    let profile = [], targetProfile = [];
    let available = {};  // interface_id -> EPGs that can be added to that port

    function escapeHtml(value) {
        const div = document.createElement('div');
        div.textContent = value == null ? '' : String(value);
        return div.innerHTML;
    }

    // textContent-based escaping leaves quotes alone, which breaks attribute values (JSON in value="...")
    function escapeAttr(value) {
        return escapeHtml(value).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    const bindingKey = b => [b.tenant, b.application_profile, b.endpoint_group, b.vlan].join('|');
    const location = s => (s.row || 'No row') + ', Rack ' + (s.rack || '?');
    const selectedServer = () => servers.find(s => String(s.id) === serverSelect.value);
    const cabled = list => list.filter(c => c.leaf && c.node_id && c.port != null);

    // "VLAN 30 · MGMT-EPG · 10.100.30.0/24", plus the mode when it isn't regular (tagged).
    // The subnet comes from NetBox IPAM and is left out when NetBox has no prefix for the VLAN.
    function vlanLabel(b, mode) {
        const m = mode !== undefined ? mode : b.mode;
        return 'VLAN ' + escapeHtml(b.vlan) + ' \u00b7 ' + escapeHtml(b.endpoint_group) +
            ((b.subnets || []).length ? ' \u00b7 <span class="sc-subnet">' + escapeHtml(b.subnets.join(', ')) + '</span>' : '') +
            (m && m !== 'regular' ? ' \u00b7 ' + escapeHtml(m) : '');
    }

    // Plain-text form for <option> elements, which can't hold markup
    function vlanText(e) {
        return 'VLAN ' + e.vlan + ' \u00b7 ' + e.endpoint_group + ((e.subnets || []).length ? ' \u00b7 ' + e.subnets.join(', ') : '');
    }

    function vlanBadges(bindings) {
        return (bindings || []).length
            ? bindings.map(b => '<span class="badge bg-primary me-1 mb-1">' + vlanLabel(b) + '</span>').join('')
            : '<span class="text-muted">no VLANs</span>';
    }

    // ---- Action chooser --------------------------------------------------

    function chooseAction(next) {
        action = next;
        actionButtons.forEach(function(btn) {
            const on = btn.dataset.action === action;
            btn.classList.toggle('active', on);
            btn.setAttribute('aria-checked', on ? 'true' : 'false');
        });
        form.style.display = action ? 'block' : 'none';
        steps.forEach(step => step.style.display = step.dataset.for === action ? 'block' : 'none');
        if (!action) return;
        $('scServerHeading').textContent = ACTIONS[action].heading;
        submitLabel.textContent = ACTIONS[action].submit;
        responseDiv.style.display = 'none';
        renderServers();
        if (action === 'move' || action === 'copy') loadConfigStatus();
        // Keep the chosen server when switching actions; rebuild the action-specific step
        if (selectedServer()) onServerChosen(); else resetSteps();
    }

    actionButtons.forEach(btn => btn.addEventListener('click', () => chooseAction(btn.dataset.action)));

    // ---- Server picker (shared) -----------------------------------------

    function fillSelect(select, placeholder, values) {
        const current = select.value;
        select.innerHTML = '<option value="">' + placeholder + '</option>' +
            values.map(v => '<option value="' + escapeAttr(v) + '">' + escapeHtml(v) + '</option>').join('');
        if (values.includes(current)) select.value = current;
    }

    function uniqueSorted(values) {
        return Array.from(new Set(values.filter(Boolean))).sort();
    }

    function serverOptions(list, query, excludeId) {
        return list.filter(s => String(s.id) !== String(excludeId) &&
            (!query || [s.name, s.description, s.row, s.rack].join(' ').toLowerCase().includes(query)))
            .map(s => '<option value="' + s.id + '">' + escapeHtml(s.name) + ' — ' +
                escapeHtml(s.description || 'Server') + ' (' + escapeHtml(location(s)) + ')</option>').join('');
    }

    function renderServers() {
        fillSelect(rackSelect, 'All racks', uniqueSorted(servers.filter(s => !rowSelect.value || s.row === rowSelect.value).map(s => s.rack)));
        // Move only offers servers that have VLANs configured on their cabled ports
        const pool = action === 'move' && movable ? servers.filter(s => movable.has(s.id)) : servers;
        const list = pool.filter(s => (!rowSelect.value || s.row === rowSelect.value) &&
                                      (!rackSelect.value || s.rack === rackSelect.value));
        const selected = serverSelect.value;
        serverSelect.innerHTML = serverOptions(list, searchInput.value.trim().toLowerCase());
        if (Array.from(serverSelect.options).some(o => o.value === selected)) serverSelect.value = selected;
        else if (selected) { serverSelect.value = ''; profileDiv.style.display = 'none'; resetSteps(); }
        serverHelp.textContent = action === 'move' && movable === null ? 'Finding servers that can be moved...'
            : serverSelect.options.length + ' of ' + pool.length + (action === 'move' ? ' movable' : '') + ' servers shown' +
              (action === 'move' ? ' \u2014 only servers with VLANs configured on their cabled ports can be moved' : '');
    }

    async function loadReferenceData() {
        try {
            const [serversRes, racksRes] = await Promise.all([
                fetch('/api/v1/netbox/servers').then(r => r.json()),
                fetch('/api/v1/netbox/racks').then(r => r.json())
            ]);
            servers = serversRes.status === 'success' ? serversRes.data : [];
            racks = racksRes.status === 'success' ? racksRes.data : [];
            fillSelect(rowSelect, 'All rows', uniqueSorted(servers.map(s => s.row)));
            renderServers();
        } catch (error) {
            console.error('Error loading servers:', error);
            serverHelp.textContent = 'Failed to load servers from NetBox';
        }
    }

    async function loadConfigStatus() {
        movable = null;
        copyTargets = null;
        renderServers();
        renderTargets();
        try {
            const result = await fetch('/api/v1/nac/server-config-status').then(r => r.json());
            const data = result.status === 'success' ? result.data : { configured: [], unconfigured: [] };
            movable = new Set(data.configured);
            copyTargets = new Set(data.unconfigured);
        } catch (error) {
            console.error('Error loading server configuration status:', error);
            movable = new Set();
            copyTargets = new Set();
        }
        renderServers();
        renderTargets();
    }

    rowSelect.addEventListener('change', () => { rackSelect.value = ''; renderServers(); });
    rackSelect.addEventListener('change', renderServers);
    searchInput.addEventListener('input', renderServers);

    async function fetchProfile(serverId) {
        const result = await fetch('/api/v1/nac/server-profile/' + serverId).then(r => r.json());
        return result.status === 'success' ? result.data : [];
    }

    function renderProfile(server, list) {
        const rows = list.map(c => '<tr><td class="fw-semibold">' + escapeHtml(c.interface) + '</td><td>' +
            (c.leaf ? escapeHtml(c.leaf) + ' ' + escapeHtml(c.leaf_interface) + ' <span class="text-muted">(Node ' +
                      escapeHtml(c.node_id) + ')</span>' : '<em>not cabled</em>') +
            '</td><td>' + vlanBadges(c.bindings) + '</td></tr>').join('');
        profileDiv.innerHTML = '<div class="small fw-bold mb-2 sc-label"><i class="bi bi-person-badge me-1"></i>Current profile of ' +
            escapeHtml(server.name) + ' (' + escapeHtml(location(server)) + ')</div>' +
            '<div class="table-responsive"><table class="table table-sm align-middle mb-0 sc-table">' +
            '<thead><tr><th>Interface</th><th>Leaf port</th><th>VLANs</th></tr></thead><tbody>' +
            (rows || '<tr><td colspan="3" class="text-muted">No interfaces in NetBox</td></tr>') + '</tbody></table></div>';
        profileDiv.style.display = 'block';
    }

    function resetSteps() {
        modifyEditor.innerHTML = '<p class="text-muted mb-0">Select a server first.</p>';
        targetSelect.innerHTML = ''; targetSelect.disabled = true; copyMappings.innerHTML = ''; targetHelp.textContent = '';
        moveRack.innerHTML = '<option value="">-- Select a Server first --</option>'; moveRack.disabled = true;
        moveMappings.innerHTML = '';
        submitBtn.disabled = true;
    }

    async function onServerChosen() {
        resetSteps();
        responseDiv.style.display = 'none';
        const server = selectedServer();
        if (!server) { profileDiv.style.display = 'none'; return; }

        profileDiv.innerHTML = '<div class="text-muted small"><span class="spinner-border spinner-border-sm me-1"></span>Loading profile...</div>';
        profileDiv.style.display = 'block';
        try {
            profile = await fetchProfile(server.id);
            renderProfile(server, profile);
            if (action === 'modify') await buildModify();
            if (action === 'copy') buildCopy();
            if (action === 'move') await buildMove();
        } catch (error) {
            console.error('Error loading server profile:', error);
            profileDiv.innerHTML = '<div class="alert alert-danger mb-0">Failed to load the server profile.</div>';
        }
    }

    serverSelect.addEventListener('change', onServerChosen);

    // ---- Modify ------------------------------------------------------------

    async function buildModify() {
        const ports = cabled(profile);
        if (ports.length === 0) {
            modifyEditor.innerHTML = '<div class="alert alert-warning mb-0">None of this server’s interfaces are cabled to a leaf in NetBox.</div>';
            return;
        }
        modifyEditor.innerHTML = '<div class="text-muted small"><span class="spinner-border spinner-border-sm me-1"></span>Loading available VLANs...</div>';
        const results = await Promise.all(ports.map(c =>
            fetch('/api/v1/nac/port-available-epgs?node_id=' + c.node_id + '&module=' + c.module + '&port=' + c.port).then(r => r.json())));
        available = {};
        ports.forEach((c, i) => available[c.interface_id] = results[i].status === 'success' ? results[i].data : []);

        modifyEditor.innerHTML = ports.map(function(c) {
            const current = (c.bindings || []).map(b =>
                '<label class="sc-chip"><input type="checkbox" class="form-check-input me-1 sc-remove" data-iface="' + c.interface_id +
                '" value="' + escapeAttr(JSON.stringify(b)) + '"> <span>' + vlanLabel(b) + '</span></label>').join('');
            const addable = available[c.interface_id].map(e =>
                '<option value="' + escapeAttr(JSON.stringify(e)) + '">' + escapeHtml(vlanText(e)) + '</option>').join('');
            return '<div class="sc-port border rounded p-3 mb-3" data-iface="' + c.interface_id + '">' +
                '<div class="fw-semibold mb-2"><i class="bi bi-ethernet me-1"></i>' + escapeHtml(c.interface) + ' → ' +
                escapeHtml(c.leaf) + ' ' + escapeHtml(c.leaf_interface) + ' <span class="text-muted small">(Node ' + c.node_id + ')</span></div>' +
                '<div class="small sc-label mb-1">Current VLANs — tick to remove</div>' +
                '<div class="mb-2">' + (current || '<span class="text-muted small">none</span>') + '</div>' +
                '<div class="small sc-label mb-1">Add VLANs</div>' +
                '<div class="row g-2"><div class="col-md-8"><select class="form-select form-select-sm sc-add-epg" data-iface="' + c.interface_id + '"' +
                (addable ? '' : ' disabled') + '><option value="">' + (addable ? '-- Select an EPG / VLAN to add --' : 'No other VLANs allowed on this port') +
                '</option>' + addable + '</select></div>' +
                '<div class="col-md-4"><select class="form-select form-select-sm sc-add-mode" data-iface="' + c.interface_id + '">' +
                '<option value="regular">Regular (tagged)</option><option value="native">Native</option><option value="untagged">Untagged</option></select></div></div>' +
                '<div class="sc-added mt-2" data-iface="' + c.interface_id + '"></div></div>';
        }).join('');
    }

    modifyEditor.addEventListener('change', function(event) {
        const t = event.target;
        if (t.classList.contains('sc-add-epg') && t.value) {
            const epg = JSON.parse(t.value);
            const mode = modifyEditor.querySelector('.sc-add-mode[data-iface="' + t.dataset.iface + '"]').value;
            const list = modifyEditor.querySelector('.sc-added[data-iface="' + t.dataset.iface + '"]');
            if (!list.querySelector('[data-key="' + CSS.escape(bindingKey(epg)) + '"]')) {
                const chip = document.createElement('span');
                chip.className = 'sc-chip sc-chip-add';
                chip.dataset.key = bindingKey(epg);
                chip.dataset.value = JSON.stringify(Object.assign({}, epg, { mode: mode }));
                chip.innerHTML = '<i class="bi bi-plus-circle me-1"></i>' + vlanLabel(epg, mode) +
                    ' <button type="button" class="btn-close btn-close-sm ms-1 sc-undo" aria-label="Remove"></button>';
                list.appendChild(chip);
            }
            t.value = '';
        }
        validate();
    });

    modifyEditor.addEventListener('click', function(event) {
        if (event.target.classList.contains('sc-undo')) {
            event.target.closest('.sc-chip').remove();
            validate();
        }
    });

    function collectModifyEdits() {
        return cabled(profile).map(c => ({
            interface: c.interface,
            port: { node_id: c.node_id, module: c.module, port: c.port },
            remove: Array.from(modifyEditor.querySelectorAll('.sc-remove[data-iface="' + c.interface_id + '"]:checked')).map(i => JSON.parse(i.value)),
            add: Array.from(modifyEditor.querySelectorAll('.sc-added[data-iface="' + c.interface_id + '"] .sc-chip')).map(ch => JSON.parse(ch.dataset.value))
        })).filter(e => e.add.length || e.remove.length);
    }

    // ---- Copy --------------------------------------------------------------

    function buildCopy() {
        if (!cabled(profile).some(c => (c.bindings || []).length)) {
            copyMappings.innerHTML = '<div class="alert alert-warning mb-0">This server has no VLANs to copy.</div>';
            return;
        }
        targetSelect.disabled = false;
        renderTargets();
    }

    // Only servers with nothing configured can receive a copy, so a copy never mixes with existing VLANs
    function renderTargets() {
        if (action !== 'copy' || targetSelect.disabled) return;
        const server = selectedServer();
        const selected = targetSelect.value;
        const pool = copyTargets ? servers.filter(s => copyTargets.has(s.id)) : [];
        targetSelect.innerHTML = serverOptions(pool, targetSearch.value.trim().toLowerCase(), server && server.id);
        if (Array.from(targetSelect.options).some(o => o.value === selected)) targetSelect.value = selected;
        targetHelp.textContent = copyTargets === null ? 'Finding servers with no configuration...'
            : targetSelect.options.length + ' of ' + pool.length + ' unconfigured servers shown \u2014 only servers with ' +
              'no VLANs on their cabled ports can receive a copy';
    }

    targetSearch.addEventListener('input', renderTargets);

    targetSelect.addEventListener('change', async function() {
        copyMappings.innerHTML = '<div class="text-muted small"><span class="spinner-border spinner-border-sm me-1"></span>Loading target profile...</div>';
        submitBtn.disabled = true;
        targetProfile = await fetchProfile(this.value);
        const sources = cabled(profile).filter(c => (c.bindings || []).length);
        const destinations = cabled(targetProfile);
        if (destinations.length === 0) {
            copyMappings.innerHTML = '<div class="alert alert-warning mb-0">The target server has no interfaces cabled to a leaf in NetBox.</div>';
            return;
        }
        // Default mapping pairs interfaces with the same name (eth0 -> eth0)
        copyMappings.innerHTML = '<p class="fw-bold mb-2"><i class="bi bi-diagram-2 text-primary me-2"></i>Map each source interface to a target interface</p>' +
            sources.map(function(s) {
                const options = destinations.map(d => '<option value="' + d.interface_id + '"' + (d.interface === s.interface ? ' selected' : '') + '>' +
                    escapeHtml(d.interface) + ' → ' + escapeHtml(d.leaf) + ' ' + escapeHtml(d.leaf_interface) + '</option>').join('');
                return '<div class="sc-port border rounded p-3 mb-2" data-source="' + s.interface_id + '">' +
                    '<div class="small mb-2"><strong>' + escapeHtml(s.interface) + '</strong> — ' + vlanBadges(s.bindings) + '</div>' +
                    '<select class="form-select form-select-sm sc-copy-target"><option value="">-- Don’t copy this interface --</option>' + options + '</select></div>';
            }).join('');
        validate();
    });

    copyMappings.addEventListener('change', validate);

    function collectCopyMappings() {
        return Array.from(copyMappings.querySelectorAll('[data-source]')).map(function(row) {
            const s = profile.find(c => String(c.interface_id) === row.dataset.source);
            const d = targetProfile.find(c => String(c.interface_id) === row.querySelector('.sc-copy-target').value);
            return d ? { source_interface: s.interface, source_port: { node_id: s.node_id, module: s.module, port: s.port },
                         target_interface: d.interface, target_port: { node_id: d.node_id, module: d.module, port: d.port } } : null;
        }).filter(Boolean);
    }

    // ---- Move --------------------------------------------------------------

    async function buildMove() {
        if (!cabled(profile).some(c => (c.bindings || []).length)) {
            moveMappings.innerHTML = '<div class="alert alert-warning mb-0">No VLANs are configured on this server’s ports, so there is nothing to move.</div>';
            return;
        }
        const result = await fetch('/api/v1/nac/move-targets').then(r => r.json());
        targets = result.status === 'success' ? result.data : [];
        const server = selectedServer();
        moveRack.innerHTML = '<option value="">-- Select the destination rack --</option>' + racks.map(r =>
            '<option value="' + r.id + '">' + escapeHtml(r.row || 'No row') + ' — Rack ' + escapeHtml(r.name) +
            (r.name === server.rack ? ' (current)' : '') + '</option>').join('');
        moveRack.disabled = false;
    }

    function leafOptions(row) {
        // Physical location ranks leafs rather than filtering them out
        const group = (label, list) => list.length ? '<optgroup label="' + escapeAttr(label) + '">' + list.map(t =>
            '<option value="' + t.node_id + '"' + (t.free_ports.length ? '' : ' disabled') + '>' + escapeHtml(t.name) +
            ' (Node ' + t.node_id + ', Rack ' + escapeHtml(t.rack || '?') + ') — ' + t.free_ports.length + ' free</option>').join('') + '</optgroup>' : '';
        return '<option value="">-- Select a leaf --</option>' + group('In ' + (row || 'this row'), targets.filter(t => t.row === row)) +
            group('Other rows', targets.filter(t => t.row !== row));
    }

    moveRack.addEventListener('change', function() {
        const rack = racks.find(r => String(r.id) === moveRack.value);
        moveMappings.innerHTML = rack ? '<p class="fw-bold mb-2"><i class="bi bi-plug text-primary me-2"></i>New leaf port for each interface <span class="text-danger">*</span></p>' +
            cabled(profile).map(c => '<div class="sc-port border rounded p-3 mb-2" data-iface="' + c.interface_id + '">' +
                '<div class="small mb-2"><strong>' + escapeHtml(c.interface) + '</strong> — now on ' + escapeHtml(c.leaf) + ' ' +
                escapeHtml(c.leaf_interface) + ' — ' + ((c.bindings || []).length ? vlanBadges(c.bindings) :
                '<span class="text-muted">no VLANs (re-cabled in NetBox only)</span>') + '</div>' +
                '<div class="row g-2"><div class="col-md-7"><select class="form-select form-select-sm sc-move-leaf">' + leafOptions(rack.row) +
                '</select></div><div class="col-md-5"><select class="form-select form-select-sm sc-move-port" disabled>' +
                '<option value="">-- Select a leaf first --</option></select></div></div></div>').join('') : '';
        validate();
    });

    moveMappings.addEventListener('change', function(event) {
        if (event.target.classList.contains('sc-move-leaf')) {
            const portSelect = event.target.closest('.sc-port').querySelector('.sc-move-port');
            const target = targets.find(t => String(t.node_id) === event.target.value);
            portSelect.innerHTML = '<option value="">-- Select the port it is plugged into --</option>' +
                (target ? target.free_ports : []).map(p => '<option value="' + p.interface_id + '" data-module="' + p.module +
                    '" data-port="' + p.port + '">' + escapeHtml(p.name) + ' (free)</option>').join('');
            portSelect.disabled = !target;
        }
        validate();
    });

    function collectMoves() {
        return Array.from(moveMappings.querySelectorAll('.sc-port')).map(function(row) {
            const c = profile.find(x => String(x.interface_id) === row.dataset.iface);
            const leaf = row.querySelector('.sc-move-leaf').value;
            const opt = row.querySelector('.sc-move-port').selectedOptions[0];
            if (!leaf || !opt || !opt.value) return null;
            return { server_interface_id: c.interface_id, interface: c.interface, has_bindings: (c.bindings || []).length > 0,
                     source: { node_id: c.node_id, module: c.module, port: c.port },
                     destination: { node_id: parseInt(leaf), module: parseInt(opt.dataset.module), port: parseInt(opt.dataset.port),
                                    interface_id: parseInt(opt.value) } };
        });
    }

    // ---- Validation and submit ---------------------------------------------

    function validate() {
        let ok = false;
        if (action === 'modify') ok = collectModifyEdits().length > 0;
        if (action === 'copy') ok = collectCopyMappings().length > 0;
        if (action === 'move') {
            const moves = collectMoves();
            moveMappings.querySelectorAll('.sc-move-port').forEach(s => s.classList.remove('is-invalid'));
            ok = moves.length > 0 && moves.every(Boolean);
            const seen = new Set();
            moves.forEach(function(m, i) {
                if (!m) return;
                if (seen.has(m.destination.interface_id)) {
                    moveMappings.querySelectorAll('.sc-move-port')[i].classList.add('is-invalid');
                    ok = false;
                }
                seen.add(m.destination.interface_id);
            });
        }
        submitBtn.disabled = !ok;
    }

    function requestFor(server) {
        if (action === 'modify') {
            return ['/api/v1/nac/server-modify', { server: { id: server.id, name: server.name, location: location(server) },
                                                   edits: collectModifyEdits() }];
        }
        if (action === 'copy') {
            const target = servers.find(s => String(s.id) === targetSelect.value);
            return ['/api/v1/nac/server-copy', {
                source: { id: server.id, name: server.name, location: location(server) },
                target: { id: target.id, name: target.name, location: location(target) },
                mappings: collectCopyMappings() }];
        }
        const rack = racks.find(r => String(r.id) === moveRack.value);
        return ['/api/v1/nac/move-server', {
            server: { id: server.id, name: server.name, rack_id: rack.id, old_rack: location(server),
                      new_rack: (rack.row || 'No row') + ', Rack ' + rack.name },
            moves: collectMoves(), remove_source: moveRemoveSource.checked }];
    }

    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        const server = selectedServer();
        if (!server || submitBtn.disabled) return;
        const [url, payload] = requestFor(server);

        const originalText = submitLabel.textContent;
        submitBtn.disabled = true;
        submitLabel.textContent = 'Submitting...';
        responseDiv.style.display = 'none';
        try {
            const result = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify(payload) }).then(r => r.json());
            if (result.status === 'success') {
                responseDiv.className = 'alert alert-success';
                responseDiv.innerHTML = '<strong><i class="bi bi-check-circle me-1"></i>Success!</strong> ' + escapeHtml(result.message) + '. ' +
                    pullRequestSentence(result.pull_request_url) +
                    (action === 'move' ? (result.netbox_updated
                        ? '<div class="mt-2 small"><i class="bi bi-diagram-3 me-1"></i>NetBox updated with the new rack and cabling.</div>'
                        : '<div class="change-request-notice change-request-failed mt-2 small"><strong>NetBox was not updated:</strong> ' + escapeHtml(result.netbox_error) + '</div>')
                        : ' Changes show here once the pull request is merged.') +
                    changeRequestNotice(result.change_request);
                if (action === 'move') { await loadReferenceData(); profileDiv.style.display = 'none'; resetSteps(); loadConfigStatus(); }
                else { loadConfigStatus(); onServerChosen(); }
            } else {
                responseDiv.className = 'alert alert-danger';
                responseDiv.innerHTML = '<strong><i class="bi bi-exclamation-triangle me-1"></i>' + escapeHtml(result.message) + '</strong>' +
                    (result.errors ? '<ul class="mb-0 mt-2">' + result.errors.map(e => '<li>' + escapeHtml(e) + '</li>').join('') + '</ul>' : '');
                submitBtn.disabled = false;
            }
        } catch (error) {
            responseDiv.className = 'alert alert-danger';
            responseDiv.innerHTML = '<strong><i class="bi bi-exclamation-triangle me-1"></i>Error:</strong> ' + escapeHtml(error.message);
            submitBtn.disabled = false;
        }
        submitLabel.textContent = originalText;
        responseDiv.style.display = 'block';
        responseDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    resetBtn.addEventListener('click', function() {
        form.reset();
        serverSelect.value = '';
        profile = []; targetProfile = [];
        profileDiv.style.display = 'none';
        responseDiv.style.display = 'none';
        resetSteps();
        renderServers();
        chooseAction(null);
        page.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    loadReferenceData();
}

document.addEventListener('DOMContentLoaded', initializeServerConnections);
