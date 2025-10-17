#!/usr/bin/env node

/**
 * Docker Compose Manager - JavaScript/Node.js Implementation
 * A tool to manage Docker Compose services
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

class DockerComposeManager {
  constructor(configPath = 'dcm.config.yml') {
    this.configPath = configPath;
    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const fileContents = fs.readFileSync(this.configPath, 'utf8');
        return yaml.load(fileContents);
      }
    } catch (e) {
      console.log('Config file not found, using defaults');
    }
    return { services: [], compose_file: 'docker-compose.yml' };
  }

  executeCommand(command) {
    try {
      console.log(`Executing: ${command}`);
      const output = execSync(command, { encoding: 'utf8' });
      console.log(output);
      return output;
    } catch (error) {
      console.error(`Error: ${error.message}`);
      return null;
    }
  }

  start(serviceName = null) {
    const cmd = serviceName 
      ? `docker-compose up -d ${serviceName}`
      : 'docker-compose up -d';
    console.log('Starting services...');
    return this.executeCommand(cmd);
  }

  stop(serviceName = null) {
    const cmd = serviceName 
      ? `docker-compose stop ${serviceName}`
      : 'docker-compose stop';
    console.log('Stopping services...');
    return this.executeCommand(cmd);
  }

  restart(serviceName = null) {
    const cmd = serviceName 
      ? `docker-compose restart ${serviceName}`
      : 'docker-compose restart';
    console.log('Restarting services...');
    return this.executeCommand(cmd);
  }

  status() {
    console.log('Checking service status...');
    return this.executeCommand('docker-compose ps');
  }

  logs(serviceName = null, follow = false) {
    const followFlag = follow ? '-f' : '';
    const cmd = serviceName 
      ? `docker-compose logs ${followFlag} ${serviceName}`
      : `docker-compose logs ${followFlag}`;
    console.log('Fetching logs...');
    return this.executeCommand(cmd);
  }

  remove(serviceName = null) {
    const cmd = serviceName 
      ? `docker-compose rm -f ${serviceName}`
      : 'docker-compose rm -f';
    console.log('Removing services...');
    return this.executeCommand(cmd);
  }

  displayMenu() {
    console.log('\n=== Docker Compose Manager (JavaScript) ===');
    console.log('1. Start services');
    console.log('2. Stop services');
    console.log('3. Restart services');
    console.log('4. Check status');
    console.log('5. View logs');
    console.log('6. Remove services');
    console.log('0. Exit');
    console.log('==========================================\n');
  }
}

function main() {
  const manager = new DockerComposeManager();
  
  console.log('Docker Compose Manager - JavaScript Edition');
  console.log('Config loaded from:', manager.configPath);
  
  // Check for command line arguments
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    const command = args[0];
    const service = args[1] || null;
    
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
      default:
        console.log('Unknown command. Available: start, stop, restart, status, logs, remove');
    }
  } else {
    manager.displayMenu();
    console.log('Usage: node index.js <command> [service]');
    console.log('Example: node index.js start web');
  }
}

if (require.main === module) {
  main();
}

module.exports = DockerComposeManager;
