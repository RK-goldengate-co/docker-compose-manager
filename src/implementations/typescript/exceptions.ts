/**
 * Custom exceptions for TypeScript implementation
 */

export class DockerComposeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DockerComposeError';
  }
}

export class ConfigError extends DockerComposeError {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

export class DeploymentError extends DockerComposeError {
  constructor(message: string) {
    super(message);
    this.name = 'DeploymentError';
  }
}

export class MonitoringError extends DockerComposeError {
  constructor(message: string) {
    super(message);
    this.name = 'MonitoringError';
  }
}

export class BackupError extends DockerComposeError {
  constructor(message: string) {
    super(message);
    this.name = 'BackupError';
  }
}

export class ValidationError extends DockerComposeError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class EnvironmentError extends DockerComposeError {
  constructor(message: string) {
    super(message);
    this.name = 'EnvironmentError';
  }
}
