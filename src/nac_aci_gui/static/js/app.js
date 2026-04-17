// Main application JavaScript
// Common functionality shared across NaC and ACI

// Store table instances (shared across modules)
const tableInstances = {};

/**
 * Theme Management Functions
 */

// Get the current theme preference from localStorage (light, dark, auto)
function getThemePreference() {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'auto'; // Default to auto mode
}

// Get the actual theme to apply based on preference
function getActualTheme(preference) {
    if (preference === 'auto') {
        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }
    return preference;
}

// Apply the theme to the page
function applyTheme(actualTheme) {
    const html = document.documentElement;

    if (actualTheme === 'dark') {
        html.setAttribute('data-theme', 'dark');
    } else {
        html.removeAttribute('data-theme');
    }
}

// Update the theme icon based on preference
function updateThemeIcon(preference) {
    const themeIcon = document.getElementById('themeIcon');
    if (!themeIcon) return;

    // Remove all possible icon classes
    themeIcon.classList.remove('bi-sun-fill', 'bi-moon-stars-fill', 'bi-circle-half');

    if (preference === 'light') {
        themeIcon.classList.add('bi-sun-fill');
        themeIcon.parentElement.setAttribute('title', 'Theme: Light (click for Dark)');
    } else if (preference === 'dark') {
        themeIcon.classList.add('bi-moon-stars-fill');
        themeIcon.parentElement.setAttribute('title', 'Theme: Dark (click for Auto)');
    } else { // auto
        themeIcon.classList.add('bi-circle-half');
        themeIcon.parentElement.setAttribute('title', 'Theme: Auto (click for Light)');
    }
}

// Update the pipeline SVG based on actual theme
function updatePipelineSvg(actualTheme) {
    const pipelineSvg = document.getElementById('pipelineSvg');
    if (!pipelineSvg) return;

    if (actualTheme === 'dark') {
        pipelineSvg.src = '/static/images/devops-pipeline-dark.svg';
    } else {
        pipelineSvg.src = '/static/images/devops-pipeline.svg';
    }
}

// Update the API sources SVG based on actual theme
function updateApiSourcesSvg(actualTheme) {
    const apiSourcesSvg = document.getElementById('apiSourcesSvg');
    if (!apiSourcesSvg) return;

    if (actualTheme === 'dark') {
        apiSourcesSvg.src = '/static/images/api-sources-dark.svg';
    } else {
        apiSourcesSvg.src = '/static/images/api-sources.svg';
    }
}

// Update the actions network SVG based on actual theme
function updateActionsNetworkSvg(actualTheme) {
    const actionsNetworkSvg = document.getElementById('actionsNetworkSvg');
    if (!actionsNetworkSvg) return;

    if (actualTheme === 'dark') {
        actionsNetworkSvg.src = '/static/images/actions-network-dark.svg';
    } else {
        actionsNetworkSvg.src = '/static/images/actions-network.svg';
    }
}

// Set the theme preference and apply it
function setTheme(preference) {
    // Save preference to localStorage
    localStorage.setItem('theme', preference);

    // Get the actual theme to apply
    const actualTheme = getActualTheme(preference);

    // Apply the theme
    applyTheme(actualTheme);

    // Update icon
    updateThemeIcon(preference);

    // Update pipeline SVG
    updatePipelineSvg(actualTheme);

    // Update API sources SVG
    updateApiSourcesSvg(actualTheme);

    // Update actions network SVG
    updateActionsNetworkSvg(actualTheme);

    console.log(`Theme preference set to: ${preference} (applying: ${actualTheme})`);
}

// Toggle theme (cycles through light -> dark -> auto)
function toggleTheme() {
    const currentPreference = getThemePreference();
    let newPreference;

    if (currentPreference === 'light') {
        newPreference = 'dark';
    } else if (currentPreference === 'dark') {
        newPreference = 'auto';
    } else { // auto
        newPreference = 'light';
    }

    setTheme(newPreference);
}

// Initialize theme on page load
function initializeTheme() {
    const preference = getThemePreference();
    setTheme(preference);

    // Add event listener to theme toggle button
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Listen for system theme changes (only applies in auto mode)
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            const currentPreference = getThemePreference();
            // Only auto-switch if in auto mode
            if (currentPreference === 'auto') {
                const actualTheme = e.matches ? 'dark' : 'light';
                applyTheme(actualTheme);
                updatePipelineSvg(actualTheme);
                updateApiSourcesSvg(actualTheme);
                updateActionsNetworkSvg(actualTheme);
                console.log(`System theme changed, applying: ${actualTheme}`);
            }
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('App initialized');

    // Initialize theme (must be first to avoid flash)
    initializeTheme();

    // Initialize sidebar navigation
    initializeSidebarNavigation();

    // Initialize sidebar toggle
    initializeSidebarToggle();

    // Initialize Tabulator tables (with delay to ensure DOM is ready)
    setTimeout(initializeTables, 100);

    // Initialize admin form handlers
    initializeAdminHandlers();
    initializeNetBoxHandlers();

    // Initialize NaC YAML event listeners
    if (typeof initializeNacYamlEventListeners === 'function') {
        initializeNacYamlEventListeners(tableInstances);
    }

    // Initialize NaC YAML copy handlers
    if (typeof initializeNacYamlCopyHandlers === 'function') {
        initializeNacYamlCopyHandlers();
    }

    // Initialize NaC action form handlers
    if (typeof initializeNacActionFormHandlers === 'function') {
        initializeNacActionFormHandlers();
    }
});


/**
 * Initialize sidebar navigation
 */
function initializeSidebarNavigation() {
    const sidebarLinks = document.querySelectorAll('.sidebar-link');

    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();

            // Remove active class from all links
            sidebarLinks.forEach(l => {
                l.classList.remove('active');
                l.removeAttribute('aria-current');
            });

            // Add active class to clicked link
            this.classList.add('active');
            this.setAttribute('aria-current', 'page');

            // Get the page name and parent from data attributes
            const page = this.getAttribute('data-page');
            const parent = this.getAttribute('data-parent');
            console.log(`Navigated to: ${page} (parent: ${parent})`);

            // Close sidebar on mobile after selection
            if (window.innerWidth <= 768) {
                const sidebar = document.getElementById('sidebar');
                sidebar.classList.remove('show');
            }

            // Load page content
            loadPageContent(page, parent);
        });
    });

    // Initialize collapse arrow rotation
    const collapseElements = document.querySelectorAll('.sidebar-parent');
    collapseElements.forEach(element => {
        const target = element.getAttribute('href');
        const collapseEl = document.querySelector(target);

        if (collapseEl) {
            collapseEl.addEventListener('shown.bs.collapse', function() {
                element.setAttribute('aria-expanded', 'true');
            });

            collapseEl.addEventListener('hidden.bs.collapse', function() {
                element.setAttribute('aria-expanded', 'false');
            });
        }
    });
}


/**
 * Initialize sidebar toggle button
 */
function initializeSidebarToggle() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('show');
            sidebar.classList.toggle('collapsed');
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', function(event) {
            if (window.innerWidth <= 768) {
                const isClickInsideSidebar = sidebar.contains(event.target);
                const isClickOnToggle = sidebarToggle.contains(event.target);

                if (!isClickInsideSidebar && !isClickOnToggle && sidebar.classList.contains('show')) {
                    sidebar.classList.remove('show');
                }
            }
        });
    }
}


/**
 * Load content based on selected menu item
 */
function loadPageContent(page, parent) {
    console.log(`Loading content for: ${page} (parent: ${parent})`);

    // Hide all page content sections
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(p => {
        p.classList.remove('active');
    });

    // Show the selected page
    const selectedPage = document.getElementById(`page-${page}`);
    if (selectedPage) {
        selectedPage.classList.add('active');

        // Initialize table for this page if not already done
        initializeTableForPage(page);

        // Load VRF dropdown, attach groups dropdown, and fabric name for action-networks page
        if (page === 'action-networks') {
            if (typeof loadVrfDropdown === 'function') {
                loadVrfDropdown();
            }
            if (typeof loadAttachGroupsDropdown === 'function') {
                loadAttachGroupsDropdown();
            }
            if (typeof loadNetworkFabricName === 'function') {
                loadNetworkFabricName();
            }
        }

        // Smooth scroll to top of content
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        console.error(`Page not found: page-${page}`);
    }
}


/**
 * Initialize Tabulator tables
 */
function initializeTables() {
    // Check if Tabulator is available
    if (typeof Tabulator === 'undefined') {
        console.error('Tabulator not loaded');
        return;
    }

    // Initialize the table for the currently active page
    const activePage = document.querySelector('.page-content.active');
    if (activePage) {
        const pageId = activePage.id.replace('page-', '');
        initializeTableForPage(pageId);
    }
}


/**
 * Initialize table for a specific page
 * Delegates to NaC or ACI specific initializers
 */
