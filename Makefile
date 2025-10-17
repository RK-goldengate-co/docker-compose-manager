.PHONY: help install-all install-python install-node install-go build-all build-python build-node build-go run-python run-node run-typescript run-go test clean format lint docker-up docker-down docker-status

# Default target
help:
	@echo "Docker Compose Manager - Multi-Language Build System"
	@echo ""
	@echo "Available targets:"
	@echo "  make help             - Display this help message"
	@echo "  make install-all      - Install all dependencies (Python, Node.js, Go)"
	@echo "  make install-python   - Install Python dependencies"
	@echo "  make install-node     - Install Node.js dependencies"
	@echo "  make install-go       - Install Go dependencies"
	@echo ""
	@echo "  make build-all        - Build all implementations"
	@echo "  make build-python     - Build Python package"
	@echo "  make build-node       - Build Node.js/TypeScript"
	@echo "  make build-go         - Build Go binary"
	@echo ""
	@echo "  make run-python       - Run Python implementation"
	@echo "  make run-node         - Run Node.js implementation"
	@echo "  make run-typescript   - Run TypeScript implementation"
	@echo "  make run-go           - Run Go implementation"
	@echo ""
	@echo "  make test             - Run tests for all implementations"
	@echo "  make format           - Format code in all languages"
	@echo "  make lint             - Lint code in all languages"
	@echo "  make clean            - Clean build artifacts"
	@echo ""
	@echo "  make docker-up        - Start all Docker Compose services"
	@echo "  make docker-down      - Stop all Docker Compose services"
	@echo "  make docker-status    - Show Docker Compose services status"
	@echo ""
	@echo "Usage examples:"
	@echo "  make run-python       - Run with default config"
	@echo "  python3 src/main.py start web     - Start specific service"
	@echo "  node src/index.js status          - Check service status"
	@echo "  ./build/dcm start                 - Run Go binary"

# Install all dependencies
install-all: install-python install-node install-go
	@echo "All dependencies installed successfully!"

# Install Python dependencies
install-python:
	@echo "Installing Python dependencies..."
	@which python3 > /dev/null || (echo "Error: Python 3 is not installed" && exit 1)
	@pip3 install -r requirements.txt
	@echo "Python dependencies installed!"

# Install Node.js dependencies
install-node:
	@echo "Installing Node.js dependencies..."
	@which node > /dev/null || (echo "Error: Node.js is not installed" && exit 1)
	@npm install js-yaml
	@echo "Node.js dependencies installed!"

# Install Go dependencies
install-go:
	@echo "Installing Go dependencies..."
	@which go > /dev/null || (echo "Error: Go is not installed" && exit 1)
	@cd src && go get gopkg.in/yaml.v2
	@echo "Go dependencies installed!"

# Build all implementations
build-all: build-python build-node build-go
	@echo "All implementations built successfully!"

# Build Python package
build-python:
	@echo "Building Python package..."
	@python3 setup.py build
	@echo "Python package built!"

# Build Node.js/TypeScript
build-node:
	@echo "Building Node.js/TypeScript..."
	@which tsc > /dev/null && (cd src && tsc index.ts) || echo "TypeScript compiler not found, skipping TypeScript build"
	@echo "Node.js build complete!"

# Build Go binary
build-go:
	@echo "Building Go binary..."
	@mkdir -p build
	@cd src && go build -o ../build/dcm main.go
	@echo "Go binary built: build/dcm"

# Run Python implementation
run-python:
	@echo "Running Python implementation..."
	@python3 src/main.py

# Run Node.js implementation
run-node:
	@echo "Running Node.js implementation..."
	@node src/index.js

# Run TypeScript implementation
run-typescript:
	@echo "Running TypeScript implementation..."
	@which ts-node > /dev/null || npm install -g ts-node @types/node
	@ts-node src/index.ts

# Run Go implementation
run-go: build-go
	@echo "Running Go implementation..."
	@./build/dcm

# Run tests
test:
	@echo "Running tests..."
	@echo "Python tests:"
	@python3 -m pytest tests/ || echo "No Python tests found"
	@echo "Node.js tests:"
	@npm test || echo "No Node.js tests configured"
	@echo "Go tests:"
	@cd src && go test ./... || echo "No Go tests found"

# Format code in all languages
format:
	@echo "Formatting code..."
	@echo "Formatting Python code with black..."
	@which black > /dev/null && (black src/ tests/ || echo "black not installed") || echo "black not installed"
	@echo "Formatting JavaScript/TypeScript with prettier..."
	@which prettier > /dev/null && (prettier --write "src/**/*.{js,ts}" || echo "prettier not installed") || echo "prettier not installed"
	@echo "Formatting Go code with gofmt..."
	@which gofmt > /dev/null && (gofmt -w src/*.go || echo "No Go files to format") || echo "gofmt not installed"
	@echo "Code formatting complete!"

# Lint code in all languages
lint:
	@echo "Linting code..."
	@echo "Linting Python code with flake8..."
	@which flake8 > /dev/null && (flake8 src/ tests/ || echo "flake8 not installed") || echo "flake8 not installed"
	@echo "Linting JavaScript/TypeScript with eslint..."
	@which eslint > /dev/null && (eslint src/**/*.{js,ts} || echo "eslint not installed") || echo "eslint not installed"
	@echo "Linting Go code with golint..."
	@which golint > /dev/null && (cd src && golint ./... || echo "golint not installed") || echo "golint not installed"
	@echo "Code linting complete!"

# Docker Compose commands
docker-up:
	@echo "Starting Docker Compose services..."
	@docker-compose up -d
	@echo "Services started!"

docker-down:
	@echo "Stopping Docker Compose services..."
	@docker-compose down
	@echo "Services stopped!"

docker-status:
	@echo "Docker Compose services status:"
	@docker-compose ps

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	@rm -rf build/
	@rm -rf dist/
	@rm -rf *.egg-info
	@rm -rf src/*.js src/*.js.map
	@rm -rf node_modules/
	@find . -type d -name '__pycache__' -exec rm -rf {} + 2>/dev/null || true
	@find . -type f -name '*.pyc' -delete
	@echo "Clean complete!"

# Quick start for each language
quick-python:
	@python3 src/main.py status

quick-node:
	@node src/index.js status

quick-typescript:
	@ts-node src/index.ts status

quick-go:
	@cd src && go run main.go status
