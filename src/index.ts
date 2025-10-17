#!/usr/bin/env ts-node

/**
 * Docker Compose Manager - TypeScript Implementation
 * A strongly-typed tool to manage Docker Compose services
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as yaml from 'js-yaml';

interface Config {
  services?: string[];
  compose_file?: string;
}

class DockerComposeManager {
  private configPath: string;
  private config: Config;

  constructor(configPath: string = 'dcm.config.yml') {
    this.configPath = configPath;
    this.config = this.loadConfig();
  }

  private loadConfig(): Config {
    try {
      if (fs.existsSync(this.configPath)) {
        const fileContents = fs.readFileSync(this.configPath, 'utf8');
        return yaml.load(fileContents) as Config;
      }
    } catch (e) {
      console.log('Config file not found, using defaults');
    }
    return { services: [], compose_file: 'docker-compose.yml' };
  }

  private executeCommand(command: string): string | null {
    try {
      console.log(`Executing: ${command}`);
      const output = execSync(command, { encoding: 'utf8' });
      console.log(output);
      return output;
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
      return null;
    }
  }

  public start(serviceName?: string): string | null {
    const cmd = serviceName 
      ? `docker-compose up -d ${serviceName}`
      : 'docker-compose up -d';
    console.log('Starting services...');
    return this.executeCommand(cmd);
  }

  public stop(serviceName?: string): string | null {
    const cmd = serviceName 
      ? `docker-compose stop ${serviceName}`
      : 'docker-compose stop';
    console.log('Stopping services...');
    return this.executeCommand(cmd);
  }

  public restart(serviceName?: string): string | null {
    const cmd = serviceName 
      ? `docker-compose restart ${serviceName}`
      : 'docker-compose restart';
    console.log('Restarting services...');
    return this.executeCommand(cmd);
  }

  public status(): string | null {
    console.log('Checking service status...');
    return this.executeCommand('docker-compose ps');
  }

  public logs(serviceName?: string, follow: boolean = false): string | null {
    const followFlag = follow ? '-f' : '';
    const cmd = serviceName 
      ? `docker-compose logs ${followFlag} ${serviceName}`
      : `docker-compose logs ${followFlag}`;
    console.log('Fetching logs...');
    return this.executeCommand(cmd);
  }

  public remove(serviceName?: string): string | null {
    const cmd = serviceName 
      ? `docker-compose rm -f ${serviceName}`
      : 'docker-compose rm -f';
    console.log('Removing services...');
    return this.executeCommand(cmd);
  }

  public build(serviceName?: string): string | null {
    const cmd = serviceName 
      ? `docker-compose build ${serviceName}`
      : 'docker-compose build';
    console.log('Building services...');
    return this.executeCommand(cmd);
  }

  public pull(serviceName?: string): string | null {
    const cmd = serviceName 
      ? `docker-compose pull ${serviceName}`
      : 'docker-compose pull';
    console.log('Pulling images...');
    return this.executeCommand(cmd);
  }

  public displayMenu(): void {
    console.log('\n=== Docker Compose Manager (TypeScript) ===');
    console.log('1. Start services');
    console.log('2. Stop services');
    console.log('3. Restart services');
    console.log('4. Check status');
    console.log('5. View logs');
    console.log('6. Remove services');
    console.log('7. Build services');
    console.log('8. Pull images');
    console.log('0. Exit');
    console.log('===========================================\n');
  }
}

function main(): void {
  const manager = new DockerComposeManager();
  
  console.log('Docker Compose Manager - TypeScript Edition');
  console.log('Config loaded from:', manager['configPath']);
  
  // Check for command line arguments
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    const command = args[0];
    const service = args[1] || undefined;
    
    switch(command) {
      case 'start':
        manager.start(service);
        break;
      case 'stop':
        manager.stop(service);
        break;
      case 'restart':
        manager.restart(service);
        break;
      case 'status':
        manager.status();
        break;
      case 'logs':
        manager.logs(service);
        break;
      case 'remove':
        manager.remove(service);
        break;
      case 'build':
        manager.build(service);
        break;
      case 'pull':
        manager.pull(service);
        break;
      default:
        console.log('Unknown command. Available: start, stop, restart, status, logs, remove, build, pull');
    }
  } else {
    manager.displayMenu();
    console.log('Usage: ts-node index.ts <command> [service]');
    console.log('Example: ts-node index.ts start web');
  }
}

if (require.main === module) {
  main();
}

export default DockerComposeManager;
