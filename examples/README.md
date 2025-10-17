# Examples

This directory contains example configurations and usage scenarios for Docker Compose Manager.

## Configuration Examples

- `dcm.config.yml` - Basic configuration with multiple environments
- `docker-compose.dev.yml` - Development environment compose file
- `docker-compose.prod.yml` - Production environment compose file

## Usage Examples

### Basic Usage
```bash
# Python
python3 src/main.py start

# JavaScript
node src/index.js start

# TypeScript
ts-node src/index.ts start

# Go
cd src && go run main.go start
```

### Environment Management
```bash
# List available environments
python3 src/main.py env

# Switch to production environment
python3 src/main.py env prod

# Start services in production
python3 src/main.py start
```

### Deployment with Rollback
```bash
# Deploy with recreate strategy
python3 src/main.py deploy

# Deploy with rolling strategy
python3 src/main.py deploy rolling

# Create backup before deployment
python3 src/main.py backup pre-deployment

# Rollback to previous state
python3 src/main.py rollback ./backups/backup_20231201_120000
```

### Monitoring
```bash
# Monitor services for 5 minutes
python3 src/main.py monitor 300

# Check health of specific service
python3 src/main.py health web

# Get detailed status in JSON
python3 src/main.py status-detailed
```

## Interactive Mode

All implementations support interactive mode for easier management:
```bash
python3 src/main.py  # Python
node src/index.js    # JavaScript
ts-node src/index.ts # TypeScript
```
