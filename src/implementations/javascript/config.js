/**
 * Configuration management for JavaScript implementation
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

class ConfigManager {
  constructor(configPath = 'dcm.config.yml') {
    this.configPath = configPath;
    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const fileContents = fs.readFileSync(this.configPath, 'utf8');
        const config = yaml.load(fileContents);
        // Merge with defaults
        return this._mergeDefaults(config);
      }
    } catch (e) {
      console.log('Config file not found, using defaults');
    }
    return this._getDefaults();
  }

  _getDefaults() {
    return {
      project: { name: 'docker-compose-manager', version: '1.0.0' },
      environments: {
        dev: { compose_file: 'docker-compose.yml' }
      },
      services: [],
      monitoring: { enabled: false, interval: 60 },
      deployment: { strategy: 'recreate', rollback_on_failure: true },
      backup: { enabled: false, destination: './backups' },
      logging: { level: 'info' }
    };
  }

  _mergeDefaults(config) {
    const defaults = this._getDefaults();

    // Deep merge the configuration
    for (const key in defaults) {
      if (!(key in config)) {
        config[key] = defaults[key];
      } else if (typeof defaults[key] === 'object' && typeof config[key] === 'object' && !Array.isArray(defaults[key])) {
        for (const subKey in defaults[key]) {
          if (!(subKey in config[key])) {
            config[key][subKey] = defaults[key][subKey];
          }
        }
      }
    }

    return config;
  }

  validate() {
    const errors = [];
    const warnings = [];

    // Validate environments
    if (!this.config.environments) {
      warnings.push("No environments defined in config");
    } else {
      const environments = this.config.environments;
      if (typeof environments !== 'object') {
        errors.push("environments must be an object");
      } else {
        for (const envName in environments) {
          const envConfig = environments[envName];
          if (typeof envConfig !== 'object') {
            errors.push(`Environment '${envName}' must be an object`);
            continue;
          }

          // Validate compose_file
          if (envConfig.compose_file && typeof envConfig.compose_file !== 'string') {
            errors.push(`Environment '${envName}' compose_file must be a string`);
          }

          // Validate build_options
          if (envConfig.build_options && !Array.isArray(envConfig.build_options)) {
            errors.push(`Environment '${envName}' build_options must be an array`);
          }
        }
      }
    }

    // Validate deployment config
    if (this.config.deployment) {
      const deployment = this.config.deployment;
      if (typeof deployment !== 'object') {
        errors.push("deployment must be an object");
      } else {
        const strategy = deployment.strategy || 'recreate';
        if (!['recreate', 'rolling', 'blue-green'].includes(strategy)) {
          warnings.push(`Unknown deployment strategy '${strategy}'`);
        }
      }
    }

    return { errors, warnings };
  }

  getEnvironmentConfig(environment) {
    if (this.config.environments && this.config.environments[environment]) {
      return this.config.environments[environment];
    }
    return { compose_file: 'docker-compose.yml' };
  }

  getEnvironmentVariables(environment) {
    const envVars = {};

    // Load from environment file if exists
    const envConfig = this.getEnvironmentConfig(environment);
    const envFile = envConfig.env_file;
    if (envFile && fs.existsSync(envFile)) {
      try {
        const envFileContent = fs.readFileSync(envFile, 'utf8');
        const lines = envFileContent.split('\n');
        lines.forEach(line => {
          const trimmedLine = line.trim();
          if (trimmedLine && !trimmedLine.startsWith('#') && trimmedLine.includes('=')) {
            const [key, ...valueParts] = trimmedLine.split('=');
            envVars[key] = valueParts.join('=');
          }
        });
      } catch (e) {
        console.log(`Warning: Could not read environment file ${envFile}: ${e.message}`);
      }
    }

    // Override with system environment variables
    for (const key in process.env) {
      if (key.startsWith('DCM_') || ['DOCKER_HOST', 'COMPOSE_PROJECT_NAME'].includes(key)) {
        envVars[key] = process.env[key];
      }
    }

    return envVars;
  }

  expandVariables(text, environment) {
    const envVars = this.getEnvironmentVariables(environment);

    // Simple variable expansion ${VAR} or $VAR
    for (const key in envVars) {
      const value = envVars[key];
      text = text.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value);
      text = text.replace(new RegExp(`\\$${key}`, 'g'), value);
    }

    return text;
  }
}

module.exports = ConfigManager;
