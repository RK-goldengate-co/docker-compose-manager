package main

import (
	"fmt"
	"io/ioutil"
	"os"
	"os/exec"
	"strings"

	"gopkg.in/yaml.v2"
)

// Config represents the Docker Compose Manager configuration
type Config struct {
	Services     []string `yaml:"services"`
	ComposeFile  string   `yaml:"compose_file"`
}

// DockerComposeManager manages Docker Compose services
type DockerComposeManager struct {
	configPath string
	config     Config
}

// NewDockerComposeManager creates a new instance of DockerComposeManager
func NewDockerComposeManager(configPath string) *DockerComposeManager {
	if configPath == "" {
		configPath = "dcm.config.yml"
	}

	dcm := &DockerComposeManager{
		configPath: configPath,
	}
	dcm.loadConfig()
	return dcm
}

// loadConfig loads the configuration from the YAML file
func (dcm *DockerComposeManager) loadConfig() {
	if _, err := os.Stat(dcm.configPath); os.IsNotExist(err) {
		fmt.Println("Config file not found, using defaults")
		dcm.config = Config{
			Services:    []string{},
			ComposeFile: "docker-compose.yml",
		}
		return
	}

	data, err := ioutil.ReadFile(dcm.configPath)
	if err != nil {
		fmt.Printf("Error reading config file: %v\n", err)
		return
	}

	err = yaml.Unmarshal(data, &dcm.config)
	if err != nil {
		fmt.Printf("Error parsing config file: %v\n", err)
	}
}

// executeCommand executes a shell command and returns the output
func (dcm *DockerComposeManager) executeCommand(command string) (string, error) {
	fmt.Printf("Executing: %s\n", command)

	cmd := exec.Command("sh", "-c", command)
	output, err := cmd.CombinedOutput()

	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return "", err
	}

	result := string(output)
	fmt.Print(result)
	return result, nil
}

// Start starts Docker Compose services
func (dcm *DockerComposeManager) Start(serviceName string) (string, error) {
	var cmd string
	if serviceName != "" {
		cmd = fmt.Sprintf("docker-compose up -d %s", serviceName)
	} else {
		cmd = "docker-compose up -d"
	}
	fmt.Println("Starting services...")
	return dcm.executeCommand(cmd)
}

// Stop stops Docker Compose services
func (dcm *DockerComposeManager) Stop(serviceName string) (string, error) {
	var cmd string
	if serviceName != "" {
		cmd = fmt.Sprintf("docker-compose stop %s", serviceName)
	} else {
		cmd = "docker-compose stop"
	}
	fmt.Println("Stopping services...")
	return dcm.executeCommand(cmd)
}

// Restart restarts Docker Compose services
func (dcm *DockerComposeManager) Restart(serviceName string) (string, error) {
	var cmd string
	if serviceName != "" {
		cmd = fmt.Sprintf("docker-compose restart %s", serviceName)
	} else {
		cmd = "docker-compose restart"
	}
	fmt.Println("Restarting services...")
	return dcm.executeCommand(cmd)
}

// Status checks the status of Docker Compose services
func (dcm *DockerComposeManager) Status() (string, error) {
	fmt.Println("Checking service status...")
	return dcm.executeCommand("docker-compose ps")
}

// Logs retrieves logs from Docker Compose services
func (dcm *DockerComposeManager) Logs(serviceName string, follow bool) (string, error) {
	var cmd string
	followFlag := ""
	if follow {
		followFlag = "-f"
	}

	if serviceName != "" {
		cmd = fmt.Sprintf("docker-compose logs %s %s", followFlag, serviceName)
	} else {
		cmd = fmt.Sprintf("docker-compose logs %s", followFlag)
	}
	fmt.Println("Fetching logs...")
	return dcm.executeCommand(cmd)
}

// Remove removes Docker Compose services
func (dcm *DockerComposeManager) Remove(serviceName string) (string, error) {
	var cmd string
	if serviceName != "" {
		cmd = fmt.Sprintf("docker-compose rm -f %s", serviceName)
	} else {
		cmd = "docker-compose rm -f"
	}
	fmt.Println("Removing services...")
	return dcm.executeCommand(cmd)
}

// Build builds Docker Compose services
func (dcm *DockerComposeManager) Build(serviceName string) (string, error) {
	var cmd string
	if serviceName != "" {
		cmd = fmt.Sprintf("docker-compose build %s", serviceName)
	} else {
		cmd = "docker-compose build"
	}
	fmt.Println("Building services...")
	return dcm.executeCommand(cmd)
}

// Pull pulls Docker images
func (dcm *DockerComposeManager) Pull(serviceName string) (string, error) {
	var cmd string
	if serviceName != "" {
		cmd = fmt.Sprintf("docker-compose pull %s", serviceName)
	} else {
		cmd = "docker-compose pull"
	}
	fmt.Println("Pulling images...")
	return dcm.executeCommand(cmd)
}

// DisplayMenu displays the interactive menu
func (dcm *DockerComposeManager) DisplayMenu() {
	fmt.Println("\n=== Docker Compose Manager (Go) ===")
	fmt.Println("1. Start services")
	fmt.Println("2. Stop services")
	fmt.Println("3. Restart services")
	fmt.Println("4. Check status")
	fmt.Println("5. View logs")
	fmt.Println("6. Remove services")
	fmt.Println("7. Build services")
	fmt.Println("8. Pull images")
	fmt.Println("0. Exit")
	fmt.Println("====================================\n")
}

func main() {
	manager := NewDockerComposeManager("dcm.config.yml")

	fmt.Println("Docker Compose Manager - Go Edition")
	fmt.Printf("Config loaded from: %s\n", manager.configPath)

	// Check for command line arguments
	args := os.Args[1:]

	if len(args) > 0 {
		command := args[0]
		var serviceName string
		if len(args) > 1 {
			serviceName = args[1]
		}

		switch strings.ToLower(command) {
		case "start":
			manager.Start(serviceName)
		case "stop":
			manager.Stop(serviceName)
		case "restart":
			manager.Restart(serviceName)
		case "status":
			manager.Status()
		case "logs":
			manager.Logs(serviceName, false)
		case "remove":
			manager.Remove(serviceName)
		case "build":
			manager.Build(serviceName)
		case "pull":
			manager.Pull(serviceName)
		default:
			fmt.Println("Unknown command. Available: start, stop, restart, status, logs, remove, build, pull")
		}
	} else {
		manager.DisplayMenu()
		fmt.Println("Usage: go run main.go <command> [service]")
		fmt.Println("Example: go run main.go start web")
	}
}
