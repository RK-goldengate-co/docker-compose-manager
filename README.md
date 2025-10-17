# Docker Compose Manager

A powerful command-line tool for managing Docker Compose projects with support for multiple environments, service monitoring, and automated deployment workflows.

## Features

- 🚀 **Multi-Environment Support**: Easily switch between development, staging, and production configurations
- 📊 **Service Monitoring**: Real-time status monitoring of your Docker Compose services
- 🔄 **Automated Deployment**: Streamlined deployment workflows with rollback capabilities
- 📝 **Configuration Management**: Centralized management of environment-specific configurations
- 🛡️ **Health Checks**: Built-in health check monitoring for all services
- 📦 **Volume Management**: Easy backup and restore of Docker volumes

## Installation

```bash
pip install docker-compose-manager
```

## Quick Start

```bash
# Initialize a new project
dcm init

# Start services in development environment
dcm up --env dev

# Monitor service status
dcm status

# Deploy to production
dcm deploy --env prod
```

## Usage

### Basic Commands

- `dcm init` - Initialize a new Docker Compose Manager project
- `dcm up [--env ENV]` - Start services for specified environment
- `dcm down [--env ENV]` - Stop services for specified environment
- `dcm status` - Show status of all services
- `dcm logs [SERVICE]` - View logs for specific service
- `dcm deploy --env ENV` - Deploy to specified environment

### Configuration

Create a `dcm.config.yml` file in your project root:

```yaml
environments:
  dev:
    compose_file: docker-compose.dev.yml
  prod:
    compose_file: docker-compose.prod.yml
```

## Requirements

- Python 3.8+
- Docker 20.10+
- Docker Compose 2.0+

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please open an issue on GitHub.
