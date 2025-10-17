"""
Docker utilities for common operations.
"""

import subprocess
import json
from typing import Dict, List, Any, Optional


class DockerUtils:
    """Utility functions for Docker operations."""

    @staticmethod
    def get_container_info(container_name: str) -> Optional[Dict[str, Any]]:
        """Get detailed information about a Docker container."""
        try:
            result = subprocess.run(
                f"docker inspect {container_name}",
                shell=True,
                capture_output=True,
                text=True,
                check=True
            )

            containers = json.loads(result.stdout)
            if containers:
                return containers[0]
            return None

        except (subprocess.CalledProcessError, json.JSONDecodeError):
            return None

    @staticmethod
    def get_containers_by_service(service_name: str) -> List[Dict[str, Any]]:
        """Get all containers for a specific service."""
        try:
            result = subprocess.run(
                f"docker ps --filter name={service_name} --format json",
                shell=True,
                capture_output=True,
                text=True,
                check=True
            )

            containers = []
            for line in result.stdout.strip().split('\n'):
                if line:
                    try:
                        container_info = json.loads(line)
                        containers.append(container_info)
                    except json.JSONDecodeError:
                        continue

            return containers

        except subprocess.CalledProcessError:
            return []

    @staticmethod
    def get_service_logs(service_name: str, lines: int = 100, follow: bool = False) -> Optional[str]:
        """Get logs for a specific service."""
        try:
            cmd = f"docker-compose logs --tail {lines}"
            if follow:
                cmd += " -f"
            cmd += f" {service_name}"

            result = subprocess.run(
                cmd,
                shell=True,
                capture_output=True,
                text=True,
                check=True
            )

            return result.stdout

        except subprocess.CalledProcessError:
            return None

    @staticmethod
    def cleanup_containers(service_name: Optional[str] = None) -> bool:
        """Clean up Docker containers."""
        try:
            if service_name:
                cmd = f"docker-compose rm -f {service_name}"
            else:
                cmd = "docker-compose down --remove-orphans"

            result = subprocess.run(
                cmd,
                shell=True,
                capture_output=True,
                text=True,
                check=True
            )

            return True

        except subprocess.CalledProcessError:
            return False
