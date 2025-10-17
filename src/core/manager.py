"""
Core Docker Compose Manager class.
Orchestrates all functionality using modular components.
"""

import os
import sys
import subprocess
import time
import json
import shutil
from datetime import datetime
from typing import Optional, Dict, List, Any

from .config import ConfigManager
from .exceptions import DockerComposeError, DeploymentError, MonitoringError, BackupError


class DockerComposeManager:
    """Main Docker Compose Manager class using modular architecture."""

    def __init__(self, config_path: str = 'dcm.config.yml', environment: Optional[str] = None):
        self.config_manager = ConfigManager(config_path)
        self.environment = environment or os.getenv('DCM_ENV', 'dev')
        self.current_env_config = self.config_manager.get_environment_config(self.environment)

        # Validate configuration on initialization
        validation_result = self.config_manager.validate()
        if validation_result['errors']:
            raise DockerComposeError(f"Configuration errors: {validation_result['errors']}")

        if validation_result['warnings']:
            print(f"Configuration warnings: {validation_result['warnings']}")

    def get_compose_file(self) -> str:
        """Get the compose file for current environment."""
        return self.current_env_config.get('compose_file', 'docker-compose.yml')

    def get_env_file(self) -> Optional[str]:
        """Get environment file for current environment."""
        return self.current_env_config.get('env_file')

    def get_build_options(self) -> List[str]:
        """Get build options for current environment."""
        return self.current_env_config.get('build_options', [])

    def execute_command(self, command: str, use_env_file: bool = False) -> Optional[str]:
        """Execute a shell command and return output."""
        try:
            # Set environment variables if specified
            env_vars = os.environ.copy()
            if use_env_file and self.get_env_file():
                env_file_vars = self.config_manager.get_environment_variables(self.environment)
                env_vars.update(env_file_vars)

            print(f"Executing: {command}")
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                check=True,
                env=env_vars
            )
            output = result.stdout
            if output:
                print(output)
            return output
        except subprocess.CalledProcessError as e:
            print(f"Error: {e}")
            if e.stderr:
                print(e.stderr)
            return None

    def start(self, service_name: Optional[str] = None) -> Optional[str]:
        """Start Docker Compose services."""
        compose_file = f"-f {self.get_compose_file()}"
        cmd = f"docker-compose {compose_file} up -d"
        if service_name:
            cmd += f" {service_name}"
        print(f"Starting services in {self.environment} environment...")
        return self.execute_command(cmd, use_env_file=True)

    def stop(self, service_name: Optional[str] = None) -> Optional[str]:
        """Stop Docker Compose services."""
        compose_file = f"-f {self.get_compose_file()}"
        cmd = f"docker-compose {compose_file} stop"
        if service_name:
            cmd += f" {service_name}"
        print(f"Stopping services in {self.environment} environment...")
        return self.execute_command(cmd)

    def restart(self, service_name: Optional[str] = None) -> Optional[str]:
        """Restart Docker Compose services."""
        compose_file = f"-f {self.get_compose_file()}"
        cmd = f"docker-compose {compose_file} restart"
        if service_name:
            cmd += f" {service_name}"
        print(f"Restarting services in {self.environment} environment...")
        return self.execute_command(cmd)

    def status(self) -> Optional[str]:
        """Check status of Docker Compose services."""
        compose_file = f"-f {self.get_compose_file()}"
        print(f"Checking service status in {self.environment} environment...")
        return self.execute_command(f"docker-compose {compose_file} ps")

    def logs(self, service_name: Optional[str] = None, follow: bool = False) -> Optional[str]:
        """View logs from Docker Compose services."""
        compose_file = f"-f {self.get_compose_file()}"
        follow_flag = "-f" if follow else ""
        cmd = f"docker-compose {compose_file} logs {follow_flag}"
        if service_name:
            cmd += f" {service_name}"
        print(f"Fetching logs in {self.environment} environment...")
        return self.execute_command(cmd)

    def remove(self, service_name: Optional[str] = None) -> Optional[str]:
        """Remove Docker Compose services."""
        compose_file = f"-f {self.get_compose_file()}"
        cmd = f"docker-compose {compose_file} rm -f"
        if service_name:
            cmd += f" {service_name}"
        print(f"Removing services in {self.environment} environment...")
        return self.execute_command(cmd)

    def build(self, service_name: Optional[str] = None) -> Optional[str]:
        """Build Docker Compose services."""
        compose_file = f"-f {self.get_compose_file()}"
        build_options = " ".join(self.get_build_options())
        cmd = f"docker-compose {compose_file} build {build_options}"
        if service_name:
            cmd += f" {service_name}"
        print(f"Building services in {self.environment} environment...")
        return self.execute_command(cmd)

    def pull(self, service_name: Optional[str] = None) -> Optional[str]:
        """Pull Docker images."""
        compose_file = f"-f {self.get_compose_file()}"
        cmd = f"docker-compose {compose_file} pull"
        if service_name:
            cmd += f" {service_name}"
        print(f"Pulling images in {self.environment} environment...")
        return self.execute_command(cmd)

    def switch_environment(self, environment: str) -> None:
        """Switch to a different environment."""
        if environment in self.config_manager.config.get('environments', {}):
            self.environment = environment
            self.current_env_config = self.config_manager.get_environment_config(environment)
            print(f"Switched to {environment} environment")
        else:
            available_envs = list(self.config_manager.config.get('environments', {}).keys())
            raise EnvironmentError(f"Environment '{environment}' not found. Available: {available_envs}")

    def get_service_status_detailed(self) -> Dict[str, Any]:
        """Get detailed status of all services."""
        compose_file = f"-f {self.get_compose_file()}"
        try:
            result = subprocess.run(
                f"docker-compose {compose_file} ps --format json",
                shell=True,
                capture_output=True,
                text=True,
                check=True
            )
            services = []
            for line in result.stdout.strip().split('\n'):
                if line:
                    try:
                        service_info = json.loads(line)
                        services.append({
                            'name': service_info.get('Name', 'Unknown'),
                            'state': service_info.get('State', 'Unknown'),
                            'status': service_info.get('Status', ''),
                            'ports': service_info.get('Ports', ''),
                            'created': service_info.get('CreatedAt', '')
                        })
                    except json.JSONDecodeError:
                        continue
            return {'services': services, 'timestamp': datetime.now().isoformat()}
        except subprocess.CalledProcessError:
            return {'services': [], 'timestamp': datetime.now().isoformat(), 'error': 'Failed to get service status'}

    def check_service_health(self, service_name: str) -> Dict[str, Any]:
        """Check health of a specific service."""
        try:
            # Check if container is running
            result = subprocess.run(
                f"docker ps --filter name={service_name} --format '{{{{.Status}}}}'",
                shell=True,
                capture_output=True,
                text=True,
                check=True
            )

            status = result.stdout.strip()
            is_healthy = 'Up' in status or 'running' in status.lower()

            # Get health check results if available
            health_result = subprocess.run(
                f"docker inspect --format='{{{{.State.Health.Status}}}}' {service_name}",
                shell=True,
                capture_output=True,
                text=True
            )

            health_status = 'unknown'
            if health_result.returncode == 0:
                health_output = health_result.stdout.strip()
                if health_output:
                    health_status = health_output.lower()

            return {
                'service': service_name,
                'running': is_healthy,
                'health_status': health_status,
                'status': status,
                'timestamp': datetime.now().isoformat()
            }
        except subprocess.CalledProcessError:
            return {
                'service': service_name,
                'running': False,
                'health_status': 'unknown',
                'status': 'Not found',
                'timestamp': datetime.now().isoformat()
            }

    def monitor_services(self, duration: Optional[int] = None) -> None:
        """Monitor services continuously."""
        monitoring_config = self.config_manager.config.get('monitoring', {})
        if not monitoring_config.get('enabled', False):
            print("Monitoring is not enabled in configuration")
            return

        interval = monitoring_config.get('interval', 60)
        start_time = time.time()

        print(f"Starting service monitoring (interval: {interval}s)...")
        print("Press Ctrl+C to stop monitoring")

        try:
            while True:
                if duration and (time.time() - start_time) >= duration:
                    break

                status = self.get_service_status_detailed()
                self._display_monitoring_status(status)

                time.sleep(interval)
        except KeyboardInterrupt:
            print("\nMonitoring stopped")

    def _display_monitoring_status(self, status: Dict[str, Any]) -> None:
        """Display current monitoring status."""
        print(f"\n--- Service Status ({status['timestamp']}) ---")

        if 'error' in status:
            print(f"Error: {status['error']}")
            return

        services = status.get('services', [])
        if not services:
            print("No services found")
            return

        for service in services:
            state = service.get('state', 'Unknown')
            name = service.get('name', 'Unknown')
            status_text = service.get('status', '')

            # Color coding for different states
            if state.lower() in ['running', 'up']:
                print(f"✅ {name}: {state} - {status_text}")
            elif state.lower() in ['exited', 'stopped']:
                print(f"❌ {name}: {state} - {status_text}")
            else:
                print(f"⚠️  {name}: {state} - {status_text}")

        print("=" * 50)

    def create_backup(self, backup_name: Optional[str] = None) -> str:
        """Create a backup of current deployment."""
        backup_config = self.config_manager.config.get('backup', {})
        if not backup_config.get('enabled', False):
            return "Backup is not enabled"

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_name = backup_name or f"backup_{timestamp}"
        backup_dir = backup_config.get('destination', './backups')

        # Create backup directory if it doesn't exist
        os.makedirs(backup_dir, exist_ok=True)

        try:
            # Backup docker-compose file
            compose_file = self.get_compose_file()
            if os.path.exists(compose_file):
                shutil.copy2(compose_file, f"{backup_dir}/{backup_name}_compose.yml")

            # Backup environment file if exists
            env_file = self.get_env_file()
            if env_file and os.path.exists(env_file):
                shutil.copy2(env_file, f"{backup_dir}/{backup_name}_env")

            # Backup current container state
            self.execute_command(f"docker-compose -f {self.get_compose_file()} ps --format json > {backup_dir}/{backup_name}_state.json")

            print(f"✅ Backup created: {backup_dir}/{backup_name}")
            return f"{backup_dir}/{backup_name}"

        except Exception as e:
            print(f"❌ Backup failed: {e}")
            return ""

    def deploy(self, strategy: Optional[str] = None) -> bool:
        """Deploy services with rollback capabilities."""
        deployment_config = self.config_manager.config.get('deployment', {})
        strategy = strategy or deployment_config.get('strategy', 'recreate')
        rollback_on_failure = deployment_config.get('rollback_on_failure', True)

        print(f"🚀 Starting deployment with strategy: {strategy}")

        # Create backup before deployment
        backup_path = self.create_backup("pre_deploy")
        if not backup_path:
            print("❌ Failed to create backup")
            return False

        try:
            # Execute deployment based on strategy
            if strategy == 'rolling':
                success = self._deploy_rolling()
            elif strategy == 'blue-green':
                success = self._deploy_blue_green()
            else:  # recreate
                success = self._deploy_recreate()

            if not success:
                print("❌ Deployment failed")
                if rollback_on_failure:
                    self.rollback(backup_path)
                return False

            print("✅ Deployment completed successfully")
            return True

        except Exception as e:
            print(f"❌ Deployment failed with error: {e}")
            if rollback_on_failure:
                self.rollback(backup_path)
            return False

    def _deploy_recreate(self) -> bool:
        """Deploy using recreate strategy."""
        print("Using recreate deployment strategy")

        # Pull latest images
        if not self.pull():
            return False

        # Stop existing services
        self.stop()

        # Build if needed
        if not self.build():
            return False

        # Start with new configuration
        return self.start() is not None

    def _deploy_rolling(self) -> bool:
        """Deploy using rolling update strategy."""
        print("Using rolling deployment strategy")
        # This would implement rolling updates
        # For now, fallback to recreate
        return self._deploy_recreate()

    def _deploy_blue_green(self) -> bool:
        """Deploy using blue-green strategy."""
        print("Using blue-green deployment strategy")
        # This would implement blue-green deployment
        # For now, fallback to recreate
        return self._deploy_recreate()

    def rollback(self, backup_path: str) -> bool:
        """Rollback to previous deployment state."""
        print(f"🔄 Rolling back to: {backup_path}")

        try:
            # Restore files from backup
            backup_dir = os.path.dirname(backup_path)
            backup_name = os.path.basename(backup_path)

            # Restore docker-compose file
            compose_backup = f"{backup_dir}/{backup_name}_compose.yml"
            if os.path.exists(compose_backup):
                current_compose = self.get_compose_file()
                if os.path.exists(current_compose):
                    os.rename(current_compose, f"{current_compose}.failed")
                shutil.copy2(compose_backup, current_compose)

            # Restore environment file
            env_backup = f"{backup_dir}/{backup_name}_env"
            if os.path.exists(env_backup):
                current_env = self.get_env_file()
                if current_env and os.path.exists(current_env):
                    os.rename(current_env, f"{current_env}.failed")
                shutil.copy2(env_backup, current_env)

            # Stop current services and start from backup
            self.stop()
            result = self.start()

            if result:
                print("✅ Rollback completed successfully")
                return True
            else:
                print("❌ Rollback failed")
                return False

        except Exception as e:
            print(f"❌ Rollback failed with error: {e}")
            return False

    def display_menu(self) -> None:
        """Display interactive menu."""
        print(f"\n=== Docker Compose Manager (Python) - Environment: {self.environment} ===")
        print("1. Start services")
        print("2. Stop services")
        print("3. Restart services")
        print("4. Check status")
        print("5. View logs")
        print("6. Remove services")
        print("7. Build services")
        print("8. Pull images")
        print("9. Switch environment")
        print("10. Monitor services")
        print("11. Check service health")
        print("12. Deploy services")
        print("13. Create backup")
        print("14. Rollback deployment")
        print("15. Show configuration")
        print("0. Exit")
        print("=" * 50)
        print(f"Current environment: {self.environment}")
        print(f"Compose file: {self.get_compose_file()}")
        if self.get_env_file():
            print(f"Environment file: {self.get_env_file()}")
        print("=" * 50)

    def show_config(self) -> None:
        """Display current configuration."""
        print("\n=== Current Configuration ===")
        print(f"Config file: {self.config_manager.config_path}")
        print(f"Environment: {self.environment}")
        print("Configuration:")
        print(json.dumps(self.config_manager.config, indent=2))
