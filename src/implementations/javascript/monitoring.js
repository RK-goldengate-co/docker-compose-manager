/**
 * Monitoring and health check functionality for JavaScript
 */

class HealthChecker {
  constructor(dockerManager) {
    this.dockerManager = dockerManager;
  }

  checkServiceHealth(serviceName) {
    try {
      // Check if container is running
      const result = this.dockerManager.executeCommand(
        `docker ps --filter name=${serviceName} --format "{{.Status}}"`
      );

      if (!result) {
        return {
          service: serviceName,
          running: false,
          health_status: 'unknown',
          status: 'Not found',
          timestamp: new Date().toISOString()
        };
      }

      const status = result.trim();
      const isHealthy = status.includes('Up') || status.toLowerCase().includes('running');

      // Get health check results if available
      let healthStatus = 'unknown';
      try {
        const healthResult = this.dockerManager.executeCommand(
          `docker inspect --format="{{.State.Health.Status}}" ${serviceName}`
        );
        if (healthResult && healthResult.trim()) {
          healthStatus = healthResult.trim().toLowerCase();
        }
      } catch (e) {
        // Health check not available or container not found
      }

      return {
        service: serviceName,
        running: isHealthy,
        health_status: healthStatus,
        status: status,
        timestamp: new Date().toISOString()
      };
    } catch (e) {
      return {
        service: serviceName,
        running: false,
        health_status: 'unknown',
        status: 'Error checking status',
        timestamp: new Date().toISOString()
      };
    }
  }

  checkAllServicesHealth() {
    const status = this.dockerManager.getServiceStatusDetailed();
    const services = status.services || [];

    const healthResults = [];
    for (const service of services) {
      const serviceName = service.name;
      if (serviceName && serviceName !== 'Unknown') {
        const health = this.checkServiceHealth(serviceName);
        healthResults.push(health);
      }
    }

    return {
      services: healthResults,
      timestamp: new Date().toISOString(),
      total_services: healthResults.length
    };
  }
}

class StatusMonitor {
  constructor(dockerManager, configManager) {
    this.dockerManager = dockerManager;
    this.configManager = configManager;
    this.monitoringConfig = configManager.config.monitoring || {};
  }

  monitorServices(duration = null) {
    if (!this.monitoringConfig.enabled) {
      console.log("Monitoring is not enabled in configuration");
      return;
    }

    const interval = this.monitoringConfig.interval || 60;
    const startTime = Date.now();

    console.log(`Starting service monitoring (interval: ${interval}s)...`);
    console.log("Press Ctrl+C to stop monitoring");

    const monitorInterval = setInterval(() => {
      if (duration && (Date.now() - startTime) >= duration * 1000) {
        clearInterval(monitorInterval);
        return;
      }

      const status = this.dockerManager.getServiceStatusDetailed();
      this._displayMonitoringStatus(status);
    }, interval * 1000);

    // Handle Ctrl+C
    process.on('SIGINT', () => {
      clearInterval(monitorInterval);
      console.log("\nMonitoring stopped");
      process.exit(0);
    });
  }

  _displayMonitoringStatus(status) {
    console.log(`\n--- Service Status (${status.timestamp}) ---`);

    if (status.error) {
      console.log(`Error: ${status.error}`);
      return;
    }

    const services = status.services || [];
    if (services.length === 0) {
      console.log("No services found");
      return;
    }

    for (const service of services) {
      const state = service.state || 'Unknown';
      const name = service.name || 'Unknown';
      const statusText = service.status || '';

      // Color coding for different states
      if (state.toLowerCase().includes('running') || state.toLowerCase().includes('up')) {
        console.log(`✅ ${name}: ${state} - ${statusText}`);
      } else if (state.toLowerCase().includes('exited') || state.toLowerCase().includes('stopped')) {
        console.log(`❌ ${name}: ${state} - ${statusText}`);
      } else {
        console.log(`⚠️  ${name}: ${state} - ${statusText}`);
      }
    }

    console.log("=".repeat(50));
  }

  generateReport() {
    const status = this.dockerManager.getServiceStatusDetailed();

    let healthyCount = 0;
    let unhealthyCount = 0;
    let unknownCount = 0;

    for (const service of status.services || []) {
      const state = service.state || '';
      if (state.toLowerCase().includes('running') || state.toLowerCase().includes('up')) {
        healthyCount++;
      } else if (state.toLowerCase().includes('exited') || state.toLowerCase().includes('stopped')) {
        unhealthyCount++;
      } else {
        unknownCount++;
      }
    }

    return {
      timestamp: status.timestamp,
      environment: this.dockerManager.environment,
      total_services: status.services?.length || 0,
      healthy: healthyCount,
      unhealthy: unhealthyCount,
      unknown: unknownCount,
      services: status.services || []
    };
  }
}

module.exports = { HealthChecker, StatusMonitor };
