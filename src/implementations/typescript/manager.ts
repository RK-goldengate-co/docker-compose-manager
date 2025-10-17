/**
 * Main Docker Compose Manager class for TypeScript implementation
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import { ConfigManager, Config } from './config';
import { DeploymentManager } from './deployment';
import { HealthChecker, StatusMonitor } from './monitoring';
import {
  DockerComposeError,
  ConfigError,
  EnvironmentError
} from './exceptions';
import { DockerUtils, ValidationUtils } from './utils';

export class DockerComposeManager {
  configPath: string;
  environment: string;
  configManager: ConfigManager;
  currentEnvConfig: any;

  // Sub-managers
  deploymentManager: DeploymentManager;
  healthChecker: HealthChecker;
  statusMonitor: StatusMonitor;

  constructor(configPath: string = 'dcm.config.yml', environment: string | null = null) {
    this.configPath = configPath;
    this.environment = environment || process.env.DCM_ENV || 'dev';
    this.configManager = new ConfigManager(configPath);
    this.currentEnvConfig = this.configManager.getEnvironmentConfig(this.environment);

    // Initialize sub-managers
    this.deploymentManager = new DeploymentManager(this.configManager, this);
    this.healthChecker = new HealthChecker(this);
    this.statusMonitor = new StatusMonitor(this, this.configManager);

    // Validate configuration
    const validation = this.configManager.validate();
    if (validation.errors.length > 0) {
      throw new ConfigError(`Configuration errors: ${validation.errors.join(', ')}`);
    }

    if (validation.warnings.length > 0) {
      console.log(`Configuration warnings: ${validation.warnings.join(', ')}`);
    }
  }

  getComposeFile(): string {
    return this.currentEnvConfig.compose_file || 'docker-compose.yml';
  }

  getEnvFile(): string | null {
    return this.currentEnvConfig.env_file || null;
  }

  getBuildOptions(): string[] {
    return this.currentEnvConfig.build_options || [];
  }

  executeCommand(command: string, useEnvFile: boolean = false): string | null {
    try {
      console.log(`Executing: ${command}`);

      // Set environment variables if env file is specified
      let env = process.env;
      if (useEnvFile && this.getEnvFile()) {
        const envFile = this.getEnvFile();
        if (fs.existsSync(envFile!)) {
          const envFileContent = fs.readFileSync(envFile!, 'utf8');
          const lines = envFileContent.split('\n');
          lines.forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('#') && trimmedLine.includes('=')) {
              const [key, ...valueParts] = trimmedLine.split('=');
              env[key] = valueParts.join('=');
            }
          });
        }
      }

      const output = execSync(command, { encoding: 'utf8', env: env as { [key: string]: string } });
      console.log(output);
      return output;
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
      return null;
    }
  }

  start(serviceName: string | null = null): string | null {
    const composeFile = `-f ${this.getComposeFile()}`;
    const cmd = `docker-compose ${composeFile} up -d${serviceName ? ` ${serviceName}` : ''}`;
    console.log(`Starting services in ${this.environment} environment...`);
    return this.executeCommand(cmd, true);
  }

  stop(serviceName: string | null = null): string | null {
    const composeFile = `-f ${this.getComposeFile()}`;
    const cmd = `docker-compose ${composeFile} stop${serviceName ? ` ${serviceName}` : ''}`;
    console.log(`Stopping services in ${this.environment} environment...`);
    return this.executeCommand(cmd);
  }

  restart(serviceName: string | null = null): string | null {
    const composeFile = `-f ${this.getComposeFile()}`;
    const cmd = `docker-compose ${composeFile} restart${serviceName ? ` ${serviceName}` : ''}`;
    console.log(`Restarting services in ${this.environment} environment...`);
    return this.executeCommand(cmd);
  }

  status(): string | null {
    const composeFile = `-f ${this.getComposeFile()}`;
    console.log(`Checking service status in ${this.environment} environment...`);
    return this.executeCommand(`docker-compose ${composeFile} ps`);
  }

  logs(serviceName: string | null = null, follow: boolean = false): string | null {
    const composeFile = `-f ${this.getComposeFile()}`;
    const followFlag = follow ? ' -f' : '';
    const cmd = `docker-compose ${composeFile} logs${followFlag}${serviceName ? ` ${serviceName}` : ''}`;
    console.log(`Fetching logs in ${this.environment} environment...`);
    return this.executeCommand(cmd);
  }

  remove(serviceName: string | null = null): string | null {
    const composeFile = `-f ${this.getComposeFile()}`;
    const cmd = `docker-compose ${composeFile} rm -f${serviceName ? ` ${serviceName}` : ''}`;
    console.log(`Removing services in ${this.environment} environment...`);
    return this.executeCommand(cmd);
  }

  build(serviceName: string | null = null): string | null {
    const composeFile = `-f ${this.getComposeFile()}`;
    const buildOptions = this.getBuildOptions().join(' ');
    const cmd = `docker-compose ${composeFile} build ${buildOptions}${serviceName ? ` ${serviceName}` : ''}`;
    console.log(`Building services in ${this.environment} environment...`);
    return this.executeCommand(cmd);
  }

  pull(serviceName: string | null = null): string | null {
    const composeFile = `-f ${this.getComposeFile()}`;
    const cmd = `docker-compose ${composeFile} pull${serviceName ? ` ${serviceName}` : ''}`;
    console.log(`Pulling images in ${this.environment} environment...`);
    return this.executeCommand(cmd);
  }

  switchEnvironment(envName: string): void {
    if (this.configManager.config.environments && this.configManager.config.environments[envName]) {
      this.environment = envName;
      this.currentEnvConfig = this.configManager.getEnvironmentConfig(envName);
      console.log(`Switched to ${envName} environment`);
    } else {
      const availableEnvs = Object.keys(this.configManager.config.environments || {});
      throw new EnvironmentError(`Environment '${envName}' not found. Available: ${availableEnvs.join(', ')}`);
    }
  }

  getAvailableEnvironments(): string[] {
    return Object.keys(this.configManager.config.environments || {});
  }

  getServiceStatusDetailed(): { services: any[], timestamp: string, error?: string } {
    const composeFile = `-f ${this.getComposeFile()}`;
    try {
      const result = execSync(`docker-compose ${composeFile} ps --format json`, { encoding: 'utf8' });

      const services: any[] = [];
      const lines = result.trim().split('\n');
      for (const line of lines) {
        if (line) {
          try {
            const serviceInfo = JSON.parse(line);
            services.push({
              name: serviceInfo.Name || 'Unknown',
              state: serviceInfo.State || 'Unknown',
              status: serviceInfo.Status || '',
              ports: serviceInfo.Ports || '',
              created: serviceInfo.CreatedAt || ''
            });
          } catch (e) {
            // Skip invalid JSON lines
          }
        }
      }

      return {
        services,
        timestamp: new Date().toISOString()
      };
    } catch (e) {
      return {
        services: [],
        timestamp: new Date().toISOString(),
        error: 'Failed to get service status'
      };
    }
  }

  checkServiceHealth(serviceName: string): any {
    return this.healthChecker.checkServiceHealth(serviceName);
  }

  monitorServices(duration: number | null = null): void {
    return this.statusMonitor.monitorServices(duration);
  }

  createBackup(backupName: string | null = null): string {
    return this.deploymentManager.createBackup(backupName);
  }

  deploy(strategy: string | null = null): boolean {
    return this.deploymentManager.deploy(strategy);
  }

  rollback(backupPath: string): boolean {
    return this.deploymentManager.rollback(backupPath);
  }

  showConfig(): void {
    console.log("\n=== Current Configuration ===");
    console.log(`Config file: ${this.configPath}`);
    console.log(`Environment: ${this.environment}`);
    console.log("Configuration:");
    console.log(JSON.stringify(this.configManager.config, null, 2));
  }

  displayMenu(): void {
    console.log(`\n=== Docker Compose Manager (TypeScript) - Environment: ${this.environment} ===`);
    console.log('1. Start services');
    console.log('2. Stop services');
    console.log('3. Restart services');
    console.log('4. Check status');
    console.log('5. View logs');
    console.log('6. Remove services');
    console.log('7. Build services');
    console.log('8. Pull images');
    console.log('9. Switch environment');
    console.log('10. Monitor services');
    console.log('11. Check service health');
    console.log('12. Deploy services');
    console.log('13. Create backup');
    console.log('14. Rollback deployment');
    console.log('15. Show configuration');
    console.log('0. Exit');
    console.log('='.repeat(50));
    console.log(`Current environment: ${this.environment}`);
    console.log(`Compose file: ${this.getComposeFile()}`);
    if (this.getEnvFile()) {
      console.log(`Environment file: ${this.getEnvFile()}`);
    }
    console.log('='.repeat(50));
  }
}
