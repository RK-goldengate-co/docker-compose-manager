/**
 * Deployment management for JavaScript implementation
 */

const fs = require('fs');
const path = require('path');

class DeploymentManager {
  constructor(configManager, dockerManager) {
    this.configManager = configManager;
    this.dockerManager = dockerManager;
    this.deploymentConfig = configManager.config.deployment || {};
  }

  createBackup(backupName = null) {
    const backupConfig = this.configManager.config.backup || {};
    if (!backupConfig.enabled) {
      return "Backup is not enabled";
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    backupName = backupName || `backup_${timestamp}`;
    const backupDir = backupConfig.destination || './backups';

    // Create backup directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    try {
      // Backup docker-compose file
      const composeFile = this.dockerManager.getComposeFile();
      if (fs.existsSync(composeFile)) {
        fs.copyFileSync(composeFile, `${backupDir}/${backupName}_compose.yml`);
      }

      // Backup environment file if exists
      const envFile = this.dockerManager.getEnvFile();
      if (envFile && fs.existsSync(envFile)) {
        fs.copyFileSync(envFile, `${backupDir}/${backupName}_env`);
      }

      // Backup current container state
      this.dockerManager.executeCommand(
        `docker-compose -f ${this.dockerManager.getComposeFile()} ps --format json > ${backupDir}/${backupName}_state.json`
      );

      // Create backup metadata
      const metadata = {
        name: backupName,
        timestamp: new Date().toISOString(),
        environment: this.dockerManager.environment,
        compose_file: composeFile,
        env_file: envFile,
        files: [
          `${backupName}_compose.yml`,
          `${backupName}_env`,
          `${backupName}_state.json`
        ]
      };

      fs.writeFileSync(`${backupDir}/${backupName}_metadata.json`, JSON.stringify(metadata, null, 2));

      console.log(`✅ Backup created: ${backupDir}/${backupName}`);
      return `${backupDir}/${backupName}`;

    } catch (e) {
      console.log(`❌ Backup failed: ${e.message}`);
      return "";
    }
  }

  runPreDeployHooks() {
    const preHooks = this.deploymentConfig.pre_deploy_hooks || [];

    if (preHooks.length === 0) {
      console.log("No pre-deployment hooks configured");
      return true;
    }

    for (const hook of preHooks) {
      console.log(`Running pre-deploy hook: ${hook}`);
      if (!this.dockerManager.executeCommand(hook)) {
        console.log(`❌ Pre-deploy hook failed: ${hook}`);
        return false;
      }
    }

    console.log("✅ All pre-deployment hooks completed");
    return true;
  }

  runPostDeployHooks() {
    const postHooks = this.deploymentConfig.post_deploy_hooks || [];

    if (postHooks.length === 0) {
      console.log("No post-deployment hooks configured");
      return true;
    }

    for (const hook of postHooks) {
      console.log(`Running post-deploy hook: ${hook}`);
      if (!this.dockerManager.executeCommand(hook)) {
        console.log(`❌ Post-deploy hook failed: ${hook}`);
        return false;
      }
    }

    console.log("✅ All post-deployment hooks completed");
    return true;
  }

  deploy(strategy = null) {
    strategy = strategy || this.deploymentConfig.strategy || 'recreate';
    const rollbackOnFailure = this.deploymentConfig.rollback_on_failure !== false;

    console.log(`🚀 Starting deployment with strategy: ${strategy}`);

    // Create backup before deployment
    const backupPath = this.createBackup("pre_deploy");
    if (!backupPath) {
      console.log("❌ Failed to create backup");
      return false;
    }

    // Run pre-deployment hooks
    if (!this.runPreDeployHooks()) {
      console.log("❌ Pre-deployment hooks failed");
      if (rollbackOnFailure) {
        this.rollback(backupPath);
      }
      return false;
    }

    try {
      // Execute deployment based on strategy
      let success = false;
      if (strategy === 'rolling') {
        success = this._deployRolling();
      } else if (strategy === 'blue-green') {
        success = this._deployBlueGreen();
      } else {
        success = this._deployRecreate();
      }

      if (!success) {
        console.log("❌ Deployment failed");
        if (rollbackOnFailure) {
          this.rollback(backupPath);
        }
        return false;
      }

      // Run post-deployment hooks
      if (!this.runPostDeployHooks()) {
        console.log("⚠️ Deployment succeeded but post-deployment hooks failed");
      }

      console.log("✅ Deployment completed successfully");
      return true;

    } catch (e) {
      console.log(`❌ Deployment failed with error: ${e.message}`);
      if (rollbackOnFailure) {
        this.rollback(backupPath);
      }
      return false;
    }
  }

  _deployRecreate() {
    console.log("Using recreate deployment strategy");

    // Pull latest images
    if (!this.dockerManager.pull()) {
      return false;
    }

    // Stop existing services
    this.dockerManager.stop();

    // Build if needed
    if (!this.dockerManager.build()) {
      return false;
    }

    // Start with new configuration
    return this.dockerManager.start() !== null;
  }

  _deployRolling() {
    console.log("Using rolling deployment strategy");
    // For now, fallback to recreate
    return this._deployRecreate();
  }

  _deployBlueGreen() {
    console.log("Using blue-green deployment strategy");
    // For now, fallback to recreate
    return this._deployRecreate();
  }

  rollback(backupPath) {
    console.log(`🔄 Rolling back to: ${backupPath}`);

    try {
      const backupDir = path.dirname(backupPath);
      const backupName = path.basename(backupPath);

      // Restore docker-compose file
      const composeBackup = `${backupDir}/${backupName}_compose.yml`;
      if (fs.existsSync(composeBackup)) {
        const currentCompose = this.dockerManager.getComposeFile();
        if (fs.existsSync(currentCompose)) {
          fs.renameSync(currentCompose, `${currentCompose}.failed`);
        }
        fs.copyFileSync(composeBackup, currentCompose);
      }

      // Restore environment file
      const envBackup = `${backupDir}/${backupName}_env`;
      if (fs.existsSync(envBackup)) {
        const currentEnv = this.dockerManager.getEnvFile();
        if (currentEnv && fs.existsSync(currentEnv)) {
          fs.renameSync(currentEnv, `${currentEnv}.failed`);
        }
        fs.copyFileSync(envBackup, currentEnv);
      }

      // Stop current services and start from backup
      this.dockerManager.stop();
      const result = this.dockerManager.start();

      if (result) {
        console.log("✅ Rollback completed successfully");
        return true;
      } else {
        console.log("❌ Rollback failed");
        return false;
      }

    } catch (e) {
      console.log(`❌ Rollback failed with error: ${e.message}`);
      return false;
    }
  }
}

module.exports = DeploymentManager;