function initializeTableForPage(page) {
    // Check if Tabulator is available
    if (typeof Tabulator === 'undefined') {
        console.error('Tabulator not loaded');
        return;
    }

    // Common Tabulator configuration
    const commonConfig = {
        pagination: true,
        paginationSize: 10,
        paginationSizeSelector: [5, 10, 25, 50, 100],
        layout: "fitColumns",
        responsiveLayout: "collapse",
        placeholder: "No Data Available",
        ajaxResponse: function(url, params, response) {
            // Extract data from the JSON response
            return response.data;
        }
    };

    // Determine if this is a NaC or ACI page and delegate
    const nacPages = ['bridge-domains', 'action-vrfs', 'action-networks', 'nac-tenants', 'nac-vrfs', 'create-tenant', 'create-tenant-vrf'];
    const aciPages = ['aci-tenants'];

    if (nacPages.includes(page)) {
        // Delegate to NaC initializer
        if (typeof initializeNacTableForPage === 'function') {
            initializeNacTableForPage(page, commonConfig, tableInstances);
        }
    } else if (aciPages.includes(page)) {
        // Delegate to ACI initializer
        if (typeof initializeAciTableForPage === 'function') {
            initializeAciTableForPage(page, commonConfig, tableInstances);
        }
    } else if (page === 'admin') {
        // Admin page has no tables
        console.log('Admin page - no tables to initialize');
    }
}


/**
 * Initialize admin form handlers
 */
function initializeAdminHandlers() {
    // Password toggle handlers
    initializePasswordToggle('toggleNacKey', 'nacApiKey');
    initializePasswordToggle('toggleAciPassword', 'aciPassword');

    // Form submission handler
    const apiKeysForm = document.getElementById('apiKeysForm');
    if (apiKeysForm) {
        apiKeysForm.addEventListener('submit', handleAdminFormSubmit);
    }

    // Load config button
    const loadConfigBtn = document.getElementById('loadConfigBtn');
    if (loadConfigBtn) {
        loadConfigBtn.addEventListener('click', loadAdminConfig);
    }

    // Clear config button
    const clearConfigBtn = document.getElementById('clearConfigBtn');
    if (clearConfigBtn) {
        clearConfigBtn.addEventListener('click', clearAdminConfig);
    }

    // Test Saved ACI configuration button
    const testSavedAciConfigBtn = document.getElementById('testSavedAciConfigBtn');
    if (testSavedAciConfigBtn) {
        testSavedAciConfigBtn.addEventListener('click', testSavedAciConfig);
    }

    // Test New ACI configuration button
    const testNewAciConfigBtn = document.getElementById('testNewAciConfigBtn');
    if (testNewAciConfigBtn) {
        testNewAciConfigBtn.addEventListener('click', testNewAciConfig);
    }

    // Test NaC API (SCM) connection button
    const testNacApiConnectionBtn = document.getElementById('testNacApiConnectionBtn');
    if (testNacApiConnectionBtn) {
        testNacApiConnectionBtn.addEventListener('click', testNacApiConnection);
    }

    // Auto-load configuration when admin page becomes visible
    const adminPage = document.getElementById('page-admin');
    if (adminPage) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.target.classList.contains('active')) {
                    // Page became active, load config if not already loaded
                    const nacApiKeyField = document.getElementById('nacApiKey');
                    if (nacApiKeyField && !nacApiKeyField.dataset.configLoaded) {
                        loadAdminConfig();
                        nacApiKeyField.dataset.configLoaded = 'true';
                    }
                }
            });
        });

        observer.observe(adminPage, { attributes: true, attributeFilter: ['class'] });
    }
}


/**
 * Initialize NetBox form handlers
 */
function initializeNetBoxHandlers() {
    // Password toggle handler for NetBox
    initializePasswordToggle('toggleNetboxKey', 'netboxApiKey');

    // Form submission handler
    const netboxConfigForm = document.getElementById('netboxConfigForm');
    if (netboxConfigForm) {
        netboxConfigForm.addEventListener('submit', handleNetBoxFormSubmit);
    }

    // Load config button
    const loadNetboxConfigBtn = document.getElementById('loadNetboxConfigBtn');
    if (loadNetboxConfigBtn) {
        loadNetboxConfigBtn.addEventListener('click', loadNetBoxConfig);
    }

    // Clear config button
    const clearNetboxConfigBtn = document.getElementById('clearNetboxConfigBtn');
    if (clearNetboxConfigBtn) {
        clearNetboxConfigBtn.addEventListener('click', clearNetBoxConfig);
    }

    // Test NetBox connection button
    const testNetboxConnectionBtn = document.getElementById('testNetboxConnectionBtn');
    if (testNetboxConnectionBtn) {
        testNetboxConnectionBtn.addEventListener('click', testNetboxConnection);
    }

    // Load NetBox roles button
    const loadNetboxRolesBtn = document.getElementById('loadNetboxRolesBtn');
    if (loadNetboxRolesBtn) {
        loadNetboxRolesBtn.addEventListener('click', loadNetboxRoles);
    }

    // Add NetBox prefix button
    const addNetboxPrefixBtn = document.getElementById('addNetboxPrefixBtn');
    if (addNetboxPrefixBtn) {
        addNetboxPrefixBtn.addEventListener('click', addNetboxPrefixEntry);
    }

    // Load NetBox VLAN groups button
    const loadNetboxVlanGroupsBtn = document.getElementById('loadNetboxVlanGroupsBtn');
    if (loadNetboxVlanGroupsBtn) {
        loadNetboxVlanGroupsBtn.addEventListener('click', loadNetboxVlanGroups);
    }

    // Add NetBox VLAN group button
    const addNetboxVlanGroupBtn = document.getElementById('addNetboxVlanGroupBtn');
    if (addNetboxVlanGroupBtn) {
        addNetboxVlanGroupBtn.addEventListener('click', addNetboxVlanGroupEntry);
    }

    // Refresh NetBox VLANs button
    const refreshNetboxVlansBtn = document.getElementById('refreshNetboxVlansBtn');
    if (refreshNetboxVlansBtn) {
        refreshNetboxVlansBtn.addEventListener('click', loadNetBoxVlans);
    }

    // Refresh Sites Dashboard button
    const refreshSitesDashboardBtn = document.getElementById('refreshSitesDashboardBtn');
    if (refreshSitesDashboardBtn) {
        refreshSitesDashboardBtn.addEventListener('click', loadSitesDashboard);
    }

    // Auto-load Sites Dashboard when NetBox Overview page becomes visible
    const netboxOverviewPage = document.getElementById('page-netbox-overview');
    if (netboxOverviewPage) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.target.classList.contains('active')) {
                    // Load Sites Dashboard
                    loadSitesDashboard();
                }
            });
        });

        observer.observe(netboxOverviewPage, { attributes: true, attributeFilter: ['class'] });
    }

    // Auto-load VLANs when NetBox VLANs page becomes visible
    const netboxVlansPage = document.getElementById('page-netbox-vlans');
    if (netboxVlansPage) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.target.classList.contains('active')) {
                    // Load VLANs
                    loadNetBoxVlans();
                }
            });
        });

        observer.observe(netboxVlansPage, { attributes: true, attributeFilter: ['class'] });
    }

    // Auto-load configuration when NetBox Admin page becomes visible
    const netboxAdminPage = document.getElementById('page-netbox-admin');
    if (netboxAdminPage) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.target.classList.contains('active')) {
                    // Page became active, load config if not already loaded
                    const netboxApiKeyField = document.getElementById('netboxApiKey');
                    if (netboxApiKeyField && !netboxApiKeyField.dataset.configLoaded) {
                        loadNetBoxConfig();
                        netboxApiKeyField.dataset.configLoaded = 'true';
                    }
                }
            });
        });

        observer.observe(netboxAdminPage, { attributes: true, attributeFilter: ['class'] });
    }
}


/**
 * Initialize Network Action form handlers
 */
function initializeNacActionFormHandlers() {
    const networkActionForm = document.getElementById('networkActionForm');
    if (networkActionForm) {
        networkActionForm.addEventListener('submit', handleNetworkActionSubmit);

        // Add reset handler to clear response message
        networkActionForm.addEventListener('reset', function() {
            const responseDiv = document.getElementById('networkActionResponse');
            if (responseDiv) {
                responseDiv.style.display = 'none';
                responseDiv.innerHTML = '';
                responseDiv.className = 'alert';
            }
        });
    }
}


/**
 * Handle Network Action form submission
 */
