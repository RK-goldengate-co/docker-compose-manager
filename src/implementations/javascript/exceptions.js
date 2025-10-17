/**
 * Custom exceptions for JavaScript implementation
 */

class DockerComposeError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DockerComposeError';
  }
}

class ConfigError extends DockerComposeError {
  constructor(message) {
    super(message);
    this.name = 'ConfigError';
  }
}

class DeploymentError extends DockerComposeError {
  constructor(message) {
    super(message);
    this.name = 'DeploymentError';
  }
}

class MonitoringError extends DockerComposeError {
  constructor(message) {
    super(message);
    this.name = 'MonitoringError';
  }
}

class BackupError extends DockerComposeError {
  constructor(message) {
    super(message);
    this.name = 'BackupError';
  }
}

class ValidationError extends DockerComposeError {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

class EnvironmentError extends DockerComposeError {
  constructor(message) {
    super(message);
    this.name = 'EnvironmentError';
  }
}

module.exports = {
  DockerComposeError,
  ConfigError,
  DeploymentError,
  MonitoringError,
  BackupError,
  ValidationError,
  EnvironmentError
};
