# Docker Compose Manager

A powerful command-line tool for managing Docker Compose projects with support for multiple environments, service monitoring, and automated deployment workflows.

## 🌐 Multi-Language Support

Docker Compose Manager is implemented in **four programming languages**, allowing you to choose the one that best fits your development stack:

- 🐍 **Python** (`src/main.py`)
- 🟨 **JavaScript** (`src/index.js`)
- 🔷 **TypeScript** (`src/index.ts`)
- 🐹 **Go** (`src/main.go`)

All implementations provide the same functionality and can be used interchangeably.

## ✨ Features

- 🚀 **Multi-Environment Support**: Easily switch between development, staging, and production configurations
- 📊 **Service Monitoring**: Real-time status monitoring of your Docker Compose services
- 🔄 **Automated Deployment**: Streamlined deployment workflows with rollback capabilities
- 📝 **Configuration Management**: Centralized management of environment-specific configurations
- 🛡️ **Health Checks**: Built-in health check monitoring for all services
- 📦 **Volume Management**: Easy backup and restore of Docker volumes
- 🌍 **Multi-Language**: Choose your preferred programming language

## 📋 Prerequisites

Depending on which implementation you want to use:

### Python
- Python 3.7+
- pip

### JavaScript/TypeScript
- Node.js 14+
- npm
- (Optional) TypeScript compiler for TypeScript

### Go
- Go 1.16+

### Docker
- Docker Engine 20.10+
- Docker Compose 2.0+

## 🚀 Installation

### Clone the Repository

```bash
git clone https://github.com/RK-goldengate-co/docker-compose-manager.git
cd docker-compose-manager
```

### Install Dependencies

Use the Makefile to install dependencies for all languages:

```bash
# Install all dependencies
make install-all

# Or install for specific languages
make install-python
make install-node
make install-go
```

#### Manual Installation

**Python:**
```bash
pip3 install -r requirements.txt
```

**Node.js:**
```bash
npm install js-yaml
```

**Go:**
```bash
cd src && go get gopkg.in/yaml.v2
```

## 🎯 Quick Start

### Using Makefile (Recommended)

The Makefile provides convenient shortcuts for running the application:

```bash
# Display help menu
make help

# Run with Python
make run-python

# Run with Node.js
make run-node

# Run with TypeScript
make run-typescript

# Run with Go (builds binary first)
make run-go

# Quick status check
make quick-python
make quick-node
make quick-typescript
make quick-go
```

### Running Directly

#### Python
```bash
# Display menu
python3 src/main.py

# Start all services
python3 src/main.py start

# Start specific service
python3 src/main.py start web

# Check status
python3 src/main.py status

# View logs
python3 src/main.py logs

# Stop services
python3 src/main.py stop
```

#### JavaScript
```bash
# Display menu
node src/index.js

# Start all services
node src/index.js start

# Start specific service
node src/index.js start web

# Check status
node src/index.js status

# View logs
node src/index.js logs

# Stop services
node src/index.js stop
```

#### TypeScript
```bash
# Install ts-node if not already installed
npm install -g ts-node @types/node

# Display menu
ts-node src/index.ts

# Start all services
ts-node src/index.ts start

# Start specific service
ts-node src/index.ts start web

# Check status
ts-node src/index.ts status

# View logs
ts-node src/index.ts logs

# Stop services
ts-node src/index.ts stop
```

#### Go
```bash
# Build binary
make build-go

# Run the binary
./build/dcm

# Or run directly without building
cd src && go run main.go

# Start all services
cd src && go run main.go start

# Start specific service
cd src && go run main.go start web

# Check status
cd src && go run main.go status

# View logs
cd src && go run main.go logs

# Stop services
cd src && go run main.go stop
```

## 📖 Usage

### Available Commands

All implementations support the following commands:

- `deploy [strategy]` - Deploy services with automated rollback on failure
- `backup [name]` - Create backup before deployment
- `rollback <backup_path>` - Rollback to previous deployment state
- `monitor [duration]` - Monitor services continuously
- `health <service>` - Check health status of specific service
- `status-detailed` - Get detailed status in JSON format

### Examples

```bash
# Start all services
python3 src/main.py start

# Start only the web service
node src/index.js start web

# Check status of all services
ts-node src/index.ts status

# View logs from database service
go run src/main.go logs database

# Restart all services
python3 src/main.py restart

# Build services
node src/index.js build

# Pull latest images
ts-node src/index.ts pull

# Deploy services with default strategy
python3 src/main.py deploy

# Deploy with specific strategy
node src/index.js deploy rolling

# Monitor services for 5 minutes
cd src && go run main.go monitor 300

# Check health of web service
python3 src/main.py health web

# Create backup before deployment
python3 src/main.py backup pre-production

# Rollback to previous deployment
python3 src/main.py rollback ./backups/backup_20231201_120000
```

## ⚙️ Configuration

Create a `dcm.config.yml` file in your project root:

```yaml
services:
  - web
  - database
  - cache
  - worker

compose_file: docker-compose.yml

environments:
  dev:
    compose_file: docker-compose.dev.yml
  staging:
    compose_file: docker-compose.staging.yml
  prod:
    compose_file: docker-compose.prod.yml
```

You can also use the example configuration:

```bash
cp dcm.config.yml.example dcm.config.yml
```

## 🏗️ Building

### Build All Implementations

```bash
make build-all
```

### Build Individual Implementations

```bash
# Build Python package
make build-python

# Build Node.js/TypeScript
make build-node

# Build Go binary
make build-go
```

The Go binary will be created in the `build/` directory and can be used standalone:

```bash
./build/dcm start
./build/dcm status
./build/dcm logs
```

## 🧪 Testing

```bash
# Run all tests
make test

# Test individual implementations
python3 -m pytest tests/
npm test
cd src && go test ./...
```

## 🧹 Cleaning

Remove build artifacts and temporary files:

```bash
make clean
```

## 📦 Project Structure

```
docker-compose-manager/
├── src/
│   ├── main.py          # Python implementation
│   ├── index.js         # JavaScript implementation
│   ├── index.ts         # TypeScript implementation
│   └── main.go          # Go implementation
├── Makefile             # Build and run scripts
├── README.md            # This file
├── requirements.txt     # Python dependencies
├── setup.py             # Python package setup
├── dcm.config.yml.example  # Example configuration
├── LICENSE              # License file
└── .gitignore          # Git ignore file
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

## 💡 Tips

1. **Choose Your Language**: Pick the implementation that matches your project's tech stack
2. **Use the Makefile**: The Makefile provides convenient shortcuts for all common tasks
3. **Configuration First**: Set up your `dcm.config.yml` before running commands
4. **Test Locally**: Always test changes in development before deploying to production
5. **Monitor Logs**: Use the `logs` command to troubleshoot issues

## 📞 Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

Made with ❤️ by the Docker Compose Manager team
