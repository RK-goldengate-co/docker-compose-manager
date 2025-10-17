#!/usr/bin/env node

/**
 * Docker Compose Manager - JavaScript/Node.js Implementation
 * Main entry point using modular architecture.
 */

const DockerComposeManager = require('./implementations/javascript/manager');
const {
  DockerComposeError,
  EnvironmentError
} = require('./implementations/javascript/exceptions');

function main() {
  try {
    const manager = new DockerComposeManager();

    console.log('Docker Compose Manager - JavaScript Edition');
    console.log(`Config loaded from: ${manager.configPath}`);
    console.log(`Current environment: ${manager.environment}`);

    const args = process.argv.slice(2);

    if (args.length > 0) {
      const command = args[0].toLowerCase();

      try {
        switch (command) {
          case 'env':
            if (args.length > 1) {
              manager.switchEnvironment(args[1]);
            } else {
              console.log('Available environments:', manager.getAvailableEnvironments());
            }
            break;

          case 'start':
            manager.start(args[1] || null);
            break;

          case 'stop':
            manager.stop(args[1] || null);
            break;

          case 'restart':
            manager.restart(args[1] || null);
            break;

          case 'status':
            manager.status();
            break;

          case 'logs':
            manager.logs(args[1] || null);
            break;

          case 'remove':
            manager.remove(args[1] || null);
            break;

          case 'build':
            manager.build(args[1] || null);
            break;

          case 'pull':
            manager.pull(args[1] || null);
            break;

          case 'monitor':
            const duration = args[1] ? parseInt(args[1]) : null;
            manager.monitorServices(duration);
            break;

          case 'health':
            if (args[1]) {
              const health = manager.checkServiceHealth(args[1]);
              console.log(JSON.stringify(health, null, 2));
            } else {
              console.log('Usage: node index.js health <service_name>');
            }
            break;

          case 'deploy':
            manager.deploy(args[1] || null);
            break;

          case 'backup':
            manager.createBackup(args[1] || null);
            break;

          case 'rollback':
            if (args[1]) {
              manager.rollback(args[1]);
            } else {
              console.log('Usage: node index.js rollback <backup_path>');
            }
            break;

          case 'config':
            manager.showConfig();
            break;

          default:
            console.log('Unknown command. Available: start, stop, restart, status, logs, remove, build, pull, env, monitor, health, deploy, backup, rollback, config');
            console.log('Usage: node index.js <command> [service|environment|backup_path]');
        }
      } catch (error) {
        if (error instanceof EnvironmentError) {
          console.log(`Error: ${error.message}`);
        } else {
          console.log(`Error: ${error.message}`);
        }
      }
    } else {
      // Interactive mode
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      function showMenu() {
        manager.displayMenu();
        rl.question('Enter your choice: ', (choice) => {
          try {
            switch (choice.trim()) {
              case '1':
                manager.start();
                showMenu();
                break;
              case '2':
                manager.stop();
                showMenu();
                break;
              case '3':
                manager.restart();
                showMenu();
                break;
              case '4':
                manager.status();
                showMenu();
                break;
              case '5':
                manager.logs();
                showMenu();
                break;
              case '6':
                manager.remove();
                showMenu();
                break;
              case '7':
                manager.build();
                showMenu();
                break;
              case '8':
                manager.pull();
                showMenu();
                break;
              case '9':
                console.log('Available environments:', manager.getAvailableEnvironments());
                rl.question('Enter environment name: ', (env) => {
                  try {
                    manager.switchEnvironment(env.trim());
                  } catch (error) {
                    console.log(`Error: ${error.message}`);
                  }
                  showMenu();
                });
                break;
              case '10':
                rl.question('Enter monitoring duration in seconds (leave empty for continuous): ', (input) => {
                  const duration = input.trim() ? parseInt(input.trim()) : null;
                  manager.monitorServices(duration);
                  // Note: monitorServices will handle the continuous monitoring
                  // and exit when done or interrupted
                  setTimeout(() => showMenu(), 1000);
                });
                break;
              case '11':
                rl.question('Enter service name to check health: ', (service) => {
                  if (service.trim()) {
                    const health = manager.checkServiceHealth(service.trim());
                    console.log(JSON.stringify(health, null, 2));
                  } else {
                    console.log('Service name is required');
                  }
                  showMenu();
                });
                break;
              case '12':
                rl.question('Enter deployment strategy (recreate/rolling/blue-green) [recreate]: ', (input) => {
                  const strategy = input.trim() || 'recreate';
                  manager.deploy(strategy);
                  showMenu();
                });
                break;
              case '13':
                rl.question('Enter backup name (optional): ', (input) => {
                  const backupName = input.trim() || null;
                  manager.createBackup(backupName);
                  showMenu();
                });
                break;
              case '14':
                rl.question('Enter backup path to rollback to: ', (input) => {
                  const backupPath = input.trim();
                  if (backupPath) {
                    manager.rollback(backupPath);
                  } else {
                    console.log('Backup path is required');
                  }
                  showMenu();
                });
                break;
              case '15':
                manager.showConfig();
                showMenu();
                break;
              case '0':
                console.log('Goodbye!');
                rl.close();
                break;
              default:
                console.log('Invalid choice. Please try again.');
                showMenu();
            }
          } catch (error) {
            console.log(`Error: ${error.message}`);
            showMenu();
          }
        });
      }

      showMenu();
    }
  } catch (error) {
    if (error instanceof DockerComposeError) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    } else {
      console.error(`Unexpected error: ${error.message}`);
      process.exit(1);
    }
  }
}

// Run the main function
main();

module.exports = DockerComposeManager;
