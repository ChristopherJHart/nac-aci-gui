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
                        '<span><i class="bi bi-check-circle-fill text-success me-2"></i>' + epg.display + '</span>' +
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
                    option.textContent = epg.display;
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
 * Initialize the Trunk VLANs to Server form
 *
 * The user finds a server from NetBox DCIM (filtered by row, rack and name),
 * picks one of its interfaces, and the leaf switch and port are resolved from
 * the NetBox cable on that interface. From there it reuses the same EPG
 * availability and static port endpoints as the Add VLAN to Trunk Port form.
 */
function initializeServerTrunkForm() {
    const form = document.getElementById('serverTrunkForm');
    if (!form) return;

    const rowSelect = document.getElementById('serverTrunkRow');
    const rackSelect = document.getElementById('serverTrunkRack');
    const searchInput = document.getElementById('serverTrunkSearch');
    const serverSelect = document.getElementById('serverTrunkServer');
    const serverHelp = document.getElementById('serverTrunkServerHelp');
    const interfaceSelect = document.getElementById('serverTrunkInterface');
    const connectionDiv = document.getElementById('serverTrunkConnection');
    const existingDiv = document.getElementById('serverTrunkExisting');
    const epgSelect = document.getElementById('serverTrunkEpg');
    const modeSelect = document.getElementById('serverTrunkMode');
    const submitBtn = document.getElementById('submitServerTrunkBtn');
    const resetBtn = document.getElementById('resetServerTrunkBtn');
    const responseDiv = document.getElementById('serverTrunkResponse');

    let servers = [];
    let connections = [];

    function escapeHtml(value) {
        const div = document.createElement('div');
        div.textContent = value == null ? '' : String(value);
        return div.innerHTML;
    }

    function resetDownstream(from) {
        if (from <= 1) {
            interfaceSelect.innerHTML = '<option value="">-- Select a Server first --</option>';
            interfaceSelect.disabled = true;
            connections = [];
        }
        if (from <= 2) {
            connectionDiv.style.display = 'none';
            connectionDiv.innerHTML = '';
            existingDiv.style.display = 'none';
            existingDiv.innerHTML = '';
            epgSelect.innerHTML = '<option value="">-- Select a Server Interface first --</option>';
            epgSelect.disabled = true;
        }
        if (from <= 3) {
            modeSelect.disabled = true;
            submitBtn.disabled = true;
        }
    }

    function fillSelect(select, placeholder, values) {
        const current = select.value;
        select.innerHTML = '<option value="">' + placeholder + '</option>';
        values.forEach(function(value) {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            select.appendChild(option);
        });
        if (values.includes(current)) select.value = current;
    }

    function uniqueSorted(values) {
        return Array.from(new Set(values.filter(Boolean))).sort();
    }

    function renderServers() {
        const row = rowSelect.value;
        const rack = rackSelect.value;
        const query = searchInput.value.trim().toLowerCase();
        const selected = serverSelect.value;

        const racksInRow = uniqueSorted(servers.filter(s => !row || s.row === row).map(s => s.rack));
        fillSelect(rackSelect, 'All racks', racksInRow);

        const matches = servers.filter(function(s) {
            if (row && s.row !== row) return false;
            if (rackSelect.value && s.rack !== rackSelect.value) return false;
            if (!query) return true;
            return (s.name + ' ' + (s.description || '')).toLowerCase().includes(query);
        });

        serverSelect.innerHTML = '';
        matches.forEach(function(s) {
            const option = document.createElement('option');
            option.value = s.id;
            option.textContent = s.name + ' — ' + (s.description || 'Server') +
                ' (' + (s.row || 'No row') + ', Rack ' + (s.rack || '?') + ')';
            serverSelect.appendChild(option);
        });
        if (matches.some(s => String(s.id) === selected)) {
            serverSelect.value = selected;
        }
        serverHelp.textContent = matches.length + ' of ' + servers.length + ' servers shown';
    }

    async function loadServers() {
        try {
            const response = await fetch('/api/v1/netbox/servers');
            const result = await response.json();
            if (result.status !== 'success') {
                serverHelp.textContent = 'Failed to load servers from NetBox: ' + (result.message || 'unknown error');
                return;
            }
            servers = result.data || [];
            fillSelect(rowSelect, 'All rows', uniqueSorted(servers.map(s => s.row)));
            renderServers();
        } catch (error) {
            console.error('Error loading servers:', error);
            serverHelp.textContent = 'Failed to load servers from NetBox';
        }
    }

    loadServers();

    rowSelect.addEventListener('change', function() {
        rackSelect.value = '';
        renderServers();
    });
    rackSelect.addEventListener('change', renderServers);
    searchInput.addEventListener('input', renderServers);

    serverSelect.addEventListener('change', async function() {
        resetDownstream(1);
        const serverId = this.value;
        if (!serverId) return;

        interfaceSelect.innerHTML = '<option value="">-- Loading... --</option>';
        try {
            const response = await fetch('/api/v1/netbox/servers/' + serverId + '/connections');
            const result = await response.json();
            connections = result.status === 'success' ? (result.data || []) : [];

            interfaceSelect.innerHTML = '<option value="">-- Select an Interface --</option>';
            if (connections.length === 0) {
                interfaceSelect.innerHTML = '<option value="">-- No interfaces found --</option>';
                return;
            }
            connections.forEach(function(conn, index) {
                const option = document.createElement('option');
                option.value = index;
                if (conn.leaf) {
                    option.textContent = conn.interface + ' → ' + conn.leaf + ' ' + conn.leaf_interface;
                } else {
                    option.textContent = conn.interface + ' (not cabled)';
                    option.disabled = true;
                }
                interfaceSelect.appendChild(option);
            });
            interfaceSelect.disabled = false;

            // Preselect when there is exactly one usable interface
            const usable = connections.filter(c => c.leaf);
            if (usable.length === 1) {
                interfaceSelect.value = connections.indexOf(usable[0]);
                interfaceSelect.dispatchEvent(new Event('change'));
            }
        } catch (error) {
            console.error('Error loading server connections:', error);
            interfaceSelect.innerHTML = '<option value="">-- Error loading interfaces --</option>';
        }
    });

    interfaceSelect.addEventListener('change', async function() {
        resetDownstream(2);
        const conn = connections[this.value];
        if (!conn) return;

        if (!conn.node_id || conn.module == null || conn.port == null) {
            connectionDiv.innerHTML = '<div class="alert alert-warning mb-0"><i class="bi bi-exclamation-triangle me-1"></i>' +
                escapeHtml(conn.leaf) + ' ' + escapeHtml(conn.leaf_interface) +
                ' cannot be mapped to an ACI port. Check that the leaf has an ACI Node ID in NetBox.</div>';
            connectionDiv.style.display = 'block';
            return;
        }

        const portLabel = conn.module + '/' + conn.port;
        connectionDiv.innerHTML = '<div class="resolved-connection rounded p-3">' +
            '<div class="resolved-connection-label small mb-1"><i class="bi bi-diagram-2 me-1"></i>Resolved from NetBox cabling</div>' +
            '<div><strong>Leaf:</strong> ' + escapeHtml(conn.leaf) + ' (Node ' + conn.node_id + ')' +
            ' &nbsp; <strong>Port:</strong> ' + portLabel + '</div></div>';
        connectionDiv.style.display = 'block';

        epgSelect.innerHTML = '<option value="">-- Loading... --</option>';
        try {
            const response = await fetch(
                '/api/v1/nac/port-available-epgs?node_id=' + conn.node_id + '&module=' + conn.module + '&port=' + conn.port
            );
            const result = await response.json();

            if (result.existing && result.existing.length > 0) {
                const items = result.existing.map(function(epg) {
                    const badge = epg.mode === 'native' ? 'bg-warning text-dark' :
                                  epg.mode === 'untagged' ? 'bg-secondary' : 'bg-primary';
                    return '<li class="list-group-item d-flex justify-content-between align-items-center py-2">' +
                        '<span><i class="bi bi-check-circle-fill text-success me-2"></i>' + escapeHtml(epg.display) + '</span>' +
                        '<span class="badge ' + badge + '">' + escapeHtml(epg.mode || 'regular') + '</span></li>';
                }).join('');
                existingDiv.innerHTML = '<div class="mb-4"><small class="form-text fw-bold text-muted d-block mb-2">' +
                    '<i class="bi bi-info-circle me-1"></i>Currently trunked to this server on port ' + portLabel + ':</small>' +
                    '<ul class="list-group list-group-flush">' + items + '</ul></div>';
                existingDiv.style.display = 'block';
            }

            epgSelect.innerHTML = '<option value="">-- Select an EPG --</option>';
            if (result.status === 'success' && result.data && result.data.length > 0) {
                result.data.forEach(function(epg) {
                    const option = document.createElement('option');
                    option.value = JSON.stringify({
                        tenant: epg.tenant,
                        application_profile: epg.application_profile,
                        endpoint_group: epg.endpoint_group,
                        vlan: epg.vlan
                    });
                    option.textContent = epg.display;
                    epgSelect.appendChild(option);
                });
                epgSelect.disabled = false;
            } else if (result.status === 'success') {
                epgSelect.innerHTML = '<option value="">-- No available EPGs for this port --</option>';
            } else {
                epgSelect.innerHTML = '<option value="">-- ' + escapeHtml(result.message || 'Error loading EPGs') + ' --</option>';
            }
        } catch (error) {
            console.error('Error loading EPGs:', error);
            epgSelect.innerHTML = '<option value="">-- Error loading EPGs --</option>';
        }
    });

    epgSelect.addEventListener('change', function() {
        modeSelect.disabled = !this.value;
        submitBtn.disabled = !this.value;
        if (this.value) modeSelect.value = 'regular';
    });

    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        const conn = connections[interfaceSelect.value];
        const server = servers.find(s => String(s.id) === serverSelect.value);
        if (!epgSelect.value || !conn || !server) return;

        const epgData = JSON.parse(epgSelect.value);
        const payload = {
            tenant: epgData.tenant,
            application_profile: epgData.application_profile,
            endpoint_group: epgData.endpoint_group,
            node_id: conn.node_id,
            module: conn.module,
            port: conn.port,
            vlan: epgData.vlan,
            mode: modeSelect.value,
            server: {
                name: server.name,
                interface: conn.interface,
                row: server.row,
                rack: server.rack
            }
        };

        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Submitting...';
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
                responseDiv.innerHTML = '<strong><i class="bi bi-check-circle me-1"></i>Success!</strong> VLAN ' +
                    escapeHtml(epgData.vlan) + ' (' + escapeHtml(epgData.endpoint_group) + ') requested for ' +
                    escapeHtml(server.name) + ' ' + escapeHtml(conn.interface) + ' on ' + escapeHtml(conn.leaf) + ' ' +
                    conn.module + '/' + conn.port + '. ' + pullRequestSentence(result.pull_request_url) +
                    ' The VLAN shows as trunked here once it is merged.' +
                    changeRequestNotice(result.change_request);
                resetDownstream(2);
                interfaceSelect.dispatchEvent(new Event('change'));
            } else {
                responseDiv.className = 'alert alert-danger';
                responseDiv.innerHTML = '<strong><i class="bi bi-exclamation-triangle me-1"></i>Error:</strong> ' + escapeHtml(result.message);
                submitBtn.disabled = false;
            }
        } catch (error) {
            responseDiv.className = 'alert alert-danger';
            responseDiv.innerHTML = '<strong><i class="bi bi-exclamation-triangle me-1"></i>Error:</strong> ' + escapeHtml(error.message);
            submitBtn.disabled = false;
        }

        responseDiv.style.display = 'block';
        submitBtn.innerHTML = originalText;
        responseDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    resetBtn.addEventListener('click', function() {
        form.reset();
        resetDownstream(1);
        responseDiv.style.display = 'none';
        renderServers();
    });
}

