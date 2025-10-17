#!/usr/bin/env python3
"""
Docker Compose Manager - Python Implementation
A tool to manage Docker Compose services
"""

import os
import sys
import subprocess
import yaml
from typing import Optional, Dict, List


class DockerComposeManager:
    """Docker Compose Manager for managing services."""
    
    def __init__(self, config_path: str = 'dcm.config.yml'):
        self.config_path = config_path
        self.config = self.load_config()
    
    def load_config(self) -> Dict:
        """Load configuration from YAML file."""
        if os.path.exists(self.config_path):
            try:
                with open(self.config_path, 'r') as f:
                    return yaml.safe_load(f) or {}
            except Exception as e:
                print(f"Error loading config: {e}")
        
        print("Config file not found, using defaults")
        return {'services': [], 'compose_file': 'docker-compose.yml'}
    
    def execute_command(self, command: str) -> Optional[str]:
        """Execute a shell command and return output."""
        try:
            print(f"Executing: {command}")
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                check=True
            )
            output = result.stdout
            if output:
                print(output)
            return output
        except subprocess.CalledProcessError as e:
            print(f"Error: {e}")
            if e.stderr:
                print(e.stderr)
            return None
    
    def start(self, service_name: Optional[str] = None) -> Optional[str]:
        """Start Docker Compose services."""
        cmd = f"docker-compose up -d {service_name}" if service_name else "docker-compose up -d"
        print("Starting services...")
        return self.execute_command(cmd)
    
    def stop(self, service_name: Optional[str] = None) -> Optional[str]:
        """Stop Docker Compose services."""
        cmd = f"docker-compose stop {service_name}" if service_name else "docker-compose stop"
        print("Stopping services...")
        return self.execute_command(cmd)
    
    def restart(self, service_name: Optional[str] = None) -> Optional[str]:
        """Restart Docker Compose services."""
        cmd = f"docker-compose restart {service_name}" if service_name else "docker-compose restart"
        print("Restarting services...")
        return self.execute_command(cmd)
    
    def status(self) -> Optional[str]:
        """Check status of Docker Compose services."""
        print("Checking service status...")
        return self.execute_command("docker-compose ps")
    
    def logs(self, service_name: Optional[str] = None, follow: bool = False) -> Optional[str]:
        """View logs from Docker Compose services."""
        follow_flag = "-f" if follow else ""
        cmd = f"docker-compose logs {follow_flag} {service_name}" if service_name else f"docker-compose logs {follow_flag}"
        print("Fetching logs...")
        return self.execute_command(cmd)
    
    def remove(self, service_name: Optional[str] = None) -> Optional[str]:
        """Remove Docker Compose services."""
        cmd = f"docker-compose rm -f {service_name}" if service_name else "docker-compose rm -f"
        print("Removing services...")
        return self.execute_command(cmd)
    
    def build(self, service_name: Optional[str] = None) -> Optional[str]:
        """Build Docker Compose services."""
        cmd = f"docker-compose build {service_name}" if service_name else "docker-compose build"
        print("Building services...")
        return self.execute_command(cmd)
    
    def pull(self, service_name: Optional[str] = None) -> Optional[str]:
        """Pull Docker images."""
        cmd = f"docker-compose pull {service_name}" if service_name else "docker-compose pull"
        print("Pulling images...")
        return self.execute_command(cmd)
    
    def display_menu(self):
        """Display interactive menu."""
        print("\n=== Docker Compose Manager (Python) ===")
        print("1. Start services")
        print("2. Stop services")
        print("3. Restart services")
        print("4. Check status")
        print("5. View logs")
        print("6. Remove services")
        print("7. Build services")
        print("8. Pull images")
        print("0. Exit")
        print("========================================\n")


def main():
    """Main entry point."""
    manager = DockerComposeManager()
    
    print("Docker Compose Manager - Python Edition")
    print(f"Config loaded from: {manager.config_path}")
    
    # Check for command line arguments
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        service = sys.argv[2] if len(sys.argv) > 2 else None
        
        if command == 'start':
            manager.start(service)
        elif command == 'stop':
            manager.stop(service)
        elif command == 'restart':
            manager.restart(service)
        elif command == 'status':
            manager.status()
        elif command == 'logs':
            manager.logs(service)
        elif command == 'remove':
            manager.remove(service)
        elif command == 'build':
            manager.build(service)
        elif command == 'pull':
            manager.pull(service)
        else:
            print("Unknown command. Available: start, stop, restart, status, logs, remove, build, pull")
    else:
        manager.display_menu()
        print("Usage: python3 main.py <command> [service]")
        print("Example: python3 main.py start web")


if __name__ == '__main__':
    main()
