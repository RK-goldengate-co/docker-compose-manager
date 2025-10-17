"""
Configuration management module for Docker Compose Manager.
Handles loading, validation, and environment variable expansion.
"""

import os
import yaml
from typing import Dict, List, Any, Optional
from .exceptions import ConfigError, ValidationError


class ConfigManager:
    """Manages configuration loading, validation, and environment variable handling."""

    def __init__(self, config_path: str = 'dcm.config.yml'):
        self.config_path = config_path
        self.config: Dict[str, Any] = {}
        self.load_config()

    def load_config(self) -> None:
        """Load configuration from YAML file."""
        if os.path.exists(self.config_path):
            try:
                with open(self.config_path, 'r', encoding='utf-8') as f:
                    loaded_config = yaml.safe_load(f) or {}
                    self.config = self._merge_with_defaults(loaded_config)
            except Exception as e:
                raise ConfigError(f"Failed to load config from {self.config_path}: {e}")
        else:
            self.config = self._get_defaults()

    def _get_defaults(self) -> Dict[str, Any]:
        """Get default configuration structure."""
        return {
            'project': {
                'name': 'docker-compose-manager',
                'version': '1.0.0'
            },
            'environments': {
                'dev': {
                    'compose_file': 'docker-compose.yml'
                }
            },
            'services': [],
            'monitoring': {
                'enabled': False,
                'interval': 60
            },
            'deployment': {
                'strategy': 'recreate',
                'rollback_on_failure': True,
                'max_surge': 1,
                'max_unavailable': 0
            },
            'backup': {
                'enabled': False,
                'destination': './backups',
                'retention': 30
            },
            'logging': {
                'level': 'info',
                'file': None
            }
        }

    def _merge_with_defaults(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Deep merge configuration with defaults."""
        defaults = self._get_defaults()

        # Deep merge the configuration
        for key, value in defaults.items():
            if key not in config:
                config[key] = value
            elif isinstance(value, dict) and isinstance(config[key], dict):
                for sub_key, sub_value in value.items():
                    if sub_key not in config[key]:
                        config[key][sub_key] = sub_value

        return config

    def validate(self) -> Dict[str, List[str]]:
        """Validate configuration and return errors/warnings."""
        errors = []
        warnings = []

        # Validate environments
        if 'environments' not in self.config:
            warnings.append("No environments defined in config")
        else:
            environments = self.config['environments']
            if not isinstance(environments, dict):
                errors.append("environments must be a dictionary")
            else:
                for env_name, env_config in environments.items():
                    env_errors = self._validate_environment(env_name, env_config)
                    errors.extend(env_errors)

        # Validate deployment config
        if 'deployment' in self.config:
            deployment = self.config['deployment']
            if not isinstance(deployment, dict):
                errors.append("deployment must be a dictionary")
            else:
                strategy = deployment.get('strategy', 'recreate')
                if strategy not in ['recreate', 'rolling', 'blue-green']:
                    warnings.append(f"Unknown deployment strategy '{strategy}'")

        # Validate monitoring config
        if 'monitoring' in self.config:
            monitoring = self.config['monitoring']
            if not isinstance(monitoring, dict):
                errors.append("monitoring must be a dictionary")
            else:
                if 'enabled' in monitoring and not isinstance(monitoring['enabled'], bool):
                    errors.append("monitoring.enabled must be a boolean")

                if 'interval' in monitoring:
                    interval = monitoring['interval']
                    if not isinstance(interval, int) or interval <= 0:
                        errors.append("monitoring.interval must be a positive integer")

        return {'errors': errors, 'warnings': warnings}

    def _validate_environment(self, env_name: str, env_config: Dict[str, Any]) -> List[str]:
        """Validate a specific environment configuration."""
        errors = []

        if not isinstance(env_config, dict):
            return [f"Environment '{env_name}' must be a dictionary"]

        # Validate compose_file
        if 'compose_file' not in env_config:
            pass  # This is optional, defaults will be used
        elif not isinstance(env_config['compose_file'], str):
            errors.append(f"Environment '{env_name}' compose_file must be a string")

        # Validate build_options
        if 'build_options' in env_config:
            if not isinstance(env_config['build_options'], list):
                errors.append(f"Environment '{env_name}' build_options must be a list")
            else:
                for option in env_config['build_options']:
                    if not isinstance(option, str):
                        errors.append(f"Environment '{env_name}' build_options must contain strings")
                        break

        return errors

    def get_environment_config(self, environment: str) -> Dict[str, Any]:
        """Get configuration for a specific environment."""
        if 'environments' in self.config and environment in self.config['environments']:
            return self.config['environments'][environment]
        return {'compose_file': 'docker-compose.yml'}

    def get_environment_variables(self, environment: str) -> Dict[str, str]:
        """Get environment variables for a specific environment."""
        env_vars = {}

        # Load from environment file if exists
        env_config = self.get_environment_config(environment)
        env_file = env_config.get('env_file')
        if env_file and os.path.exists(env_file):
            try:
                with open(env_file, 'r', encoding='utf-8') as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith('#') and '=' in line:
                            key, value = line.split('=', 1)
                            env_vars[key] = value
            except Exception as e:
                print(f"Warning: Could not read environment file {env_file}: {e}")

        # Override with system environment variables
        for key, value in os.environ.items():
            if key.startswith('DCM_') or key in ['DOCKER_HOST', 'COMPOSE_PROJECT_NAME']:
                env_vars[key] = value

        return env_vars

    def expand_variables(self, text: str, environment: str) -> str:
        """Expand environment variables in text."""
        env_vars = self.get_environment_variables(environment)

        # Simple variable expansion ${VAR} or $VAR
        for key, value in env_vars.items():
            text = text.replace(f"${{{key}}}", value)
            text = text.replace(f"${key}", value)

        return text


class ConfigError(Exception):
    """Raised when there's an error with configuration."""
    pass


class ValidationError(Exception):
    """Raised when configuration validation fails."""
    pass