async function handleNetworkActionSubmit(event) {
    event.preventDefault();

    const responseDiv = document.getElementById('networkActionResponse');
    const submitBtn = event.target.querySelector('button[type="submit"]');

    try {
        // Get form values
        const networkName = document.getElementById('networkName').value.trim();
        const vrfName = document.getElementById('networkVrfName').value;
        const attachGroup = document.getElementById('networkAttachGroup').value;

        if (!networkName) {
            throw new Error('Network name is required');
        }

        if (!vrfName) {
            throw new Error('VRF name is required');
        }

        if (!attachGroup) {
            throw new Error('Network attach group is required');
        }

        // Disable submit button and show loading state
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating...';
        }

        // Step 1: Create VLAN in NetBox
        console.log(`Creating VLAN for network: ${networkName}`);
        const vlanResponse = await fetch('/api/v1/netbox/create-network-vlan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                network_name: networkName
            })
        });

        const vlanData = await vlanResponse.json();

        if (vlanData.status !== 'success' && vlanData.status !== 'partial_success') {
            throw new Error(vlanData.message || 'Failed to create VLAN in NetBox');
        }

        // Step 2: Calculate gateway IP address from prefix
        // Replace last digit (0) with 1 and keep /24 mask
        const prefixCidr = vlanData.prefix.prefix;  // e.g., "10.1.2.0/24"
        const prefixParts = prefixCidr.split('/');
        const ipParts = prefixParts[0].split('.');
        ipParts[3] = '1';  // Replace last octet with 1
        const gatewayIp = `${ipParts.join('.')}/24`;  // e.g., "10.1.2.1/24"

        console.log(`Calculated gateway IP: ${gatewayIp} from prefix ${prefixCidr}`);

        // Step 3: Merge network to NaC API
        console.log(`Merging network to NaC API: ${networkName}`);
        const nacMergeResponse = await fetch('/api/v1/nac/networks/merge', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: networkName,
                vlan_id: vlanData.vlan.vid,
                net_id: vlanData.vlan.vnid,  // VNID as net_id
                gw_ip_address: gatewayIp,
                vrf_name: vrfName,
                vlan_name: `vlan_${networkName.toLowerCase()}`,
                network_attach_group: attachGroup,
                change_message: `Adding network ${networkName} via GUI`,
                apply: false  // Don't auto-apply, let user review changeset
            })
        });

        const nacMergeData = await nacMergeResponse.json();

        if (nacMergeData.status !== 'success') {
            // NetBox creation succeeded but NaC merge failed
            throw new Error(`NetBox resources created, but NaC merge failed: ${nacMergeData.message}`);
        }

        console.log('Network merged to NaC API successfully');

        // Display success message with both NetBox and NaC details
        let detailsHtml = `
            <strong><i class="bi bi-check-circle me-2"></i>Success!</strong>
            <p class="mb-2 mt-2">Network created successfully in both NetBox and NaC API</p>
            <div class="row mt-3">
                <div class="col-md-6">
                    <strong>NetBox - VLAN Details:</strong>
                    <ul class="mb-0 mt-1">
                        <li>VLAN ID: ${vlanData.vlan.vid}</li>
                        <li>VLAN Name: ${vlanData.vlan.name}</li>
                        <li>VNID (L2_VNID): ${vlanData.vlan.vnid}</li>
                        <li>NetBox VLAN ID: ${vlanData.vlan.id}</li>
                    </ul>
                </div>`;

        // Add prefix details if available
        if (vlanData.prefix) {
            detailsHtml += `
                <div class="col-md-6">
                    <strong>NetBox - Prefix Details:</strong>
                    <ul class="mb-0 mt-1">
                        <li>Prefix: ${vlanData.prefix.prefix}</li>
                        <li>Gateway IP: ${gatewayIp}</li>
                        <li>Prefix Name: ${vlanData.prefix.name}</li>
                        <li>NetBox Prefix ID: ${vlanData.prefix.id}</li>
                    </ul>
                </div>`;
        }

        detailsHtml += `
            </div>
            <div class="row mt-3">
                <div class="col-12">
                    <strong>NaC API - Network Details:</strong>
                    <ul class="mb-0 mt-1">
                        <li>Network Name: ${networkName}</li>
                        <li>VRF: ${vrfName}</li>
                        <li>VLAN ID: ${vlanData.vlan.vid}</li>
                        <li>Network ID (VNID): ${vlanData.vlan.vnid}</li>
                        <li>Gateway IP: ${gatewayIp}</li>
                        <li>VLAN Name: vlan_${networkName.toLowerCase()}</li>
                        <li>Network Attach Group: ${attachGroup}</li>
                        <li><em>Status: Merged to NaC API (not applied to fabric yet)</em></li>
                    </ul>
                </div>
            </div>`;

        responseDiv.innerHTML = detailsHtml;
        responseDiv.className = 'alert alert-success';
        responseDiv.style.display = 'block';

        // Refresh the networks table to show the new network
        if (typeof loadActionNetworks === 'function') {
            loadActionNetworks();
        }

        // Don't automatically reset form - let user review success message and manually reset if needed

    } catch (error) {
        console.error('Error creating network:', error);
        responseDiv.innerHTML = `
            <strong><i class="bi bi-x-circle me-2"></i>Error</strong>
            <p class="mb-0 mt-2">${error.message}</p>
        `;
        responseDiv.className = 'alert alert-danger';
        responseDiv.style.display = 'block';
    } finally {
        // Restore submit button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="bi bi-git me-2"></i>Merge Network';
        }

        // Scroll to response
        responseDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}


/**
 * Initialize password toggle for a field
 */
function initializePasswordToggle(buttonId, inputId) {
    const button = document.getElementById(buttonId);
    const input = document.getElementById(inputId);

    if (button && input) {
        button.addEventListener('click', function() {
            const icon = this.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('bi-eye', 'bi-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.replace('bi-eye-slash', 'bi-eye');
            }
        });
    }
}


// Global variable to store NetBox prefix settings
let netboxPrefixSettings = [];

// Global variable to store NetBox VLAN group settings
let netboxVlanGroupSettings = [];

/**
 * Handle admin form submission
 */
async function handleAdminFormSubmit(event) {
    event.preventDefault();

    const responseDiv = document.getElementById('apiKeysResponse');

    try {
        // IMPORTANT: Load existing configuration first to avoid overwriting NetBox settings
        const loadResponse = await fetch('/api/v1/admin/load-config');
        const loadData = await loadResponse.json();

        if (loadData.status !== 'success') {
            throw new Error('Failed to load existing configuration');
        }

        const existingConfig = loadData.data;

        // Get form fields
        const nacApiUrlField = document.getElementById('nacApiUrl');
        const nacApiKeyField = document.getElementById('nacApiKey');
        const aciPasswordField = document.getElementById('aciPassword');
        const aciUrlField = document.getElementById('aciUrl');
        const aciUsernameField = document.getElementById('aciUsername');
        const scmProviderField = document.getElementById('scmProvider');
        const scmApiUrlField = document.getElementById('scmApiUrl');
        const repositoryUrlField = document.getElementById('repositoryUrl');
        const dataSourcesDirField = document.getElementById('dataSourcesDir');

        // Merge NAC/ACI configuration with existing NetBox configuration
        const formData = {
            // Update NAC and ACI configuration
            nac_api_url: nacApiUrlField.value,
            nac_api_key: getFieldValue(nacApiKeyField),
            aci_password: getFieldValue(aciPasswordField),
            aci_url: aciUrlField.value,
            aci_username: aciUsernameField.value,
            scm_provider: scmProviderField.value,
            scm_api_url: scmApiUrlField.value,
            repository_url: repositoryUrlField.value,
            data_sources_dir: dataSourcesDirField.value,

            // Preserve existing NetBox configuration
            netbox_url: existingConfig.netbox_url || '',
            netbox_username: existingConfig.netbox_username || '',
            netbox_api_key: existingConfig.netbox_api_key || '',
            netbox_prefix_settings: existingConfig.netbox_prefix_settings || [],
            netbox_vlan_group_settings: existingConfig.netbox_vlan_group_settings || []
        };

        const response = await fetch('/api/v1/admin/save-config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.status === 'success') {
            responseDiv.innerHTML = `
                <strong><i class="bi bi-check-circle me-2"></i>Success!</strong>
                <p class="mb-0 mt-2">${data.message}</p>
                <p class="mb-0 mt-1 small text-success">
                    <i class="bi bi-info-circle me-1"></i>
                    Configuration saved. All API calls will now use the updated credentials.
                </p>
            `;
            responseDiv.className = 'alert alert-success';
            responseDiv.style.display = 'block';

            // Update last config update timestamp
            const timestamp = new Date().toLocaleString();
            const lastUpdateEl = document.getElementById('lastConfigUpdate');
            if (lastUpdateEl) {
                lastUpdateEl.textContent = timestamp;
            }

            // Reload config to show updated placeholder values
            nacApiKeyField.dataset.configLoaded = 'false';
            setTimeout(() => {
                nacApiKeyField.dataset.configLoaded = 'false';
                loadAdminConfig();
            }, 500);
        } else {
            throw new Error(data.message || 'Failed to save configuration');
        }
    } catch (error) {
        console.error('Admin config save error:', error);
        responseDiv.textContent = `✗ Error: ${error.message}`;
        responseDiv.className = 'alert alert-danger';
        responseDiv.style.display = 'block';
    }

    // Smooth scroll to response
    responseDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}


