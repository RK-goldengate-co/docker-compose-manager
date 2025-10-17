/**
 * Main Docker Compose Manager class for JavaScript implementation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ConfigManager = require('./config');
const DeploymentManager = require('./deployment');
const { HealthChecker, StatusMonitor } = require('./monitoring');
const {
  DockerComposeError,
  ConfigError,
  DeploymentError,
  MonitoringError,
  BackupError,
  ValidationError,
  EnvironmentError
} = require('./exceptions');
const { DockerUtils, ValidationUtils } = require('./utils');

class DockerComposeManager {
  constructor(configPath = 'dcm.config.yml', environment = null) {
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

  getComposeFile() {
    return this.currentEnvConfig.compose_file || 'docker-compose.yml';
  }

  getEnvFile() {
    return this.currentEnvConfig.env_file || null;
  }

  getBuildOptions() {
    return this.currentEnvConfig.build_options || [];
  }

  executeCommand(command, useEnvFile = false) {
    try {
      console.log(`Executing: ${command}`);

      // Set environment variables if env file is specified
      let env = process.env;
      if (useEnvFile && this.getEnvFile()) {
        const envFile = this.getEnvFile();
        if (fs.existsSync(envFile)) {
          const envFileContent = fs.readFileSync(envFile, 'utf8');
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

      const output = execSync(command, { encoding: 'utf8', env: env });
      console.log(output);
      return output;
    } catch (error) {
      console.error(`Error: ${error.message}`);
      return null;
    }
  }

  start(serviceName = null) {
    const composeFile = `-f ${this.getComposeFile()}`;
    const cmd = `docker-compose ${composeFile} up -d${serviceName ? ` ${serviceName}` : ''}`;
    console.log(`Starting services in ${this.environment} environment...`);
    return this.executeCommand(cmd, true);
  }

  stop(serviceName = null) {
    const composeFile = `-f ${this.getComposeFile()}`;
    const cmd = `docker-compose ${composeFile} stop${serviceName ? ` ${serviceName}` : ''}`;
    console.log(`Stopping services in ${this.environment} environment...`);
    return this.executeCommand(cmd);
  }

  restart(serviceName = null) {
    const composeFile = `-f ${this.getComposeFile()}`;
    const cmd = `docker-compose ${composeFile} restart${serviceName ? ` ${serviceName}` : ''}`;
    console.log(`Restarting services in ${this.environment} environment...`);
    return this.executeCommand(cmd);
  }

  status() {
    const composeFile = `-f ${this.getComposeFile()}`;
    console.log(`Checking service status in ${this.environment} environment...`);
    return this.executeCommand(`docker-compose ${composeFile} ps`);
  }

  logs(serviceName = null, follow = false) {
    const composeFile = `-f ${this.getComposeFile()}`;
    const followFlag = follow ? ' -f' : '';
    const cmd = `docker-compose ${composeFile} logs${followFlag}${serviceName ? ` ${serviceName}` : ''}`;
    console.log(`Fetching logs in ${this.environment} environment...`);
    return this.executeCommand(cmd);
  }

  remove(serviceName = null) {
    const composeFile = `-f ${this.getComposeFile()}`;
    const cmd = `docker-compose ${composeFile} rm -f${serviceName ? ` ${serviceName}` : ''}`;
    console.log(`Removing services in ${this.environment} environment...`);
    return this.executeCommand(cmd);
  }

  build(serviceName = null) {
    const composeFile = `-f ${this.getComposeFile()}`;
    const buildOptions = this.getBuildOptions().join(' ');
    const cmd = `docker-compose ${composeFile} build ${buildOptions}${serviceName ? ` ${serviceName}` : ''}`;
    console.log(`Building services in ${this.environment} environment...`);
    return this.executeCommand(cmd);
  }

  pull(serviceName = null) {
    const composeFile = `-f ${this.getComposeFile()}`;
    const cmd = `docker-compose ${composeFile} pull${serviceName ? ` ${serviceName}` : ''}`;
    console.log(`Pulling images in ${this.environment} environment...`);
    return this.executeCommand(cmd);
  }

  switchEnvironment(envName) {
    if (this.configManager.config.environments && this.configManager.config.environments[envName]) {
      this.environment = envName;
      this.currentEnvConfig = this.configManager.getEnvironmentConfig(envName);
      console.log(`Switched to ${envName} environment`);
    } else {
      const availableEnvs = Object.keys(this.configManager.config.environments || {});
      throw new EnvironmentError(`Environment '${envName}' not found. Available: ${availableEnvs.join(', ')}`);
    }
  }

  getAvailableEnvironments() {
    return Object.keys(this.configManager.config.environments || {});
  }

  getServiceStatusDetailed() {
    const composeFile = `-f ${this.getComposeFile()}`;
    try {
      const result = execSync(`docker-compose ${composeFile} ps --format json`, { encoding: 'utf8' });

      const services = [];
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
        services: services,
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

  checkServiceHealth(serviceName) {
    return this.healthChecker.checkServiceHealth(serviceName);
  }

  monitorServices(duration = null) {
    return this.statusMonitor.monitorServices(duration);
  }

  createBackup(backupName = null) {
    return this.deploymentManager.createBackup(backupName);
  }

  deploy(strategy = null) {
    return this.deploymentManager.deploy(strategy);
  }

  rollback(backupPath) {
    return this.deploymentManager.rollback(backupPath);
  }

  showConfig() {
    console.log("\n=== Current Configuration ===");
    console.log(`Config file: ${this.configPath}`);
    console.log(`Environment: ${this.environment}`);
    console.log("Configuration:");
    console.log(JSON.stringify(this.configManager.config, null, 2));
  }

  displayMenu() {
    console.log(`\n=== Docker Compose Manager (JavaScript) - Environment: ${this.environment} ===`);
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

module.exports = DockerComposeManager;
