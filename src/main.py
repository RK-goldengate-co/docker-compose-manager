#!/usr/bin/env python3
"""
Docker Compose Manager - Python Implementation
Main entry point using modular architecture.
"""

import os
import sys
import json

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from core.manager import DockerComposeManager
from core.exceptions import DockerComposeError, EnvironmentError


def main():
    """Main entry point."""
    try:
        manager = DockerComposeManager()

        print("Docker Compose Manager - Python Edition")
        print(f"Config loaded from: {manager.config_manager.config_path}")
        print(f"Current environment: {manager.environment}")

        # Check for command line arguments
        if len(sys.argv) > 1:
            command = sys.argv[1].lower()

            if command == 'env':
                if len(sys.argv) > 2:
                    try:
                        manager.switch_environment(sys.argv[2])
                    except EnvironmentError as e:
                        print(f"Error: {e}")
                else:
                    print("Available environments:", list(manager.config_manager.config.get('environments', {}).keys()))
            elif command == 'start':
                service = sys.argv[2] if len(sys.argv) > 2 else None
                manager.start(service)
            elif command == 'stop':
                service = sys.argv[2] if len(sys.argv) > 2 else None
                manager.stop(service)
            elif command == 'restart':
                service = sys.argv[2] if len(sys.argv) > 2 else None
                manager.restart(service)
            elif command == 'status':
                manager.status()
            elif command == 'logs':
                service = sys.argv[2] if len(sys.argv) > 2 else None
                manager.logs(service)
            elif command == 'remove':
                service = sys.argv[2] if len(sys.argv) > 2 else None
                manager.remove(service)
            elif command == 'build':
                service = sys.argv[2] if len(sys.argv) > 2 else None
                manager.build(service)
            elif command == 'pull':
                service = sys.argv[2] if len(sys.argv) > 2 else None
                manager.pull(service)
            elif command == 'monitor':
                duration = int(sys.argv[2]) if len(sys.argv) > 2 else None
                manager.monitor_services(duration)
            elif command == 'health':
                service = sys.argv[2] if len(sys.argv) > 2 else None
                if service:
                    health = manager.check_service_health(service)
                    print(json.dumps(health, indent=2))
                else:
                    print("Usage: python3 main.py health <service_name>")
            elif command == 'deploy':
                strategy = sys.argv[2] if len(sys.argv) > 2 else None
                manager.deploy(strategy)
            elif command == 'backup':
                backup_name = sys.argv[2] if len(sys.argv) > 2 else None
                manager.create_backup(backup_name)
            elif command == 'rollback':
                backup_path = sys.argv[2] if len(sys.argv) > 2 else None
                if backup_path:
                    manager.rollback(backup_path)
                else:
                    print("Usage: python3 main.py rollback <backup_path>")
            elif command == 'config':
                manager.show_config()
            else:
                print("Unknown command. Available: start, stop, restart, status, logs, remove, build, pull, env, monitor, health, deploy, backup, rollback, config")
                print("Usage: python3 main.py <command> [service|environment|backup_path]")
        else:
            # Interactive mode
            while True:
                manager.display_menu()
                try:
                    choice = input("Enter your choice: ").strip()

                    if choice == '1':
                        manager.start()
                    elif choice == '2':
                        manager.stop()
                    elif choice == '3':
                        manager.restart()
                    elif choice == '4':
                        manager.status()
                    elif choice == '5':
                        manager.logs()
                    elif choice == '6':
                        manager.remove()
                    elif choice == '7':
                        manager.build()
                    elif choice == '8':
                        manager.pull()
                    elif choice == '9':
                        envs = list(manager.config_manager.config.get('environments', {}).keys())
                        print(f"Available environments: {', '.join(envs)}")
                        new_env = input("Enter environment name: ").strip()
                        try:
                            manager.switch_environment(new_env)
                        except EnvironmentError as e:
                            print(f"Error: {e}")
                    elif choice == '10':
                        duration = input("Enter monitoring duration in seconds (leave empty for continuous): ").strip()
                        duration = int(duration) if duration else None
                        manager.monitor_services(duration)
                    elif choice == '11':
                        service = input("Enter service name to check health: ").strip()
                        if service:
                            health = manager.check_service_health(service)
                            print(json.dumps(health, indent=2))
                        else:
                            print("Service name is required")
                    elif choice == '12':
                        strategy = input("Enter deployment strategy (recreate/rolling/blue-green) [recreate]: ").strip()
                        strategy = strategy if strategy else 'recreate'
                        manager.deploy(strategy)
                    elif choice == '13':
                        backup_name = input("Enter backup name (optional): ").strip()
                        manager.create_backup(backup_name if backup_name else None)
                    elif choice == '14':
                        backup_path = input("Enter backup path to rollback to: ").strip()
                        if backup_path:
                            manager.rollback(backup_path)
                        else:
                            print("Backup path is required")
                    elif choice == '15':
                        manager.show_config()
                    elif choice == '0':
                        print("Goodbye!")
                        break
                    else:
                        print("Invalid choice. Please try again.")

                except KeyboardInterrupt:
                    print("\nGoodbye!")
                    break

    except DockerComposeError as e:
        print(f"Error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
