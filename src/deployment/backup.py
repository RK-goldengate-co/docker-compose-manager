"""
Backup and restore functionality.
"""

import os
import shutil
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from ..core.exceptions import BackupError


class BackupManager:
    """Handles backup and restore operations for Docker Compose deployments."""

    def __init__(self, config_manager, docker_manager):
        self.config_manager = config_manager
        self.docker_manager = docker_manager
        self.backup_config = config_manager.config.get('backup', {})

    def create_backup(self, backup_name: Optional[str] = None) -> str:
        """Create a backup of current deployment."""
        if not self.backup_config.get('enabled', False):
            return "Backup is not enabled"

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_name = backup_name or f"backup_{timestamp}"
        backup_dir = self.backup_config.get('destination', './backups')

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

            # Create backup metadata
            metadata = {
                'name': backup_name,
                'timestamp': datetime.now().isoformat(),
                'environment': self.docker_manager.environment,
                'compose_file': compose_file,
                'env_file': env_file,
                'files': [
                    f"{backup_name}_compose.yml",
                    f"{backup_name}_env",
                    f"{backup_name}_state.json"
                ]
            }

            with open(f"{backup_dir}/{backup_name}_metadata.json", 'w') as f:
                json.dump(metadata, f, indent=2)

            print(f"✅ Backup created: {backup_dir}/{backup_name}")
            return f"{backup_dir}/{backup_name}"

        except Exception as e:
            print(f"❌ Backup failed: {e}")
            return ""

    def list_backups(self) -> List[Dict[str, Any]]:
        """List all available backups."""
        backup_dir = self.backup_config.get('destination', './backups')

        if not os.path.exists(backup_dir):
            return []

        backups = []
        for item in os.listdir(backup_dir):
            if item.endswith('_metadata.json'):
                try:
                    with open(f"{backup_dir}/{item}", 'r') as f:
                        metadata = json.load(f)
                        metadata['path'] = f"{backup_dir}/{item.replace('_metadata.json', '')}"
                        backups.append(metadata)
                except Exception:
                    continue

        # Sort by timestamp (newest first)
        backups.sort(key=lambda x: x['timestamp'], reverse=True)
        return backups

    def restore_backup(self, backup_path: str) -> bool:
        """Restore from a backup."""
        print(f"🔄 Restoring from backup: {backup_path}")

        try:
            # Restore docker-compose file
            compose_backup = f"{backup_path}_compose.yml"
            if os.path.exists(compose_backup):
                current_compose = self.docker_manager.get_compose_file()
                if os.path.exists(current_compose):
                    os.rename(current_compose, f"{current_compose}.old")
                shutil.copy2(compose_backup, current_compose)

            # Restore environment file
            env_backup = f"{backup_path}_env"
            if os.path.exists(env_backup):
                current_env = self.docker_manager.get_env_file()
                if current_env and os.path.exists(current_env):
                    os.rename(current_env, f"{current_env}.old")
                shutil.copy2(env_backup, current_env)

            # Stop current services and start from backup
            self.docker_manager.stop()
            result = self.docker_manager.start()

            if result:
                print("✅ Restore completed successfully")
                return True
            else:
                print("❌ Restore failed")
                return False

        except Exception as e:
            print(f"❌ Restore failed with error: {e}")
            return False

    def cleanup_old_backups(self) -> int:
        """Clean up old backups based on retention policy."""
        retention_days = self.backup_config.get('retention', 30)

        if retention_days <= 0:
            print("Backup retention is disabled")
            return 0

        backup_dir = self.backup_config.get('destination', './backups')
        cutoff_date = datetime.now() - timedelta(days=retention_days)

        cleaned_count = 0
        for item in os.listdir(backup_dir):
            if item.endswith('_metadata.json'):
                try:
                    with open(f"{backup_dir}/{item}", 'r') as f:
                        metadata = json.load(f)

                    backup_date = datetime.fromisoformat(metadata['timestamp'])
                    if backup_date < cutoff_date:
                        # Remove all backup files
                        base_name = item.replace('_metadata.json', '')
                        for suffix in ['_compose.yml', '_env', '_state.json', '_metadata.json']:
                            file_path = f"{backup_dir}/{base_name}{suffix}"
                            if os.path.exists(file_path):
                                os.remove(file_path)
                                cleaned_count += 1

                except Exception:
                    continue

        if cleaned_count > 0:
            print(f"🧹 Cleaned up {cleaned_count} old backup files")
        else:
            print("No old backups to clean up")

        return cleaned_count

    def validate_backup(self, backup_path: str) -> Dict[str, Any]:
        """Validate backup integrity."""
        validation = {
            'valid': True,
            'errors': [],
            'warnings': []
        }

        # Check if all required files exist
        required_files = [
            f"{backup_path}_compose.yml",
            f"{backup_path}_metadata.json"
        ]

        for file_path in required_files:
            if not os.path.exists(file_path):
                validation['valid'] = False
                validation['errors'].append(f"Missing required file: {file_path}")

        # Validate metadata
        metadata_file = f"{backup_path}_metadata.json"
        if os.path.exists(metadata_file):
            try:
                with open(metadata_file, 'r') as f:
                    metadata = json.load(f)

                # Check if compose file referenced in metadata exists
                if 'compose_file' in metadata and not os.path.exists(metadata['compose_file']):
                    validation['warnings'].append(f"Compose file referenced in metadata not found: {metadata['compose_file']}")

            except json.JSONDecodeError:
                validation['valid'] = False
                validation['errors'].append("Invalid metadata JSON")

        return validation