document.addEventListener('DOMContentLoaded', initializeServerTrunkForm);


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
 * Initialize the Move Server form
 *
 * The user picks a server and its new rack, then, for each interface that carries
 * VLANs, the free leaf port it was plugged into. Free ports come from NetBox (the
 * cabling source of truth) and are limited to ports defined in the data model.
 * Submitting opens one pull request that moves (or copies) every binding, records
 * the new rack and cabling in NetBox, and emails a change request.
 */
function initializeMoveServerForm() {
    const form = document.getElementById('moveServerForm');
    if (!form) return;

    const searchInput = document.getElementById('moveServerSearch');
    const serverSelect = document.getElementById('moveServerServer');
    const serverHelp = document.getElementById('moveServerServerHelp');
    const profileDiv = document.getElementById('moveServerProfile');
    const rackSelect = document.getElementById('moveServerRack');
    const mappingsDiv = document.getElementById('moveServerMappings');
    const removeSource = document.getElementById('moveServerRemoveSource');
    const submitBtn = document.getElementById('submitMoveServerBtn');
    const resetBtn = document.getElementById('resetMoveServerBtn');
    const responseDiv = document.getElementById('moveServerResponse');

    let servers = [];
    let racks = [];
    let targets = [];
    let profile = [];

    function escapeHtml(value) {
        const div = document.createElement('div');
        div.textContent = value == null ? '' : String(value);
        return div.innerHTML;
    }

    // Every cabled interface moves with the server; only those with VLANs change the data model
    function movable() {
        return profile.filter(c => c.leaf);
    }

    function hasVlans() {
        return profile.some(c => c.leaf && c.bindings && c.bindings.length > 0);
    }

    function renderServers() {
        const query = searchInput.value.trim().toLowerCase();
        const selected = serverSelect.value;
        const matches = servers.filter(s => !query ||
            [s.name, s.description, s.row, s.rack].join(' ').toLowerCase().includes(query));
        serverSelect.innerHTML = '';
        matches.forEach(function(s) {
            const option = document.createElement('option');
            option.value = s.id;
            option.textContent = s.name + ' — ' + (s.description || 'Server') +
                ' (' + (s.row || 'No row') + ', Rack ' + (s.rack || '?') + ')';
            serverSelect.appendChild(option);
        });
        if (matches.some(s => String(s.id) === selected)) serverSelect.value = selected;
        serverHelp.textContent = matches.length + ' of ' + servers.length + ' servers shown';
    }

    async function loadReferenceData() {
        try {
            const [serversRes, racksRes] = await Promise.all([
                fetch('/api/v1/netbox/servers').then(r => r.json()),
                fetch('/api/v1/netbox/racks').then(r => r.json())
            ]);
            servers = serversRes.status === 'success' ? serversRes.data : [];
            racks = racksRes.status === 'success' ? racksRes.data : [];
            renderServers();
        } catch (error) {
            console.error('Error loading servers/racks:', error);
            serverHelp.textContent = 'Failed to load servers from NetBox';
        }
    }

    function resetDestination() {
        rackSelect.innerHTML = '<option value="">-- Select a Server first --</option>';
        rackSelect.disabled = true;
        mappingsDiv.innerHTML = '';
        submitBtn.disabled = true;
    }

    function renderProfile(server) {
        if (profile.length === 0) {
            profileDiv.innerHTML = '<div class="alert alert-warning mb-0">This server has no interfaces in NetBox.</div>';
            profileDiv.style.display = 'block';
            return;
        }
        const rows = profile.map(function(c) {
            const where = c.leaf ? escapeHtml(c.leaf) + ' ' + escapeHtml(c.leaf_interface) +
                ' <span class="text-muted">(Node ' + escapeHtml(c.node_id) + ')</span>' : '<em>not cabled</em>';
            const vlans = (c.bindings || []).length
                ? c.bindings.map(b => '<span class="badge bg-primary me-1">VLAN ' + escapeHtml(b.vlan) + ' · ' +
                      escapeHtml(b.endpoint_group) + (b.mode !== 'regular' ? ' · ' + escapeHtml(b.mode) : '') + '</span>').join('')
                : '<span class="text-muted">no VLANs</span>';
            return '<tr><td class="fw-semibold">' + escapeHtml(c.interface) + '</td><td>' + where + '</td><td>' + vlans + '</td></tr>';
        }).join('');
        profileDiv.innerHTML = '<div class="small fw-bold mb-2 move-profile-label"><i class="bi bi-person-badge me-1"></i>Current profile of ' +
            escapeHtml(server.name) + ' (' + escapeHtml(server.row || 'No row') + ', Rack ' + escapeHtml(server.rack || '?') + ')</div>' +
            '<div class="table-responsive"><table class="table table-sm align-middle mb-0">' +
            '<thead><tr><th>Interface</th><th>Leaf port</th><th>VLANs</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
            (!hasVlans() ? '<div class="alert alert-warning mt-2 mb-0">No VLANs are configured on this server’s ports, so there is nothing to move.</div>' : '');
        profileDiv.style.display = 'block';
    }

    serverSelect.addEventListener('change', async function() {
        resetDestination();
        responseDiv.style.display = 'none';
        const server = servers.find(s => String(s.id) === this.value);
        if (!server) return;

        profileDiv.innerHTML = '<div class="text-muted small"><span class="spinner-border spinner-border-sm me-1"></span>Loading profile...</div>';
        profileDiv.style.display = 'block';
        try {
            const [profileRes, targetsRes] = await Promise.all([
                fetch('/api/v1/nac/server-profile/' + server.id).then(r => r.json()),
                fetch('/api/v1/nac/move-targets').then(r => r.json())
            ]);
            profile = profileRes.status === 'success' ? profileRes.data : [];
            targets = targetsRes.status === 'success' ? targetsRes.data : [];
            renderProfile(server);
            if (!hasVlans()) return;

            rackSelect.innerHTML = '<option value="">-- Select the destination rack --</option>';
            racks.forEach(function(r) {
                const option = document.createElement('option');
                option.value = r.id;
                option.textContent = (r.row || 'No row') + ' — Rack ' + r.name + (r.name === server.rack ? ' (current)' : '');
                rackSelect.appendChild(option);
            });
            rackSelect.disabled = false;
        } catch (error) {
            console.error('Error loading server profile:', error);
            profileDiv.innerHTML = '<div class="alert alert-danger mb-0">Failed to load the server profile.</div>';
        }
    });

    function leafOptions(row) {
        // Leafs in the destination row first: physical location ranks leafs, it doesn't filter them
        const near = targets.filter(t => t.row === row);
        const far = targets.filter(t => t.row !== row);
        const group = function(label, list) {
            if (list.length === 0) return '';
            return '<optgroup label="' + escapeHtml(label) + '">' + list.map(function(t) {
                const free = t.free_ports.length;
                return '<option value="' + t.node_id + '"' + (free === 0 ? ' disabled' : '') + '>' + escapeHtml(t.name) +
                    ' (Node ' + t.node_id + ', Rack ' + escapeHtml(t.rack || '?') + ') — ' + free + ' free</option>';
            }).join('') + '</optgroup>';
        };
        return '<option value="">-- Select a leaf --</option>' + group('In ' + (row || 'this row'), near) + group('Other rows', far);
    }

    function renderMappings() {
        const rack = racks.find(r => String(r.id) === rackSelect.value);
        mappingsDiv.innerHTML = '';
        if (!rack) { validate(); return; }

        const intro = document.createElement('p');
        intro.className = 'fw-bold mb-2';
        intro.innerHTML = '<i class="bi bi-plug text-primary me-2"></i>New leaf port for each interface <span class="text-danger">*</span>';
        mappingsDiv.appendChild(intro);

        movable().forEach(function(conn, index) {
            const row = document.createElement('div');
            row.className = 'move-mapping border rounded p-3 mb-2';
            row.dataset.index = index;
            row.innerHTML =
                '<div class="small mb-2"><strong>' + escapeHtml(conn.interface) + '</strong> — now on ' +
                escapeHtml(conn.leaf) + ' ' + escapeHtml(conn.leaf_interface) + ' — ' +
                (conn.bindings.length ? conn.bindings.map(b => 'VLAN ' + escapeHtml(b.vlan)).join(', ')
                                      : '<span class="text-muted">no VLANs (re-cabled in NetBox only)</span>') + '</div>' +
                '<div class="row g-2"><div class="col-md-7"><select class="form-select form-select-sm move-leaf">' +
                leafOptions(rack.row) + '</select></div>' +
                '<div class="col-md-5"><select class="form-select form-select-sm move-port" disabled>' +
                '<option value="">-- Select a leaf first --</option></select></div></div>';
            mappingsDiv.appendChild(row);
        });
        validate();
    }

    rackSelect.addEventListener('change', renderMappings);

    mappingsDiv.addEventListener('change', function(event) {
        const row = event.target.closest('.move-mapping');
        if (!row) return;
        if (event.target.classList.contains('move-leaf')) {
            const portSelect = row.querySelector('.move-port');
            const target = targets.find(t => String(t.node_id) === event.target.value);
            portSelect.innerHTML = '<option value="">-- Select the port it is plugged into --</option>';
            (target ? target.free_ports : []).forEach(function(p) {
                const option = document.createElement('option');
                option.value = p.interface_id;
                option.dataset.module = p.module;
                option.dataset.port = p.port;
                option.textContent = p.name + ' (free)';
                portSelect.appendChild(option);
            });
            portSelect.disabled = !target;
        }
        validate();
    });

    function collectMoves() {
        return Array.from(mappingsDiv.querySelectorAll('.move-mapping')).map(function(row) {
            const conn = movable()[row.dataset.index];
            const leafSelect = row.querySelector('.move-leaf');
            const portOption = row.querySelector('.move-port').selectedOptions[0];
            if (!leafSelect.value || !portOption || !portOption.value) return null;
            return {
                server_interface_id: conn.interface_id,
                interface: conn.interface,
                has_bindings: conn.bindings.length > 0,
                source: { node_id: conn.node_id, module: conn.module, port: conn.port },
                destination: {
                    node_id: parseInt(leafSelect.value),
                    module: parseInt(portOption.dataset.module),
                    port: parseInt(portOption.dataset.port),
                    interface_id: parseInt(portOption.value)
                }
            };
        });
    }

    function validate() {
        const moves = collectMoves();
        mappingsDiv.querySelectorAll('.move-port').forEach(s => s.classList.remove('is-invalid'));
        let ok = moves.length > 0 && moves.every(Boolean);
        // The same free port can't take two interfaces
        const seen = {};
        mappingsDiv.querySelectorAll('.move-mapping').forEach(function(row, i) {
            const m = moves[i];
            if (!m) return;
            const key = m.destination.interface_id;
            if (seen[key] !== undefined) {
                row.querySelector('.move-port').classList.add('is-invalid');
                ok = false;
            }
            seen[key] = i;
        });
        submitBtn.disabled = !ok;
    }

    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        const server = servers.find(s => String(s.id) === serverSelect.value);
        const rack = racks.find(r => String(r.id) === rackSelect.value);
        const moves = collectMoves();
        if (!server || !rack || !moves.every(Boolean)) return;

        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Submitting...';
        submitBtn.disabled = true;
        responseDiv.style.display = 'none';

        try {
            const response = await fetch('/api/v1/nac/move-server', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    server: {
                        id: server.id, name: server.name, rack_id: rack.id,
                        old_rack: (server.row || 'No row') + ', Rack ' + (server.rack || '?'),
                        new_rack: (rack.row || 'No row') + ', Rack ' + rack.name
                    },
                    moves: moves,
                    remove_source: removeSource.checked
                })
            });
            const result = await response.json();

            if (result.status === 'success') {
                const verb = removeSource.checked ? 'Move' : 'Copy';
                responseDiv.className = 'alert alert-success';
                responseDiv.innerHTML = '<strong><i class="bi bi-check-circle me-1"></i>Success!</strong> ' + verb + ' of ' +
                    escapeHtml(server.name) + ' to ' + escapeHtml(rack.row) + ', Rack ' + escapeHtml(rack.name) + ' requested. ' +
                    pullRequestSentence(result.pull_request_url) +
                    (result.netbox_updated
                        ? '<div class="mt-2 small"><i class="bi bi-diagram-3 me-1"></i>NetBox updated with the new rack and cabling.</div>'
                        : '<div class="change-request-notice change-request-failed mt-2 small"><strong>NetBox was not updated:</strong> ' +
                          escapeHtml(result.netbox_error) + '</div>') +
                    changeRequestNotice(result.change_request);
                servers = [];
                await loadReferenceData();
                profileDiv.style.display = 'none';
                resetDestination();
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

        responseDiv.style.display = 'block';
        submitBtn.innerHTML = originalText;
        responseDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    searchInput.addEventListener('input', renderServers);

    resetBtn.addEventListener('click', function() {
        form.reset();
        profile = [];
        profileDiv.style.display = 'none';
        responseDiv.style.display = 'none';
        resetDestination();
        renderServers();
    });

    loadReferenceData();
}

document.addEventListener('DOMContentLoaded', initializeMoveServerForm);