/**
 * Get actual field value for saving
 */
function getFieldValue(field) {
    const currentValue = field.value;
    const hasValue = field.dataset.hasValue === 'true';
    const actualValue = field.dataset.actualValue || '';

    // If field has placeholder dots, use stored value
    if (currentValue === '••••••••••••••••' && hasValue) {
        return actualValue;
    }

    // If field is empty but had a value, keep existing
    if (currentValue === '' && hasValue && actualValue) {
        return actualValue;
    }

    // Otherwise use the new value
    return currentValue;
}


/**
 * Load admin configuration
 */
async function loadAdminConfig() {
    const responseDiv = document.getElementById('apiKeysResponse');

    try {
        const response = await fetch('/api/v1/admin/load-config');
        const result = await response.json();

        if (result.status === 'success') {
            const data = result.data;

            // Store actual values in data attributes and show placeholders for non-empty fields
            const nacApiUrlField = document.getElementById('nacApiUrl');
            const nacApiKeyField = document.getElementById('nacApiKey');
            const aciPasswordField = document.getElementById('aciPassword');
            const aciUrlField = document.getElementById('aciUrl');
            const aciUsernameField = document.getElementById('aciUsername');
            const scmProviderField = document.getElementById('scmProvider');
            const scmApiUrlField = document.getElementById('scmApiUrl');
            const repositoryUrlField = document.getElementById('repositoryUrl');
            const dataSourcesDirField = document.getElementById('dataSourcesDir');

            // Mark as loaded
            nacApiKeyField.dataset.configLoaded = 'true';

            // Handle NAC API URL (not sensitive, show actual value)
            nacApiUrlField.value = data.nac_api_url || '';

            // Handle NaC API Key
            if (data.nac_api_key) {
                nacApiKeyField.value = '••••••••••••••••';
                nacApiKeyField.dataset.hasValue = 'true';
                nacApiKeyField.dataset.actualValue = data.nac_api_key;
                nacApiKeyField.placeholder = 'Value configured - enter new value to change';
            } else {
                nacApiKeyField.value = '';
                nacApiKeyField.dataset.hasValue = 'false';
                nacApiKeyField.placeholder = 'Enter Passthrough API Key';
            }

            // Handle ACI Password
            if (data.aci_password) {
                aciPasswordField.value = '••••••••••••••••';
                aciPasswordField.dataset.hasValue = 'true';
                aciPasswordField.dataset.actualValue = data.aci_password;
                aciPasswordField.placeholder = 'Value configured - enter new value to change';
            } else {
                aciPasswordField.value = '';
                aciPasswordField.dataset.hasValue = 'false';
                aciPasswordField.placeholder = 'Enter ACI Password';
            }

            // Handle other fields
            aciUrlField.value = data.aci_url || '';
            aciUsernameField.value = data.aci_username || '';
            scmProviderField.value = data.scm_provider || '';
            scmApiUrlField.value = data.scm_api_url || '';
            repositoryUrlField.value = data.repository_url || '';
            dataSourcesDirField.value = data.data_sources_dir || '';

            // Add focus listeners to clear placeholder when user starts typing
            addPlaceholderClearListener(nacApiKeyField);
            addPlaceholderClearListener(aciPasswordField);

            responseDiv.textContent = '✓ Configuration loaded successfully';
            responseDiv.className = 'alert alert-info';
            responseDiv.style.display = 'block';
        } else {
            throw new Error(result.message || 'Failed to load configuration');
        }
    } catch (error) {
        console.error('Admin config load error:', error);
        responseDiv.textContent = `✗ Error: ${error.message}`;
        responseDiv.className = 'alert alert-danger';
        responseDiv.style.display = 'block';
    }

    // Smooth scroll to response
    responseDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}


/**
 * Add listener to clear placeholder dots when user focuses on field
 */
function addPlaceholderClearListener(field) {
    // Remove existing listener if any
    field.removeEventListener('focus', clearPlaceholderDots);

    // Add new listener
    field.addEventListener('focus', clearPlaceholderDots);
}


/**
 * Clear placeholder dots when user focuses on a field with existing value
 */
function clearPlaceholderDots(event) {
    const field = event.target;
    if (field.dataset.hasValue === 'true' && field.value === '••••••••••••••••') {
        field.value = '';
        field.placeholder = 'Enter new value or leave empty to keep current';
    }
}


/**
 * Load roles from NetBox API
 */
async function loadNetboxRoles() {
    const selectElement = document.getElementById('netboxPrefixRole');
    const loadBtn = document.getElementById('loadNetboxRolesBtn');

    if (!selectElement) {
        return;
    }

    // Show loading state
    const originalText = loadBtn ? loadBtn.innerHTML : '';
    if (loadBtn) {
        loadBtn.disabled = true;
        loadBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Loading...';
    }

    try {
        const response = await fetch('/api/v1/netbox/roles');
        const result = await response.json();

        if (result.status === 'success' && result.data && result.data.results) {
            const roles = result.data.results;

            // Clear existing options except the first one
            selectElement.innerHTML = '<option value="">-- Select a Role --</option>';

            // Add roles as options
            roles.forEach(role => {
                const option = document.createElement('option');
                option.value = JSON.stringify({
                    id: role.id,
                    name: role.name,
                    slug: role.slug
                });
                option.textContent = `${role.name} (${role.slug})`;
                selectElement.appendChild(option);
            });

            showToast(`Loaded ${roles.length} roles from NetBox`, 'success', 3000);
        } else {
            showToast('Failed to load roles. Please check your NetBox configuration.', 'error', 5000);
        }
    } catch (error) {
        console.error('Error loading roles:', error);
        showToast(`Error loading roles: ${error.message}`, 'error', 5000);
    } finally {
        // Restore button state
        if (loadBtn) {
            loadBtn.disabled = false;
            loadBtn.innerHTML = originalText;
        }
    }
}


/**
 * Add NetBox prefix entry (role-based)
 */
async function addNetboxPrefixEntry() {
    const roleField = document.getElementById('netboxPrefixRole');
    const addBtn = document.getElementById('addNetboxPrefixBtn');

    if (!roleField || !roleField.value) {
        showToast('Please select a Role first. Click "Load Roles from NetBox" to populate the list.', 'warning', 4000);
        return;
    }

    // Show loading state
    const originalText = addBtn ? addBtn.innerHTML : '';
    if (addBtn) {
        addBtn.disabled = true;
        addBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Adding...';
    }

    try {
        // Parse the selected role data
        const roleData = JSON.parse(roleField.value);

        // Check for duplicate role IDs
        const duplicate = netboxPrefixSettings.find(item => item.role_id === roleData.id);
        if (duplicate) {
            showToast(`Role "${roleData.name}" (ID: ${roleData.id}) is already added`, 'warning', 4000);
            return;
        }

        // Fetch prefixes for this role from NetBox
        console.log(`Fetching prefixes for role: ${roleData.slug} (ID: ${roleData.id})`);
        const response = await fetch(`/api/v1/netbox/prefixes?role=${roleData.slug}`);
        const result = await response.json();

        if (result.status !== 'success' || !result.data || !result.data.results || result.data.results.length === 0) {
            showToast(`No prefixes found for role "${roleData.name}". Please ensure this role has prefixes configured in NetBox.`, 'error', 5000);
            return;
        }

        // Find the prefix that has a role.id matching the selected role
        // The prefix.role object looks like: { "id": 5, "name": "nac-tf-fabric1", "slug": "nac-tf-fabric1", ... }
        const prefix = result.data.results.find(p => p.role && p.role.id === roleData.id);

        if (!prefix) {
            showToast(`No prefix found with role "${roleData.name}" (ID: ${roleData.id}). Found ${result.data.results.length} prefix(es) but none match this role ID.`, 'error', 5000);
            console.error('Available prefixes:', result.data.results);
            return;
        }

        const prefixId = prefix.id;
        console.log(`Found prefix ID ${prefixId} (${prefix.prefix}) for role ${roleData.name}`);

        // Add to array with both role_id and prefix_id
        netboxPrefixSettings.push({
            role_id: roleData.id,
            name: roleData.name,
            slug: roleData.slug,
            prefix_id: prefixId
        });

        // Reset select field
        roleField.value = '';

        // Update table display
        renderNetboxPrefixSettings();

    } catch (error) {
        console.error('Error adding role:', error);
        showToast(`Error adding role: ${error.message}`, 'error', 5000);
    } finally {
        // Restore button state
        if (addBtn) {
            addBtn.disabled = false;
            addBtn.innerHTML = originalText;
        }
    }
}


/**
 * Remove NetBox prefix entry
 */
