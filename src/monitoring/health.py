"""
Monitoring and health check functionality.
"""

import time
import json
import subprocess
from datetime import datetime
from typing import Dict, List, Any, Optional

from ..core.exceptions import MonitoringError


class HealthChecker:
    """Handles health checks for Docker Compose services."""

    def __init__(self, docker_manager):
        self.docker_manager = docker_manager

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

    def check_all_services_health(self) -> Dict[str, Any]:
        """Check health of all services."""
        status = self.docker_manager.get_service_status_detailed()
        services = status.get('services', [])

        health_results = []
        for service in services:
            service_name = service.get('name', '')
            if service_name and service_name != 'Unknown':
                health = self.check_service_health(service_name)
                health_results.append(health)

        return {
            'services': health_results,
            'timestamp': datetime.now().isoformat(),
            'total_services': len(health_results)
        }


class StatusMonitor:
    """Monitors service status continuously."""

    def __init__(self, docker_manager, config_manager):
        self.docker_manager = docker_manager
        self.config_manager = config_manager
        self.monitoring_config = config_manager.config.get('monitoring', {})

    def monitor_services(self, duration: Optional[int] = None) -> None:
        """Monitor services continuously."""
        if not self.monitoring_config.get('enabled', False):
            print("Monitoring is not enabled in configuration")
            return

        interval = self.monitoring_config.get('interval', 60)
        start_time = time.time()

        print(f"Starting service monitoring (interval: {interval}s)...")
        print("Press Ctrl+C to stop monitoring")

        try:
            while True:
                if duration and (time.time() - start_time) >= duration:
                    break

                status = self.docker_manager.get_service_status_detailed()
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

    def generate_report(self) -> Dict[str, Any]:
        """Generate a monitoring report."""
        status = self.docker_manager.get_service_status_detailed()

        healthy_count = 0
        unhealthy_count = 0
        unknown_count = 0

        for service in status.get('services', []):
            state = service.get('state', '').lower()
            if state in ['running', 'up']:
                healthy_count += 1
            elif state in ['exited', 'stopped']:
                unhealthy_count += 1
            else:
                unknown_count += 1

        return {
            'timestamp': status['timestamp'],
            'environment': self.docker_manager.environment,
            'total_services': len(status.get('services', [])),
            'healthy': healthy_count,
            'unhealthy': unhealthy_count,
            'unknown': unknown_count,
            'services': status.get('services', [])
        }
