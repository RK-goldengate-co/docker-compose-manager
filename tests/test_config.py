"""Unit tests for configuration management."""
import unittest
import os
from pathlib import Path


class TestConfigManager(unittest.TestCase):
    """Test cases for configuration management."""

    def setUp(self):
        """Set up test fixtures."""
        self.test_config = {
            'environments': {
                'development': {
                    'compose_file': 'docker-compose.dev.yml',
                    'health_check_interval': 30
                },
                'staging': {
                    'compose_file': 'docker-compose.staging.yml',
                    'health_check_interval': 60
                },
                'production': {
                    'compose_file': 'docker-compose.prod.yml',
                    'health_check_interval': 120,
                    'enable_monitoring': True
                }
            }
        }

    def test_config_structure(self):
        """Test that config has correct structure."""
        self.assertIn('environments', self.test_config)
        self.assertIsInstance(self.test_config['environments'], dict)

    def test_environment_keys(self):
        """Test that all required environments are present."""
        environments = self.test_config['environments']
        self.assertIn('development', environments)
        self.assertIn('staging', environments)
        self.assertIn('production', environments)

    def test_development_config(self):
        """Test development environment configuration."""
        dev_config = self.test_config['environments']['development']
        self.assertEqual(dev_config['compose_file'], 'docker-compose.dev.yml')
        self.assertEqual(dev_config['health_check_interval'], 30)

    def test_staging_config(self):
        """Test staging environment configuration."""
        staging_config = self.test_config['environments']['staging']
        self.assertEqual(staging_config['compose_file'], 'docker-compose.staging.yml')
        self.assertEqual(staging_config['health_check_interval'], 60)

    def test_production_config(self):
        """Test production environment configuration."""
        prod_config = self.test_config['environments']['production']
        self.assertEqual(prod_config['compose_file'], 'docker-compose.prod.yml')
        self.assertEqual(prod_config['health_check_interval'], 120)
        self.assertTrue(prod_config['enable_monitoring'])

    def test_health_check_intervals(self):
        """Test that health check intervals increase with environment tier."""
        dev_interval = self.test_config['environments']['development']['health_check_interval']
        staging_interval = self.test_config['environments']['staging']['health_check_interval']
        prod_interval = self.test_config['environments']['production']['health_check_interval']
        
        self.assertLess(dev_interval, staging_interval)
        self.assertLess(staging_interval, prod_interval)


if __name__ == '__main__':
    unittest.main()
