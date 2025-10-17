"""
Deployment strategies and functionality.
"""

import os
import shutil
import subprocess
from typing import Dict, List, Optional, Any
from datetime import datetime

from ..core.exceptions import DeploymentError, BackupError


class DeploymentManager:
    """Handles deployment operations with different strategies."""

    def __init__(self, config_manager, docker_manager):
        self.config_manager = config_manager
        self.docker_manager = docker_manager
        self.deployment_config = config_manager.config.get('deployment', {})

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
            compose_file = self.docker_manager.get_compose_file()
            if os.path.exists(compose_file):
                shutil.copy2(compose_file, f"{backup_dir}/{backup_name}_compose.yml")

            # Backup environment file if exists
            env_file = self.docker_manager.get_env_file()
            if env_file and os.path.exists(env_file):
                shutil.copy2(env_file, f"{backup_dir}/{backup_name}_env")

            # Backup current container state
            self.docker_manager.execute_command(
                f"docker-compose -f {self.docker_manager.get_compose_file()} ps --format json > {backup_dir}/{backup_name}_state.json"
            )

            print(f"✅ Backup created: {backup_dir}/{backup_name}")
            return f"{backup_dir}/{backup_name}"

        except Exception as e:
            print(f"❌ Backup failed: {e}")
            return ""

    def run_pre_deploy_hooks(self) -> bool:
        """Run pre-deployment hooks."""
        pre_hooks = self.deployment_config.get('pre_deploy_hooks', [])

        if not pre_hooks:
            print("No pre-deployment hooks configured")
            return True

        for hook in pre_hooks:
            print(f"Running pre-deploy hook: {hook}")
            if not self.docker_manager.execute_command(hook):
                print(f"❌ Pre-deploy hook failed: {hook}")
                return False

        print("✅ All pre-deployment hooks completed")
        return True

    def run_post_deploy_hooks(self) -> bool:
        """Run post-deployment hooks."""
        post_hooks = self.deployment_config.get('post_deploy_hooks', [])

        if not post_hooks:
            print("No post-deployment hooks configured")
            return True

        for hook in post_hooks:
            print(f"Running post-deploy hook: {hook}")
            if not self.docker_manager.execute_command(hook):
                print(f"❌ Post-deploy hook failed: {hook}")
                return False

        print("✅ All post-deployment hooks completed")
        return True

    def deploy(self, strategy: Optional[str] = None) -> bool:
        """Deploy services with rollback capabilities."""
        strategy = strategy or self.deployment_config.get('strategy', 'recreate')
        rollback_on_failure = self.deployment_config.get('rollback_on_failure', True)

        print(f"🚀 Starting deployment with strategy: {strategy}")

        # Create backup before deployment
        backup_path = self.create_backup("pre_deploy")
        if not backup_path:
            print("❌ Failed to create backup")
            return False

        # Run pre-deployment hooks
        if not self.run_pre_deploy_hooks():
            print("❌ Pre-deployment hooks failed")
            if rollback_on_failure:
                self.rollback(backup_path)
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

            # Run post-deployment hooks
            if not self.run_post_deploy_hooks():
                print("⚠️ Deployment succeeded but post-deployment hooks failed")
                # Don't rollback for post-deploy hook failures

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
        if not self.docker_manager.pull():
            return False

        # Stop existing services
        self.docker_manager.stop()

        # Build if needed
        if not self.docker_manager.build():
            return False

        # Start with new configuration
        return self.docker_manager.start() is not None

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
                current_compose = self.docker_manager.get_compose_file()
                if os.path.exists(current_compose):
                    os.rename(current_compose, f"{current_compose}.failed")
                shutil.copy2(compose_backup, current_compose)

            # Restore environment file
            env_backup = f"{backup_dir}/{backup_name}_env"
            if os.path.exists(env_backup):
                current_env = self.docker_manager.get_env_file()
                if current_env and os.path.exists(current_env):
                    os.rename(current_env, f"{current_env}.failed")
                shutil.copy2(env_backup, current_env)

            # Stop current services and start from backup
            self.docker_manager.stop()
            result = self.docker_manager.start()

            if result:
                print("✅ Rollback completed successfully")
                return True
            else:
                print("❌ Rollback failed")
                return False

        except Exception as e:
            print(f"❌ Rollback failed with error: {e}")
            return False
