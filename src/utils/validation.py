"""
Validation utilities for configuration and data.
"""

import os
import re
from typing import Dict, List, Any, Union


class ValidationUtils:
    """Utility functions for validation."""

    @staticmethod
    def validate_compose_file(file_path: str) -> Dict[str, Any]:
        """Validate a docker-compose file."""
        validation = {
            'valid': True,
            'errors': [],
            'warnings': []
        }

        if not os.path.exists(file_path):
            validation['valid'] = False
            validation['errors'].append(f"File does not exist: {file_path}")
            return validation

        try:
            import yaml
            with open(file_path, 'r') as f:
                compose_data = yaml.safe_load(f)

            if not compose_data:
                validation['warnings'].append("Empty or invalid YAML file")
                return validation

            if 'services' not in compose_data:
                validation['warnings'].append("No services defined in compose file")
            else:
                services = compose_data['services']
                if not isinstance(services, dict):
                    validation['valid'] = False
                    validation['errors'].append("services must be a dictionary")
                else:
                    for service_name, service_config in services.items():
                        service_validation = ValidationUtils._validate_service(service_name, service_config)
                        validation['errors'].extend(service_validation['errors'])
                        validation['warnings'].extend(service_validation['warnings'])

                        if service_validation['errors']:
                            validation['valid'] = False

        except Exception as e:
            validation['valid'] = False
            validation['errors'].append(f"Failed to parse compose file: {e}")

        return validation

    @staticmethod
    def _validate_service(service_name: str, service_config: Dict[str, Any]) -> Dict[str, List[str]]:
        """Validate a single service configuration."""
        errors = []
        warnings = []

        if not isinstance(service_config, dict):
            errors.append(f"Service '{service_name}' must be a dictionary")
            return {'errors': errors, 'warnings': warnings}

        # Check for image or build
        if 'image' not in service_config and 'build' not in service_config:
            warnings.append(f"Service '{service_name}' has no image or build specified")

        # Validate ports
        if 'ports' in service_config:
            ports = service_config['ports']
            if not isinstance(ports, list):
                errors.append(f"Service '{service_name}' ports must be a list")
            else:
                for port in ports:
                    if not ValidationUtils._validate_port(port):
                        errors.append(f"Service '{service_name}' has invalid port: {port}")

        # Validate environment variables
        if 'environment' in service_config:
            env = service_config['environment']
            if isinstance(env, dict):
                for key, value in env.items():
                    if not isinstance(key, str):
                        errors.append(f"Service '{service_name}' environment keys must be strings")

        return {'errors': errors, 'warnings': warnings}

    @staticmethod
    def _validate_port(port: Union[str, int]) -> bool:
        """Validate port configuration."""
        if isinstance(port, int):
            return 1 <= port <= 65535
        elif isinstance(port, str):
            # Handle port mappings like "8080:8080" or "8080"
            parts = port.split(':')
            for part in parts:
                try:
                    port_num = int(part)
                    if not 1 <= port_num <= 65535:
                        return False
                except ValueError:
                    return False
            return True
        return False

    @staticmethod
    def validate_environment_name(env_name: str) -> bool:
        """Validate environment name."""
        if not env_name or not isinstance(env_name, str):
            return False

        # Environment names should contain only alphanumeric characters, hyphens, and underscores
        return bool(re.match(r'^[a-zA-Z0-9_-]+$', env_name))

    @staticmethod
    def validate_file_path(file_path: str) -> bool:
        """Validate file path."""
        if not file_path or not isinstance(file_path, str):
            return False

        # Basic path validation - check for dangerous characters
        dangerous_chars = ['..', '|', '&', ';', '$', '>', '<', '`']
        return not any(char in file_path for char in dangerous_chars)
