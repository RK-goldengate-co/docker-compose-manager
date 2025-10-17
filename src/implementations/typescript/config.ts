/**
 * Configuration management for TypeScript implementation
 */

import * as fs from 'fs';
// Dynamic import for js-yaml to avoid type issues
const yaml = require('js-yaml');

export interface Config {
  project?: {
    name?: string;
    version?: string;
  };
  environments?: {
    [key: string]: {
      compose_file?: string;
      env_file?: string;
      auto_restart?: boolean;
      build_options?: string[];
      networks?: string[];
      healthcheck?: {
        enabled?: boolean;
        interval?: string;
        timeout?: string;
        retries?: number;
      };
    };
  };
  services?: string[];
  monitoring?: {
    enabled?: boolean;
    interval?: number;
    log_retention?: number;
    alerts?: {
      email?: {
        enabled?: boolean;
        recipients?: string[];
      };
      slack?: {
        enabled?: boolean;
        webhook_url?: string;
      };
    };
  };
  deployment?: {
    strategy?: string;
    max_surge?: number;
    max_unavailable?: number;
    rollback_on_failure?: boolean;
    pre_deploy_hooks?: string[];
    post_deploy_hooks?: string[];
  };
  backup?: {
    enabled?: boolean;
    schedule?: string;
    retention?: number;
    volumes?: string[];
    destination?: string;
  };
  logging?: {
    driver?: string;
    options?: { [key: string]: string };
    level?: string;
  };
  resources?: {
    default?: {
      memory?: string;
      cpus?: string;
    };
    limits?: {
      memory?: string;
      cpus?: string;
    };
  };
}

export class ConfigManager {
  configPath: string;
  config: Config;

  constructor(configPath: string = 'dcm.config.yml') {
    this.configPath = configPath;
    this.config = this.loadConfig();
  }

  loadConfig(): Config {
    try {
      if (fs.existsSync(this.configPath)) {
        const fileContents = fs.readFileSync(this.configPath, 'utf8');
        const yaml = require('js-yaml');
        const config = yaml.load(fileContents) as Config;
        // Merge with defaults
        return this.mergeDefaults(config);
      }
    } catch (e) {
      console.log('Config file not found, using defaults');
    }
    return this.getDefaults();
  }

  private getDefaults(): Config {
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

  private mergeDefaults(config: Config): Config {
    const defaults = this.getDefaults();

    // Deep merge the configuration
    for (const key in defaults) {
      if (!(key in config)) {
        (config as any)[key] = defaults[key as keyof Config];
      } else if (typeof defaults[key as keyof Config] === 'object' &&
                 typeof (config as any)[key] === 'object' &&
                 !Array.isArray(defaults[key as keyof Config])) {
        for (const subKey in defaults[key as keyof Config]) {
          if (!((config as any)[key] as any)[subKey]) {
            ((config as any)[key] as any)[subKey] = (defaults[key as keyof Config] as any)[subKey];
          }
        }
      }
    }

    return config;
  }

  validate(): { errors: string[], warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

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

  getEnvironmentConfig(environment: string): any {
    if (this.config.environments && this.config.environments[environment]) {
      return this.config.environments[environment];
    }
    return { compose_file: 'docker-compose.yml' };
  }

  getEnvironmentVariables(environment: string): { [key: string]: string } {
    const envVars: { [key: string]: string } = {};

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
        envVars[key] = process.env[key]!;
      }
    }

    return envVars;
  }

  expandVariables(text: string, environment: string): string {
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
