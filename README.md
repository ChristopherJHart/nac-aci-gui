<div align="center">
  <img src="src/nac_aci_gui/static/images/nac-logo.svg" alt="NaC - Network as Code" width="600"/>
</div>

# NaC ACI GUI - Network as Code with ACI Integration

A modern network management web application built with Python Flask backend and Bootstrap 5.3 frontend for Cisco Systems Inc., featuring seamless integration with Cisco ACI (Application Centric Infrastructure).

## Quick Start

```bash
# Install uv (if not already installed)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Clone and setup
cd nac-aci-gui
uv sync

# Configure environment
cp .env.sample .env

# Run the application
uv run nac-aci-gui
```

Visit `http://localhost:9999` to access the application.

**⚙️ Configuration Required**: To use NaC API and ACI features, configure `yaml/config.yaml` or use the Admin panel in the web interface. See [Configure API Integration](#5-configure-api-integration-required-for-api-features) section below.

## Features

- 🚀 **Flask Backend**: Lightweight Python web framework
- 🎨 **Bootstrap 5.3**: Latest Bootstrap for responsive design
- 📱 **Mobile-First**: Fully responsive layout
- 🔌 **API Ready**: RESTful API endpoints included
- ✨ **Modern JavaScript**: Clean, async/await patterns
- 🎯 **Interactive UI**: Live API testing and form handling
- ⚙️ **Admin Panel**: Web-based configuration management with YAML storage
- 🔐 **Secure Config**: API keys stored in YAML format (gitignored)

## Project Structure

```
.
├── src/
│   └── nac_aci_gui/       # Main Python package
│       ├── __init__.py
│       ├── app.py         # Flask application with API routes
│       ├── nac_api.py     # NaC API client
│       ├── aci.py         # ACI (Application Centric Infrastructure) client
│       ├── api/
│       │   └── v1/        # API v1 blueprints
│       ├── static/
│       │   ├── css/
│       │   │   └── style.css      # Custom CSS styles
│       │   ├── images/
│       │   │   └── *.png          # Logo and image assets
│       │   └── js/
│       │       ├── app.js         # Frontend JavaScript
│       │       ├── nac.js         # NaC-specific features
│       │       └── aci.js         # ACI-specific features
│       └── templates/
│           └── index.html         # Main HTML template
├── pyproject.toml         # Project configuration and dependencies
├── .env.sample            # Environment variables template
├── .venv/                 # Virtual environment (created by uv)
├── yaml/
│   └── config.yaml.sample # Configuration file template
├── README.md              # This file
└── DEVELOPMENT.md         # Detailed development guide
```

## Setup

### Prerequisites

- Python 3.11 or higher
- [uv](https://github.com/astral-sh/uv) - Fast Python package installer and resolver

### Installing uv

```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Or using Homebrew
brew install astral-sh/uv/uv

# Windows
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# Or using pip
pip install uv
```

### Installation

1. **Clone or navigate to the project directory**

```bash
cd nac-aci-gui
```

2. **Install dependencies and create virtual environment**

```bash
uv sync
```

This command will:
- Create a `.venv` directory with the virtual environment
- Install all dependencies from `pyproject.toml`
- Install the package in editable mode

3. **Set up environment variables**

```bash
cp .env.sample .env
# Edit .env and set your SECRET_KEY
```

4. **Run the application**

```bash
# Using the installed command
uv run nac-aci-gui

# Or using Python module syntax
uv run python -m nac_aci_gui.app

# Or direct execution
uv run python src/nac_aci_gui/app.py
```

The application will start on `http://localhost:9999`

5. **Configure API Integration** (Required for API features)

The application requires configuration for both NaC API and ACI integration.

#### Option A: Using the Web Admin Panel (Recommended)

Navigate to the Admin page in the web interface (`http://localhost:9999` → Admin) to configure:

**NaC API Settings:**
- **API URL**: NaC API server URL (e.g., `http://localhost:8000`)
- **API Key**: Authentication key for NaC API
- **SCM Provider**: Source Code Manager (github, gitlab, bitbucket)
- **SCM API URL**: Your SCM API endpoint
- **Repository URL**: Your data repository (format: `username/repository`)
- **Data Sources Directory**: Directory containing YAML data (usually `data`)

**ACI Settings:**
- **API Key**: ACI API key for authentication
- **URL**: ACI APIC URL (e.g., `https://apic.example.com`)
- **Username**: ACI username
- **Fabric Name**: Target fabric name (optional - scopes operations to specific fabric)

Configuration is automatically saved to `yaml/config.yaml`

**Security Feature**: When loading existing configuration, API key fields show placeholder dots (••••••••••••••••) instead of actual values. The green border indicates a value is already configured. Click into the field to change it, or leave it unchanged to keep the current value.

#### Option B: Manual Configuration File

You can also manually create or edit `yaml/config.yaml`:

```yaml
nac:
  api_url: http://0.0.0.0:8000
  api_key: ghp_xxxxxxxxxxxxxxxx
  scm_provider: github
  scm_api_url: https://github.com/api/v3/
  repository_url: username/repository
  data_sources_dir: data

aci:
  api_key: xxxxxxxxxxxxxxxxxxxxxxxxx
  url: https://apic.example.com
  username: admin
  fabric_name: fabric1
```

**Field Descriptions:**

| Field | Description | Example |
|-------|-------------|---------|
| `nac.api_url` | NaC API server endpoint | `http://0.0.0.0:8000` |
| `nac.api_key` | GitHub/GitLab/Bitbucket personal access token | `ghp_xxxxx` |
| `nac.scm_provider` | Source code manager type | `github`, `gitlab`, `bitbucket` |
| `nac.scm_api_url` | SCM API endpoint | `https://github.com/api/v3/` |
| `nac.repository_url` | Repository path (no base URL) | `username/repo-name` |
| `nac.data_sources_dir` | Directory with YAML data in repo | `data` or `datasources` |
| `aci.api_key` | ACI API key (from APIC admin panel) | Long hex string |
| `aci.url` | ACI APIC HTTPS URL | `https://apic.example.com` |
| `aci.username` | ACI username for API calls | `admin` |
| `aci.fabric_name` | Optional fabric scope | `fabric1` |

**Note:** A sample configuration file is provided at `yaml/config.yaml.sample`

## Running with Docker Compose

`docker-compose.yml` runs the portal alongside [nac-api](https://netascode.cisco.com/docs/tools/nac-api/overview/):

```bash
cp yaml/config.yaml.sample yaml/config.yaml   # then fill in NaC API, ACI and NetBox settings
docker compose up -d --build                  # portal on :9999, nac-api on :8000
```

- Set `NACAPI_IMAGE` in `.env` to choose the nac-api image. Pull request titles (`apply_title`) need nac-api built from 0.5.2 or later source.
- Proxy settings are passed as build args from `HTTP_PROXY`, `HTTPS_PROXY` and `NO_PROXY`.
- Put environment-specific settings, such as `extra_hosts` or runtime proxy variables, in `docker-compose.override.yml`. Compose loads it automatically, and it is gitignored.

## Trunk VLANs to Server

**Actions → Trunk VLANs to Server** works alongside **Add VLAN to Port**. Instead of choosing a leaf and port, the user finds their server in NetBox:

1. Filter servers by row and rack (NetBox locations and racks), or search by name or description.
2. Pick one of the server's interfaces. The portal follows the NetBox cable on that interface to the leaf switch and port.
3. Pick an EPG/VLAN. As in Add VLAN to Port, VLANs already trunked on that port are listed separately and left out of the dropdown.
4. Submit. The portal opens a pull request that adds the static port binding, with the server and its location in the PR description.

For this to work, NetBox needs:

- Servers with the `server` device role, placed in racks in a location (row)
- Leaf switches with an integer `aci_node_id` custom field that matches the node ID in the data model
- Cables from server interfaces to leaf interfaces named `Ethernet<module>/<port>`

`scripts/seed_netbox_dcim.py` seeds a demo layout: three rows, twelve racks, six leaf switches (nodes 101–106) and 48 dual-homed servers. It is idempotent, so you can re-run it safely:

```bash
uv run python scripts/seed_netbox_dcim.py    # reads NetBox settings from yaml/config.yaml
```

## API Documentation

The application includes **interactive API documentation** powered by Swagger/Flasgger.

### Accessing the API Documentation

Once the application is running, visit:

```
http://localhost:9999/swagger/
```

The Swagger UI provides:
- 📚 **Complete API Reference** - All endpoints with detailed documentation
- 🧪 **Interactive Testing** - Try API calls directly from your browser
- 📝 **Request/Response Schemas** - See exactly what data is expected and returned
- 🏷️ **Organized by Categories** - General, Tables, Admin, ACI, and NaC API endpoints

### API Categories

- **General** - Basic application endpoints
- **Tables** - Data endpoints for UI tables (VRFs, Networks, Switches, Interfaces)
- **Admin** - Configuration management endpoints
- **ACI** - Cisco ACI (Application Centric Infrastructure) integration endpoints
- **NaC API** - Network as Code API integration endpoints

### Quick Example

```bash
# Test the ACI connection
curl http://localhost:9999/api/v1/aci/test-connection

# Get VRFs from NaC API
curl http://localhost:9999/api/v1/nac/vrfs
```

For detailed API documentation, examples, and interactive testing, use the Swagger interface.

## NaC API Integration

### What is NaC API?

**NaC API** (Network as Code API) is a northbound API gateway to Source Code Managers (SCM) like GitHub, GitLab, and Bitbucket. It provides programmatic access to network configuration stored as YAML files in version-controlled repositories.

### Key Benefits

- **GitOps for Networks**: Manage network configs as code in Git repositories
- **Version Control**: Full history and rollback capabilities for network changes
- **Validation**: Built-in YAML validation and schema checking
- **Automation**: Enable CI/CD pipelines for network changes
- **Multi-Provider**: Supports GitHub, GitLab, Bitbucket, and local filesystems

### How It Works

```
┌─────────────────┐         ┌──────────────┐         ┌─────────────────┐
│  NaC ACI GUI    │ ──────> │   NaC API    │ ──────> │  SCM (GitHub)   │
│  (This App)     │         │   Gateway    │         │  + YAML Data    │
└─────────────────┘         └──────────────┘         └─────────────────┘
        │                                                      │
        │                                                      │
        └──────────────────────────────────────────────────────┘
                    Network config as YAML in Git
```

1. **GUI** → User makes changes through web interface
2. **NaC API** → Validates and transforms requests to SCM operations
3. **SCM** → Stores network configuration as YAML files
4. **Network as Code** → YAML defines VRFs, networks, switches, etc.

### Configuration Requirements

To use NaC API features, you need:

1. **Running NaC API Server**:
   - Install and run NaC API: https://github.com/netascode/nac-api
   - Default URL: `http://localhost:8000`

2. **SCM Access**:
   - GitHub/GitLab/Bitbucket repository with network data
   - Personal Access Token (PAT) with repo read/write permissions
   - Repository structured for Network as Code (nac-yaml format)

3. **Configuration in yaml/config.yaml**:
   ```yaml
   nac:
     api_url: http://0.0.0.0:8000           # NaC API server
     api_key: ghp_xxxxxxxxxxxxxxxx          # Your SCM token
     scm_provider: github                   # github, gitlab, or bitbucket
     scm_api_url: https://github.com/api/v3/
     repository_url: username/your-repo     # SCM repo path
     data_sources_dir: data                 # YAML directory in repo
   ```

### What You Can Do

Once configured, this GUI enables:

- ✅ **View Network Data**: Browse VRFs, networks, switches from Git
- ✅ **Make Changes**: Add/modify VRFs and networks through forms
- ✅ **Validate Changes**: NaC API validates YAML before committing
- ✅ **Git Integration**: All changes tracked in version control
- ✅ **Rollback**: Use Git history to revert changes

### Example Workflow

1. User fills out "Add VRF" form in the GUI
2. GUI sends API request to NaC API
3. NaC API validates VRF configuration
4. NaC API updates YAML in Git repository
5. Git maintains version history
6. Network automation (Terraform, etc.) consumes YAML

## ACI Integration

The application includes a complete ACI API client with:
- Header-based authentication (X-ACI-Username, X-ACI-Apikey)
- RESTful API methods (GET, POST, PUT, DELETE)
- Convenience methods for common operations
- Connection testing from Admin panel

**Authentication Method**: Uses `X-ACI-Username` and `X-ACI-Apikey` headers for all requests.

**See [ACI_API.md](ACI_API.md) for complete API documentation and examples.**

## Frontend Features

### Interactive API Testing
- Click the "Test API" button to make a live API call
- See formatted JSON responses in real-time

### Form Submission
- Fill out the form and submit data to the API
- Receive instant feedback on submission success/failure

### Responsive Design
- Mobile-first approach using Bootstrap 5.3
- Card-based layout with smooth animations
- Feature showcase with icons

## Development

> **Note**: See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed development instructions, including testing, linting, and contributing guidelines.

### Managing Dependencies

```bash
# Add a new dependency
uv add package-name

# Add a development dependency
uv add --dev package-name

# Update dependencies
uv sync

# Remove a dependency
uv remove package-name
```

### Development Tools

This project includes pre-configured development tools:

```bash
# Run tests
uv run pytest

# Code formatting
uv run black src/

# Linting
uv run ruff check src/

# Type checking
uv run mypy src/
```

### Adding New Routes

Edit `src/nac_aci_gui/app.py` or create new blueprints in `src/nac_aci_gui/api/v1/`:

```python
@app.route('/api/your-endpoint', methods=['GET', 'POST'])
def your_endpoint():
    # Your logic here
    return jsonify({'status': 'success', 'data': 'your data'})
```

### Customizing Styles

Edit `src/nac_aci_gui/static/css/style.css` to customize the appearance:

```css
/* Your custom styles */
.your-class {
    /* properties */
}
```

### Adding JavaScript Functionality

Edit `src/nac_aci_gui/static/js/app.js` to add new frontend features:

```javascript
async function yourFunction() {
    const data = await apiCall('/api/your-endpoint');
    console.log(data);
}
```

## Production Deployment

Before deploying to production:

1. Set a strong `SECRET_KEY` in your environment variables
2. Set `FLASK_ENV=production`
3. Use a production WSGI server like Gunicorn:

```bash
# Add gunicorn to dependencies
uv add gunicorn

# Run with gunicorn
uv run gunicorn -w 4 -b 0.0.0.0:9999 "nac_aci_gui.app:app"
```

4. Consider using a reverse proxy (nginx, Apache)
5. Enable HTTPS with SSL certificates

### Building for Distribution

```bash
# Build wheel package
uv build

# The built package will be in dist/
# Install on target system:
uv pip install dist/nac_aci_gui-1.0.0-py3-none-any.whl
```

## Technologies Used

### Backend
- **Framework**: Flask 3.0.3
- **Package Manager**: [uv](https://github.com/astral-sh/uv) - Fast Python package installer
- **Dependencies**: Requests 2.31.0, python-dotenv 1.0.1, PyYAML 6.0.1, nac-yaml 1.1.1
- **API Documentation**: Flasgger 0.9.7.1 (Swagger UI)

### Frontend
- **UI Framework**: Bootstrap 5.3.3
- **Icons**: Bootstrap Icons 1.11.3
- **Tables**: Tabulator 6.2.5
- **JavaScript**: Modern ES6+ with async/await
- **CSS**: Custom styles + Bootstrap utilities

### Development Tools
- **Testing**: pytest 8.0+
- **Linting**: ruff 0.1+
- **Formatting**: black 24.0+
- **Type Checking**: mypy 1.8+

### Integration
- **Storage**: YAML format for secure configuration management
- **API Integration**: Cisco ACI REST API client with automatic authentication
- **NaC Integration**: Network as Code YAML configuration support

## License

MIT License - Feel free to use this template for your projects!

## Contributing

Contributions are welcome! Feel free to submit issues and pull requests.
