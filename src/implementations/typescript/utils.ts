/**
 * Utilities for TypeScript implementation
 */

import { execSync } from 'child_process';
import * as fs from 'fs';

export class DockerUtils {
  static getContainerInfo(containerName: string): any {
    try {
      const result = execSync(`docker inspect ${containerName}`, { encoding: 'utf8' });
      const containers = JSON.parse(result);
      return containers.length > 0 ? containers[0] : null;
    } catch (e) {
      return null;
    }
  }

  static getContainersByService(serviceName: string): any[] {
    try {
      const { execSync } = require('child_process');
      const result = execSync(
        `docker ps --filter name=${serviceName} --format json`,
        { encoding: 'utf8' }
      );

      const containers: any[] = [];
      const lines = result.trim().split('\n');
      for (const line of lines) {
        if (line) {
          try {
            containers.push(JSON.parse(line));
          } catch (e) {
            // Skip invalid JSON lines
          }
        }
      }

      return containers;
    } catch (e) {
      return [];
    }
  }

  static getServiceLogs(serviceName: string, lines: number = 100, follow: boolean = false): string | null {
    try {
      let cmd = `docker-compose logs --tail ${lines}`;
      if (follow) {
        cmd += ' -f';
      }
      cmd += ` ${serviceName}`;

      const result = execSync(cmd, { encoding: 'utf8' });
      return result;
    } catch (e) {
      return null;
    }
  }

  static cleanupContainers(serviceName: string | null = null): boolean {
    try {
      let cmd;
      if (serviceName) {
        cmd = `docker-compose rm -f ${serviceName}`;
      } else {
        cmd = 'docker-compose down --remove-orphans';
      }

      execSync(cmd, { encoding: 'utf8' });
      return true;
    } catch (e) {
      return false;
    }
  }
}

export class ValidationUtils {
  static validateComposeFile(filePath: string): { valid: boolean, errors: string[], warnings: string[] } {
    const validation = {
      valid: true,
      errors: [] as string[],
      warnings: [] as string[]
    };

    if (!fs.existsSync(filePath)) {
      validation.valid = false;
      validation.errors.push(`File does not exist: ${filePath}`);
      return validation;
    }

    try {
      const yaml = require('js-yaml');
      const composeData = yaml.load(fs.readFileSync(filePath, 'utf8')) as any;

      if (!composeData) {
        validation.warnings.push("Empty or invalid YAML file");
        return validation;
      }

      if (!composeData.services) {
        validation.warnings.push("No services defined in compose file");
      } else {
        const services = composeData.services as { [key: string]: any };
        if (typeof services !== 'object') {
          validation.valid = false;
          validation.errors.push("services must be an object");
        } else {
          for (const serviceName in services) {
            const serviceValidation = this.validateService(serviceName, services[serviceName]);
            validation.errors.push(...serviceValidation.errors);
            validation.warnings.push(...serviceValidation.warnings);

            if (serviceValidation.errors.length > 0) {
              validation.valid = false;
            }
          }
        }
      }
    } catch (e: any) {
      validation.valid = false;
      validation.errors.push(`Failed to parse compose file: ${e.message}`);
    }

    return validation;
  }

  static validateService(serviceName: string, serviceConfig: any): { errors: string[], warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (typeof serviceConfig !== 'object') {
      errors.push(`Service '${serviceName}' must be an object`);
      return { errors, warnings };
    }

    // Check for image or build
    if (!serviceConfig.image && !serviceConfig.build) {
      warnings.push(`Service '${serviceName}' has no image or build specified`);
    }

    // Validate ports
    if (serviceConfig.ports) {
      const ports = serviceConfig.ports;
      if (!Array.isArray(ports)) {
        errors.push(`Service '${serviceName}' ports must be an array`);
      } else {
        for (const port of ports) {
          if (!this.validatePort(port)) {
            errors.push(`Service '${serviceName}' has invalid port: ${port}`);
          }
        }
      }
    }

    return { errors, warnings };
  }

  static validatePort(port: any): boolean {
    if (typeof port === 'number') {
      return port >= 1 && port <= 65535;
    } else if (typeof port === 'string') {
      // Handle port mappings like "8080:8080" or "8080"
      const parts = port.split(':');
      for (const part of parts) {
        const portNum = parseInt(part);
        if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
          return false;
        }
      }
      return true;
    }
    return false;
  }

  static validateEnvironmentName(envName: string): boolean {
    if (!envName || typeof envName !== 'string') {
      return false;
    }

    // Environment names should contain only alphanumeric characters, hyphens, and underscores
    return /^[a-zA-Z0-9_-]+$/.test(envName);
  }

  static validateFilePath(filePath: string): boolean {
    if (!filePath || typeof filePath !== 'string') {
      return false;
    }

    // Basic path validation - check for dangerous characters
    const dangerousChars = ['..', '|', '&', ';', '$', '>', '<', '`'];
    return !dangerousChars.some(char => filePath.includes(char));
  }
}
