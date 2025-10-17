# Docker Compose Manager

A powerful command-line tool for managing Docker Compose projects with support for multiple environments, service monitoring, and automated deployment workflows.

## 🌐 Multi-Language Support

Docker Compose Manager is implemented in **four programming languages**, allowing you to choose the one that best fits your development stack:

- 🐍 **Python** (`src/main.py`)
- 🟨 **JavaScript** (`src/index.js`)
- 🔷 **TypeScript** (`src/index.ts`)
- 🐹 **Go** (`src/main.go`)

All implementations provide the same functionality and can be used interchangeably.

## ⚡ Quick Start

Get started with Docker Compose Manager in just 3 steps:

```bash
# 1. Clone the repository
git clone https://github.com/RK-goldengate-co/docker-compose-manager.git
cd docker-compose-manager

# 2. Choose your preferred language and install dependencies
# Python:
pip install -r requirements.txt
# JavaScript/TypeScript:
npm install
# Go:
go mod download

# 3. Run your first command
make status  # Check status of all services
```

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

Choose one based on your preferred language:

#### Python
```bash
pip install -r requirements.txt
```

#### JavaScript
```bash
npm install
```

#### TypeScript
```bash
npm install
npm run build
```

#### Go
```bash
go mod download
```

### Configuration

Copy the example configuration file:

```bash
cp dcm.config.yml.example dcm.config.yml
```

Edit `dcm.config.yml` to match your environment settings.

## 📖 Usage

### Using the Makefile (Recommended)

The easiest way to interact with Docker Compose Manager:

```bash
# Start all services
make up

# Stop all services
make down

# View service status
make status

# View logs
make logs

# Deploy to production
make deploy ENV=production
```

### Direct Command Execution

You can also run the tools directly:

#### Python
```bash
python src/main.py --help
python src/main.py start --env development
```

#### JavaScript
```bash
node src/index.js --help
node src/index.js start --env development
```

#### TypeScript
```bash
ts-node src/index.ts --help
ts-node src/index.ts start --env development
```

#### Go
```bash
go run src/main.go --help
go run src/main.go start --env development
```

## 🔧 Configuration

The `dcm.config.yml` file controls all aspects of Docker Compose Manager:

```yaml
environments:
  development:
    compose_file: docker-compose.dev.yml
    health_check_interval: 30
  
  staging:
    compose_file: docker-compose.staging.yml
    health_check_interval: 60
  
  production:
    compose_file: docker-compose.prod.yml
    health_check_interval: 120
    enable_monitoring: true
```

## 📁 Project Structure

```
docker-compose-manager/
├── src/
│   ├── main.py         # Python implementation
│   ├── index.js        # JavaScript implementation
│   ├── index.ts        # TypeScript implementation
│   └── main.go         # Go implementation
├── docs/               # Documentation
├── examples/           # Example configurations
├── tests/              # Test suites
├── dcm.config.yml.example  # Example configuration
├── Makefile            # Convenient command shortcuts
├── package.json        # Node.js dependencies
├── requirements.txt    # Python dependencies
├── setup.py            # Python package setup
├── tsconfig.json       # TypeScript configuration
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