function removeNetboxPrefixEntry(index) {
    if (confirm('Are you sure you want to remove this entry?')) {
        netboxPrefixSettings.splice(index, 1);
        renderNetboxPrefixSettings();
    }
}


/**
 * Update NetBox prefix settings table display
 */
function renderNetboxPrefixSettings() {
    const tableBody = document.getElementById('netboxSettingsTableBody');

    if (!tableBody) {
        return;
    }

    // If array is empty, show "No roles configured"
    if (netboxPrefixSettings.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted">
                    <em>No roles configured</em>
                </td>
            </tr>
        `;
        return;
    }

    // Build table rows
    let rows = '';
    netboxPrefixSettings.forEach((setting, index) => {
        rows += `
            <tr>
                <td>${setting.name}</td>
                <td>${setting.slug}</td>
                <td>${setting.role_id}</td>
                <td>${setting.prefix_id || 'N/A'}</td>
                <td class="text-center">
                    <button type="button" class="btn btn-sm btn-danger" onclick="removeNetboxPrefixEntry(${index})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = rows;
}


/**
 * Load VLAN groups from NetBox API
 */
async function loadNetboxVlanGroups() {
    const selectElement = document.getElementById('netboxVlanGroup');
    const loadBtn = document.getElementById('loadNetboxVlanGroupsBtn');

    if (!selectElement) {
        return;
    }

    // Show loading state
    const originalText = loadBtn ? loadBtn.innerHTML : '';
    if (loadBtn) {
        loadBtn.disabled = true;
        loadBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Loading...';
    }

    try {
        const response = await fetch('/api/v1/netbox/vlan-groups');
        const result = await response.json();

        if (result.status === 'success' && result.data && result.data.results) {
            const vlanGroups = result.data.results;

            // Clear existing options except the first one
            selectElement.innerHTML = '<option value="">-- Select a VLAN Group --</option>';

            // Add VLAN groups as options
            vlanGroups.forEach(vg => {
                // Log the raw VLAN group data to debug
                console.log('VLAN Group from NetBox:', vg);

                // Extract min/max VID from vid_ranges array
                // vid_ranges is an array of [start, end] arrays: [[1000, 3999]]
                let minVid = 1;
                let maxVid = 4094;

                if (vg.vid_ranges && vg.vid_ranges.length > 0 && vg.vid_ranges[0].length >= 2) {
                    minVid = vg.vid_ranges[0][0];
                    maxVid = vg.vid_ranges[0][1];
                }

                console.log(`VLAN Group ${vg.name}: vid_ranges=${JSON.stringify(vg.vid_ranges)}, using: ${minVid}-${maxVid}`);

                const option = document.createElement('option');
                option.value = JSON.stringify({
                    id: vg.id,
                    name: vg.name,
                    min_vid: minVid,
                    max_vid: maxVid
                });
                const vlanRange = `${minVid}-${maxVid}`;
                option.textContent = `${vg.name} (VLANs: ${vlanRange})`;
                selectElement.appendChild(option);
            });

            showToast(`Loaded ${vlanGroups.length} VLAN groups from NetBox`, 'success', 3000);
        } else {
            showToast('Failed to load VLAN groups. Please check your NetBox configuration.', 'error', 5000);
        }
    } catch (error) {
        console.error('Error loading VLAN groups:', error);
        showToast(`Error loading VLAN groups: ${error.message}`, 'error', 5000);
    } finally {
        // Restore button state
        if (loadBtn) {
            loadBtn.disabled = false;
            loadBtn.innerHTML = originalText;
        }
    }
}


/**
 * Add NetBox VLAN group entry
 */
function addNetboxVlanGroupEntry() {
    const vlanGroupField = document.getElementById('netboxVlanGroup');

    if (!vlanGroupField || !vlanGroupField.value) {
        showToast('Please select a VLAN Group first. Click "Load VLAN Groups from NetBox" to populate the list.', 'warning', 4000);
        return;
    }

    try {
        // Parse the selected VLAN group data
        const vlanGroupData = JSON.parse(vlanGroupField.value);

        // Check for duplicate VLAN group IDs
        const duplicate = netboxVlanGroupSettings.find(item => item.id === vlanGroupData.id);
        if (duplicate) {
            showToast(`VLAN Group "${vlanGroupData.name}" (ID: ${vlanGroupData.id}) is already added`, 'warning', 4000);
            return;
        }

        // Add to array
        netboxVlanGroupSettings.push({
            id: vlanGroupData.id,
            name: vlanGroupData.name,
            min_vid: vlanGroupData.min_vid,
            max_vid: vlanGroupData.max_vid,
            vlan_range: `${vlanGroupData.min_vid}-${vlanGroupData.max_vid}`
        });

        // Reset select field
        vlanGroupField.value = '';

        // Update table display
        renderNetboxVlanGroupSettings();

    } catch (error) {
        console.error('Error adding VLAN group:', error);
        showToast('Error adding VLAN group. Please try again.', 'error', 5000);
    }
}


/**
 * Remove NetBox VLAN group entry
 */
function removeNetboxVlanGroupEntry(index) {
    if (confirm('Are you sure you want to remove this VLAN group?')) {
        netboxVlanGroupSettings.splice(index, 1);
        renderNetboxVlanGroupSettings();
    }
}


/**
 * Update NetBox VLAN group settings table display
 */
function renderNetboxVlanGroupSettings() {
    const tableBody = document.getElementById('netboxVlanGroupTableBody');

    if (!tableBody) {
        return;
    }

    // If array is empty, show "No VLAN groups configured"
    if (netboxVlanGroupSettings.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-muted">
                    <em>No VLAN groups configured</em>
                </td>
            </tr>
        `;
        return;
    }

    // Build table rows
    let rows = '';
    netboxVlanGroupSettings.forEach((setting, index) => {
        rows += `
            <tr>
                <td>${setting.name}</td>
                <td>${setting.id}</td>
                <td>${setting.vlan_range}</td>
                <td class="text-center">
                    <button type="button" class="btn btn-sm btn-danger" onclick="removeNetboxVlanGroupEntry(${index})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = rows;
}


/**
 * Clear admin configuration
 */
async function clearAdminConfig() {
    const responseDiv = document.getElementById('apiKeysResponse');

    // Confirm before clearing
    if (!confirm('Are you sure you want to clear all API configuration?')) {
        return;
    }

    try {
        const response = await fetch('/api/v1/admin/clear-config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const data = await response.json();

        if (data.status === 'success') {
            // Clear all form fields
            const fields = [
                'nacApiUrl', 'nacApiKey', 'aciPassword', 'aciUrl',
                'aciUsername', 'scmProvider',
                'scmApiUrl', 'repositoryUrl', 'dataSourcesDir'
            ];

            fields.forEach(fieldId => {
                const field = document.getElementById(fieldId);
                if (field) {
                    field.value = '';
                    field.dataset.hasValue = 'false';
                    field.dataset.actualValue = '';
                }
            });

            responseDiv.textContent = `✓ ${data.message}`;
            responseDiv.className = 'alert alert-warning';
            responseDiv.style.display = 'block';

            // Update last config update timestamp
            const timestamp = new Date().toLocaleString();
            const lastUpdateEl = document.getElementById('lastConfigUpdate');
            if (lastUpdateEl) {
                lastUpdateEl.textContent = timestamp;
            }
        } else {
            throw new Error(data.message || 'Failed to clear configuration');
        }
    } catch (error) {
        console.error('Admin config clear error:', error);
        responseDiv.textContent = `✗ Error: ${error.message}`;
        responseDiv.className = 'alert alert-danger';
        responseDiv.style.display = 'block';
    }

    // Smooth scroll to response
    responseDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}


/**
 * Test saved ACI configuration (from config.yaml)
 */
async function testSavedAciConfig() {
    const responseDiv = document.getElementById('aciConnectionResponse');
    const testBtn = document.getElementById('testSavedAciConfigBtn');

    // Show loading state
    const originalText = testBtn.innerHTML;
    testBtn.disabled = true;
    testBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Testing...';

    responseDiv.style.display = 'none';

    try {
        // Send GET request to test saved configuration
        const response = await fetch('/api/v1/aci/test-connection', {
            method: 'GET'
        });
        const result = await response.json();

        if (result.status === 'success') {
            let fabricInfo = '';
            if (result.fabrics_count !== undefined) {
                fabricInfo += `<p class="mb-0 mt-1"><small>Found ${result.fabrics_count} fabric(s)</small></p>`;
            }
            if (result.configured_fabric) {
                const fabricStatus = result.fabric_found
                    ? '<i class="bi bi-check-circle-fill text-success"></i>'
                    : '<i class="bi bi-x-circle-fill text-warning"></i>';
                fabricInfo += `<p class="mb-0 mt-1"><small>${fabricStatus} Configured fabric: <strong>${result.configured_fabric}</strong></small></p>`;
            }

            responseDiv.innerHTML = `
                <strong><i class="bi bi-check-circle me-2"></i>Connection Successful!</strong>
                <p class="mb-0 mt-2">${result.message}</p>
                ${fabricInfo}
            `;

            // Use warning class if fabric configured but not found
            if (result.configured_fabric && !result.fabric_found) {
                responseDiv.className = 'alert alert-warning mt-3';
            } else {
                responseDiv.className = 'alert alert-success mt-3';
            }
        } else {
            responseDiv.innerHTML = `
                <strong><i class="bi bi-x-circle me-2"></i>Connection Failed</strong>
                <p class="mb-0 mt-2">${result.message}</p>
            `;
            responseDiv.className = 'alert alert-danger mt-3';
        }

        responseDiv.style.display = 'block';
    } catch (error) {
        console.error('Connection test error:', error);
        responseDiv.innerHTML = `
            <strong><i class="bi bi-x-circle me-2"></i>Connection Test Failed</strong>
            <p class="mb-0 mt-2">Unable to connect to server: ${error.message}</p>
        `;
        responseDiv.className = 'alert alert-danger mt-3';
        responseDiv.style.display = 'block';
    } finally {
        // Restore button state
        testBtn.disabled = false;
        testBtn.innerHTML = originalText;

        // Smooth scroll to response
        responseDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}


/**
 * Test new ACI configuration (from form values)
 */
async function testNewAciConfig() {
    const responseDiv = document.getElementById('aciConnectionResponse');
    const testBtn = document.getElementById('testNewAciConfigBtn');

    // Show loading state
    const originalText = testBtn.innerHTML;
    testBtn.disabled = true;
    testBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Testing...';

    responseDiv.style.display = 'none';

    try {
        // Get current form values
        const formData = {
            aci_url: document.getElementById('aciUrl').value.trim(),
            aci_username: document.getElementById('aciUsername').value.trim(),
            aci_password: document.getElementById('aciPassword').value.trim()
        };

        // Validate required fields
        if (!formData.aci_url || !formData.aci_username || !formData.aci_password) {
            responseDiv.innerHTML = `
                <strong><i class="bi bi-exclamation-triangle me-2"></i>Validation Error</strong>
                <p class="mb-0 mt-2">Please fill in URL, Username, and Password fields before testing.</p>
            `;
            responseDiv.className = 'alert alert-warning mt-3';
            responseDiv.style.display = 'block';
            return;
        }

        // Send POST request with form data to test new configuration
        const response = await fetch('/api/v1/aci/test-connection', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        const result = await response.json();

        if (result.status === 'success') {
            let fabricInfo = '';
            if (result.fabrics_count !== undefined) {
                fabricInfo += `<p class="mb-0 mt-1"><small>Found ${result.fabrics_count} fabric(s)</small></p>`;
            }
            if (result.configured_fabric) {
                const fabricStatus = result.fabric_found
                    ? '<i class="bi bi-check-circle-fill text-success"></i>'
                    : '<i class="bi bi-x-circle-fill text-warning"></i>';
                fabricInfo += `<p class="mb-0 mt-1"><small>${fabricStatus} Configured fabric: <strong>${result.configured_fabric}</strong></small></p>`;
            }

            responseDiv.innerHTML = `
                <strong><i class="bi bi-check-circle me-2"></i>Connection Successful!</strong>
                <p class="mb-0 mt-2">${result.message}</p>
                ${fabricInfo}
            `;

            // Use warning class if fabric configured but not found
            if (result.configured_fabric && !result.fabric_found) {
                responseDiv.className = 'alert alert-warning mt-3';
            } else {
                responseDiv.className = 'alert alert-success mt-3';
            }
        } else {
            responseDiv.innerHTML = `
                <strong><i class="bi bi-x-circle me-2"></i>Connection Failed</strong>
                <p class="mb-0 mt-2">${result.message}</p>
            `;
            responseDiv.className = 'alert alert-danger mt-3';
        }

        responseDiv.style.display = 'block';
    } catch (error) {
        console.error('Connection test error:', error);
        responseDiv.innerHTML = `
            <strong><i class="bi bi-x-circle me-2"></i>Connection Test Failed</strong>
            <p class="mb-0 mt-2">Unable to connect to server: ${error.message}</p>
        `;
        responseDiv.className = 'alert alert-danger mt-3';
        responseDiv.style.display = 'block';
    } finally {
        // Restore button state
        testBtn.disabled = false;
        testBtn.innerHTML = originalText;

        // Smooth scroll to response
        responseDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}


/**
 * Test NaC API (SCM) connection
 */
async function testNacApiConnection() {
    const responseDiv = document.getElementById('nacApiConnectionResponse');
    const testBtn = document.getElementById('testNacApiConnectionBtn');

    // Show loading state
    const originalText = testBtn.innerHTML;
    testBtn.disabled = true;
    testBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Testing...';

    responseDiv.style.display = 'none';

    try {
        const response = await fetch('/api/v1/admin/test-nac-api-connection');
        const result = await response.json();

        if (result.status === 'success') {
            let apiInfo = '';
            if (result.scm_api_url) {
                apiInfo += `<p class="mb-0 mt-1"><small>SCM API URL: <strong>${result.scm_api_url}</strong></small></p>`;
            }
            if (result.scm_provider) {
                apiInfo += `<p class="mb-0 mt-1"><small>Provider: <strong>${result.scm_provider}</strong></small></p>`;
            }
            if (result.size_of_data_model) {
                apiInfo += `<p class="mb-0 mt-1"><small>Size of Data Model: <strong>${result.size_of_data_model} bytes</strong></small></p>`;
            }

            responseDiv.innerHTML = `
                <strong><i class="bi bi-check-circle me-2"></i>Connection Successful!</strong>
                <p class="mb-0 mt-2">${result.message}</p>
                ${apiInfo}
            `;
            responseDiv.className = 'alert alert-success mt-2';
        } else {
            responseDiv.innerHTML = `
                <strong><i class="bi bi-x-circle me-2"></i>Connection Failed</strong>
                <p class="mb-0 mt-2">${result.message}</p>
            `;
            responseDiv.className = 'alert alert-danger mt-2';
        }

        responseDiv.style.display = 'block';
    } catch (error) {
        console.error('Connection test error:', error);
        responseDiv.innerHTML = `
            <strong><i class="bi bi-x-circle me-2"></i>Connection Test Failed</strong>
            <p class="mb-0 mt-2">Unable to connect to server: ${error.message}</p>
        `;
        responseDiv.className = 'alert alert-danger mt-2';
        responseDiv.style.display = 'block';
    } finally {
        // Restore button state
        testBtn.disabled = false;
        testBtn.innerHTML = originalText;

        // Smooth scroll to response
        responseDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}


/**
 * Handle NetBox form submission
 */
async function handleNetBoxFormSubmit(event) {
    event.preventDefault();

    const responseDiv = document.getElementById('netboxConfigResponse');

    try {
        // IMPORTANT: Load existing configuration first to avoid overwriting NAC/ACI settings
        const loadResponse = await fetch('/api/v1/admin/load-config');
        const loadData = await loadResponse.json();

        if (loadData.status !== 'success') {
            throw new Error('Failed to load existing configuration');
        }

        const existingConfig = loadData.data;

        // Get form fields
        const netboxUrlField = document.getElementById('netboxUrl');
        const netboxUsernameField = document.getElementById('netboxUsername');
        const netboxApiKeyField = document.getElementById('netboxApiKey');

        // Merge NetBox configuration with existing NAC and ACI configuration
        const formData = {
            // Preserve existing NAC configuration
            nac_api_url: existingConfig.nac_api_url || '',
            nac_api_key: existingConfig.nac_api_key || '',
            scm_provider: existingConfig.scm_provider || '',
            scm_api_url: existingConfig.scm_api_url || '',
            repository_url: existingConfig.repository_url || '',
            data_sources_dir: existingConfig.data_sources_dir || '',

            // Preserve existing ACI configuration
            aci_password: existingConfig.aci_password || '',
            aci_url: existingConfig.aci_url || '',
            aci_username: existingConfig.aci_username || '',

            // Update NetBox configuration only
            netbox_url: netboxUrlField.value,
            netbox_username: netboxUsernameField.value,
            netbox_api_key: getFieldValue(netboxApiKeyField),
            netbox_prefix_settings: netboxPrefixSettings,
            netbox_vlan_group_settings: netboxVlanGroupSettings
        };

        const response = await fetch('/api/v1/admin/save-config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.status === 'success') {
            responseDiv.innerHTML = `
                <strong><i class="bi bi-check-circle me-2"></i>Success!</strong>
                <p class="mb-0 mt-2">${data.message}</p>
                <p class="mb-0 mt-1 small text-success">
                    <i class="bi bi-info-circle me-1"></i>
                    Configuration saved. All NetBox API calls will now use the updated credentials.
                </p>
            `;
            responseDiv.className = 'alert alert-success';

            // Update field states to show configuration is saved
            if (netboxApiKeyField.value && netboxApiKeyField.value !== '••••••••••••••••') {
                netboxApiKeyField.dataset.hasValue = 'true';
                netboxApiKeyField.dataset.actualValue = netboxApiKeyField.value;
                netboxApiKeyField.value = '••••••••••••••••';
                netboxApiKeyField.placeholder = 'Value configured - enter new value to change';
            }

            addPlaceholderClearListener(netboxApiKeyField);

            // Auto-refresh the sites dashboard after configuration save
            setTimeout(() => {
                loadSitesDashboard();
            }, 1000);
        } else {
            responseDiv.innerHTML = `
                <strong><i class="bi bi-x-circle me-2"></i>Error</strong>
                <p class="mb-0 mt-2">${data.message}</p>
            `;
            responseDiv.className = 'alert alert-danger';
        }

        responseDiv.style.display = 'block';
        responseDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (error) {
        console.error('Error:', error);
        responseDiv.innerHTML = `
            <strong><i class="bi bi-x-circle me-2"></i>Error</strong>
            <p class="mb-0 mt-2">Failed to save configuration. Please try again.</p>
        `;
        responseDiv.className = 'alert alert-danger';
        responseDiv.style.display = 'block';
        responseDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}


/**
 * Load NetBox configuration
 */
async function loadNetBoxConfig() {
    try {
        const response = await fetch('/api/v1/admin/load-config');
        const result = await response.json();

        if (result.status === 'success') {
            const data = result.data;

            // Get form fields
            const netboxUrlField = document.getElementById('netboxUrl');
            const netboxUsernameField = document.getElementById('netboxUsername');
            const netboxApiKeyField = document.getElementById('netboxApiKey');

            // Handle API key field with placeholder
            if (data.netbox_api_key) {
                netboxApiKeyField.value = '••••••••••••••••';
                netboxApiKeyField.dataset.hasValue = 'true';
                netboxApiKeyField.dataset.actualValue = data.netbox_api_key;
                netboxApiKeyField.placeholder = 'Value configured - enter new value to change';
            } else {
                netboxApiKeyField.value = '';
                netboxApiKeyField.dataset.hasValue = 'false';
                netboxApiKeyField.placeholder = 'Enter Netbox API Key';
            }

            // Set other field values
            netboxUrlField.value = data.netbox_url || '';
            netboxUsernameField.value = data.netbox_username || '';

            // Load NetBox prefix settings
            netboxPrefixSettings = data.netbox_prefix_settings || [];
            renderNetboxPrefixSettings();

            // Load NetBox VLAN group settings
            netboxVlanGroupSettings = data.netbox_vlan_group_settings || [];
            renderNetboxVlanGroupSettings();

            // Add placeholder clear listeners
            addPlaceholderClearListener(netboxApiKeyField);
        }
    } catch (error) {
        console.error('Failed to load configuration:', error);
    }
}


/**
 * Clear NetBox configuration
 */
async function clearNetBoxConfig() {
    if (!confirm('Are you sure you want to clear the NetBox configuration? This action cannot be undone.')) {
        return;
    }

    const responseDiv = document.getElementById('netboxConfigResponse');

    try {
        // Clear the form fields
        document.getElementById('netboxUrl').value = '';
        document.getElementById('netboxUsername').value = '';
        const netboxApiKeyField = document.getElementById('netboxApiKey');
        netboxApiKeyField.value = '';
        netboxApiKeyField.dataset.hasValue = 'false';
        netboxApiKeyField.placeholder = 'Enter Netbox API Key';

        // Clear prefix settings
        netboxPrefixSettings = [];
        renderNetboxPrefixSettings();

        // Show success message
        responseDiv.innerHTML = `
            <strong><i class="bi bi-check-circle me-2"></i>Success!</strong>
            <p class="mb-0 mt-2">NetBox configuration cleared. Remember to save to persist changes.</p>
        `;
        responseDiv.className = 'alert alert-info';
        responseDiv.style.display = 'block';
        responseDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (error) {
        console.error('Error:', error);
        responseDiv.innerHTML = `
            <strong><i class="bi bi-x-circle me-2"></i>Error</strong>
            <p class="mb-0 mt-2">Failed to clear configuration. Please try again.</p>
        `;
        responseDiv.className = 'alert alert-danger';
        responseDiv.style.display = 'block';
        responseDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}


/**
 * Test NetBox connection
 */
async function testNetboxConnection() {
    const responseDiv = document.getElementById('netboxConnectionResponse');
    const testBtn = document.getElementById('testNetboxConnectionBtn');

    // Show loading state
    const originalText = testBtn.innerHTML;
    testBtn.disabled = true;
    testBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Testing...';

    responseDiv.style.display = 'none';

    try {
        const response = await fetch('/api/v1/netbox/test-connection');
        const result = await response.json();

        if (result.status === 'success') {
            let netboxInfo = '';
            if (result.netbox_version) {
                netboxInfo += `<p class="mb-0 mt-1"><small>NetBox Version: <strong>${result.netbox_version}</strong></small></p>`;
            }
            if (result.prefix_count !== undefined) {
                netboxInfo += `<p class="mb-0 mt-1"><small>IP Prefixes: <strong>${result.prefix_count}</strong></small></p>`;
            }

            responseDiv.innerHTML = `
                <strong><i class="bi bi-check-circle me-2"></i>Connection Successful!</strong>
                <p class="mb-0 mt-2">${result.message}</p>
                ${netboxInfo}
            `;
            responseDiv.className = 'alert alert-success mt-3';
        } else {
            responseDiv.innerHTML = `
                <strong><i class="bi bi-x-circle me-2"></i>Connection Failed</strong>
                <p class="mb-0 mt-2">${result.message}</p>
            `;
            responseDiv.className = 'alert alert-danger mt-3';
        }

        responseDiv.style.display = 'block';
    } catch (error) {
        console.error('Connection test error:', error);
        responseDiv.innerHTML = `
            <strong><i class="bi bi-x-circle me-2"></i>Connection Test Failed</strong>
            <p class="mb-0 mt-2">Unable to connect to server: ${error.message}</p>
        `;
        responseDiv.className = 'alert alert-danger mt-3';
        responseDiv.style.display = 'block';
    } finally {
        // Restore button state
        testBtn.disabled = false;
        testBtn.innerHTML = originalText;

        // Smooth scroll to response
        responseDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}


/**
 * Load and display NetBox Sites Dashboard
 */
async function loadSitesDashboard() {
    const container = document.getElementById('sitesDashboardContainer');
    const refreshBtn = document.getElementById('refreshSitesDashboardBtn');

    // Show loading state
    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Loading...';
    }

    container.innerHTML = `
        <div class="col-12 text-center py-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="text-muted mt-2">Loading sites...</p>
        </div>
    `;

    try {
        const response = await fetch('/api/v1/netbox/sites-dashboard');
        const result = await response.json();

        if (result.status === 'success' && result.data) {
            const sites = result.data.sites || [];

            if (sites.length === 0) {
                container.innerHTML = `
                    <div class="col-12">
                        <div class="alert alert-info">
                            <i class="bi bi-info-circle me-2"></i>
                            No sites found in NetBox
                        </div>
                    </div>
                `;
                return;
            }

            // Create site cards
            let cardsHtml = '';
            sites.forEach(site => {
                const stats = site.statistics;
                const statusLabel = site.status?.label || 'Unknown';
                const statusValue = site.status?.value || 'unknown';
                const statusColors = {
                    'active': 'success',
                    'planned': 'info',
                    'retired': 'secondary',
                    'staging': 'warning'
                };
                const statusColor = statusColors[statusValue] || 'secondary';

                cardsHtml += `
                    <div class="col-md-6 col-lg-4">
                        <div class="card h-100 shadow-sm border-${statusColor} hover-shadow">
                            <div class="card-header bg-${statusColor} text-white">
                                <h6 class="mb-0">
                                    <i class="bi bi-building me-2"></i>${site.name}
                                    <span class="badge bg-light text-dark float-end">${statusLabel}</span>
                                </h6>
                                ${site.facility ? `<small class="text-white-50">${site.facility}</small>` : ''}
                            </div>
                            <div class="card-body">
                                ${site.description ? `<p class="card-text text-muted small mb-3">${site.description}</p>` : ''}

                                <div class="row g-2">
                                    <div class="col-6">
                                        <div class="stat-box text-center p-2 bg-light rounded">
                                            <i class="bi bi-geo-alt text-primary"></i>
                                            <div class="h4 mb-0 mt-1">${stats.locations}</div>
                                            <small class="text-muted">Location${stats.locations !== 1 ? 's' : ''}</small>
                                        </div>
                                    </div>
                                    <div class="col-6">
                                        <div class="stat-box text-center p-2 bg-light rounded">
                                            <i class="bi bi-collection text-warning"></i>
                                            <div class="h4 mb-0 mt-1">${stats.vlan_groups}</div>
                                            <small class="text-muted">VLAN Group${stats.vlan_groups !== 1 ? 's' : ''}</small>
                                        </div>
                                    </div>
                                    <div class="col-6">
                                        <div class="stat-box text-center p-2 bg-light rounded">
                                            <i class="bi bi-diagram-2 text-info"></i>
                                            <div class="h4 mb-0 mt-1">${stats.vlans}</div>
                                            <small class="text-muted">VLAN${stats.vlans !== 1 ? 's' : ''}</small>
                                        </div>
                                    </div>
                                    <div class="col-6">
                                        <div class="stat-box text-center p-2 bg-light rounded">
                                            <i class="bi bi-hdd-network text-success"></i>
                                            <div class="h4 mb-0 mt-1">${stats.prefixes}</div>
                                            <small class="text-muted">Prefix${stats.prefixes !== 1 ? 'es' : ''}</small>
                                        </div>
                                    </div>
                                </div>

                                ${stats.available_prefixes > 0 ? `
                                    <div class="mt-3 text-center">
                                        <span class="badge bg-success">
                                            <i class="bi bi-check-circle me-1"></i>
                                            ${stats.available_prefixes} Available Prefix${stats.available_prefixes !== 1 ? 'es' : ''}
                                        </span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `;
            });

            container.innerHTML = cardsHtml;

        } else {
            container.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-warning">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        ${result.message || 'Failed to load sites dashboard'}
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading sites dashboard:', error);
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    <i class="bi bi-x-circle me-2"></i>
                    Error loading sites dashboard: ${error.message}
                </div>
            </div>
        `;
    } finally {
        // Restore button state
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '<i class="bi bi-arrow-clockwise me-1"></i>Refresh';
        }
    }
}


/**
 * Load and display NetBox VLANs
 */
async function loadNetBoxVlans() {
    const tableContainer = document.getElementById('netboxVlansTable');
    const refreshBtn = document.getElementById('refreshNetboxVlansBtn');

    // Show loading state
    if (refreshBtn) {
        const originalText = refreshBtn.innerHTML;
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Loading...';
    }

    try {
        const response = await fetch('/api/v1/netbox/vlans');
        const result = await response.json();

        if (result.status === 'success' && result.data) {
            const vlans = result.data.results || [];
            const totalCount = result.data.count || vlans.length;

            console.log(`Loaded ${totalCount} VLANs from NetBox`);

            // Update count badge
            const countBadge = document.getElementById('vlansCountBadge');
            if (countBadge) {
                countBadge.textContent = `${totalCount} total VLANs loaded`;
            }

            // Initialize or update Tabulator table
            if (tableInstances.netboxVlans) {
                tableInstances.netboxVlans.setData(vlans);
            } else {
                tableInstances.netboxVlans = new Tabulator('#netboxVlansTable', {
                    data: vlans,
                    layout: 'fitColumns',
                    pagination: 'local',
                    paginationSize: 25,
                    paginationSizeSelector: [10, 25, 50, 100],
                    movableColumns: true,
                    resizableRows: true,
                    responsiveLayout: 'collapse',
                    placeholder: 'No VLANs found',
                    columns: [
                        {
                            title: 'VLAN ID',
                            field: 'vid',
                            sorter: 'number',
                            width: 100,
                            headerFilter: 'input'
                        },
                        {
                            title: 'Name',
                            field: 'name',
                            sorter: 'string',
                            headerFilter: 'input'
                        },
                        {
                            title: 'Status',
                            field: 'status.label',
                            sorter: 'string',
                            width: 120,
                            formatter: function(cell) {
                                const value = cell.getValue();
                                const statusColors = {
                                    'Active': 'success',
                                    'Reserved': 'warning',
                                    'Deprecated': 'danger'
                                };
                                const colorClass = statusColors[value] || 'secondary';
                                return `<span class="badge bg-${colorClass}">${value || 'Unknown'}</span>`;
                            }
                        },
                        {
                            title: 'Role',
                            field: 'role.name',
                            sorter: 'string',
                            headerFilter: 'input',
                            formatter: function(cell) {
                                const value = cell.getValue();
                                return value || '<em class="text-muted">No role</em>';
                            }
                        },
                        {
                            title: 'Tenant',
                            field: 'tenant.name',
                            sorter: 'string',
                            headerFilter: 'input',
                            formatter: function(cell) {
                                const value = cell.getValue();
                                return value || '<em class="text-muted">No tenant</em>';
                            }
                        },
                        {
                            title: 'Site',
                            field: 'site.name',
                            sorter: 'string',
                            headerFilter: 'input',
                            formatter: function(cell) {
                                const value = cell.getValue();
                                return value || '<em class="text-muted">No site</em>';
                            }
                        },
                        {
                            title: 'Group',
                            field: 'group.name',
                            sorter: 'string',
                            headerFilter: 'input',
                            formatter: function(cell) {
                                const value = cell.getValue();
                                return value || '<em class="text-muted">No group</em>';
                            }
                        },
                        {
                            title: 'Description',
                            field: 'description',
                            sorter: 'string',
                            formatter: function(cell) {
                                const value = cell.getValue();
                                return value || '<em class="text-muted">No description</em>';
                            }
                        }
                    ]
                });
            }
        } else {
            tableContainer.innerHTML = `
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    ${result.message || 'Failed to load VLANs from NetBox'}
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading NetBox VLANs:', error);
        tableContainer.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-x-circle me-2"></i>
                Error loading VLANs: ${error.message}
            </div>
        `;
    } finally {
        // Restore button state
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '<i class="bi bi-arrow-clockwise me-1"></i>Refresh';
        }
    }
}


/**
 * Utility function to make API calls
 */
async function apiCall(endpoint, options = {}) {
    const defaultOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    };

    const config = { ...defaultOptions, ...options };

    try {
        const response = await fetch(endpoint, config);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}


/**
 * Load fabric name into the Network action form
 */
async function loadNetworkFabricName() {
    const fabricNameField = document.getElementById('networkFabricName');

    if (!fabricNameField) {
        return;
    }

    try {
        const response = await fetch('/api/v1/admin/load-config');
        const result = await response.json();

        if (result.status === 'success' && result.data) {
            const fabricName = 'Not Configured';
            fabricNameField.value = fabricName;
            fabricNameField.classList.add('text-muted');
        } else {
            fabricNameField.value = 'Error loading fabric name';
            fabricNameField.classList.add('text-danger');
        }
    } catch (error) {
        console.error('Error loading fabric name:', error);
        fabricNameField.value = 'Error loading fabric name';
        fabricNameField.classList.add('text-danger');
    }
}


/**
 * Show toast notification (Bootstrap 5.3)
 * @param {string} message - The message to display
 * @param {string} type - The type of toast: 'success', 'error', 'info', 'warning'
 * @param {number} duration - Auto-hide delay in milliseconds (default: 3000)
 */
function showToast(message, type = 'info', duration = 3000) {
    const toastEl = document.getElementById('globalToast');
    const toastTitle = document.getElementById('toastTitle');
    const toastBody = document.getElementById('toastBody');
    const toastIcon = document.getElementById('toastIcon');

    if (!toastEl || !toastTitle || !toastBody || !toastIcon) {
        console.error('Toast elements not found');
        console.log('Toast message:', message);
        return;
    }

    // Set icon and colors based on type
    const toastHeader = toastEl.querySelector('.toast-header');
    toastIcon.className = 'bi me-2';

    switch(type) {
        case 'success':
            toastTitle.textContent = 'Success';
            toastIcon.classList.add('bi-check-circle-fill', 'text-success');
            toastHeader.classList.remove('bg-danger', 'bg-warning', 'bg-info');
            toastHeader.classList.add('bg-success', 'text-white');
            break;
        case 'error':
            toastTitle.textContent = 'Error';
            toastIcon.classList.add('bi-x-circle-fill', 'text-white');
            toastHeader.classList.remove('bg-success', 'bg-warning', 'bg-info');
            toastHeader.classList.add('bg-danger', 'text-white');
            break;
        case 'warning':
            toastTitle.textContent = 'Warning';
            toastIcon.classList.add('bi-exclamation-triangle-fill', 'text-dark');
            toastHeader.classList.remove('bg-success', 'bg-danger', 'bg-info');
            toastHeader.classList.add('bg-warning');
            break;
        case 'info':
        default:
            toastTitle.textContent = 'Info';
            toastIcon.classList.add('bi-info-circle-fill', 'text-white');
            toastHeader.classList.remove('bg-success', 'bg-danger', 'bg-warning');
            toastHeader.classList.add('bg-info', 'text-white');
            break;
    }

    // Set message
    toastBody.textContent = message;

    // Show the toast with auto-hide
    const toast = new bootstrap.Toast(toastEl, {
        autohide: true,
        delay: duration
    });
    toast.show();
}
