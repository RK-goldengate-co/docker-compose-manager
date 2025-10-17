"""
Custom exceptions for Docker Compose Manager.
"""


class DockerComposeError(Exception):
    """Base exception for Docker Compose Manager errors."""
    pass


class ConfigError(DockerComposeError):
    """Raised when there's an error with configuration loading or validation."""
    pass


class DeploymentError(DockerComposeError):
    """Raised when deployment operations fail."""
    pass


class MonitoringError(DockerComposeError):
    """Raised when monitoring operations fail."""
    pass


class BackupError(DockerComposeError):
    """Raised when backup/restore operations fail."""
    pass


class ValidationError(DockerComposeError):
    """Raised when configuration validation fails."""
    pass


class EnvironmentError(DockerComposeError):
    """Raised when environment-related operations fail."""
    pass
