const { spawn } = require("child_process");
const axios = require("axios");

class SimpleSpawner {
  constructor() {
    this.processes = [];
  }

  // Spawn the service discovery server
  spawnServiceDiscoveryServer() {
    console.log("🚀 Starting Service Discovery Server...");

    const child = spawn("node", ["./service-discovery-server/index.js"], {
      stdio: "inherit",
    });

    this.processes.push(child);
    console.log("✅ Service Discovery Server started on port 3000");

    return child;
  }

  // Wait for service discovery server to be ready
  async waitForServiceDiscovery() {
    console.log("⏳ Checking service discovery server...");

    let attempts = 0;
    const maxAttempts = 10;
    let delay = 500; // Initial delay of 500ms

    while (attempts < maxAttempts) {
      try {
        await axios.get("http://localhost:3000/services", { timeout: 2000 });
        console.log("✅ Service discovery server is ready");
        return true;
      } catch (error) {
        attempts++;
        console.log(
          `⏳ Waiting for service discovery server... (${attempts}/${maxAttempts})`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // Double the delay for next attempt
      }
    }

    console.error("❌ Service discovery server failed to start");
    return false;
  }

  // Spawn 3 instances of a service
  spawnService(serviceName, scriptPath, basePort) {
    console.log(`\n🚀 Spawning 3 instances of ${serviceName}...`);

    for (let i = 0; i < 3; i++) {
      const port = basePort + i;
      const instanceId = `${serviceName}-${port}`;

      const child = spawn("node", [scriptPath], {
        env: {
          ...process.env,
          PORT: port.toString(),
        },
        stdio: "inherit",
      });

      this.processes.push(child);
      console.log(`✅ Started ${instanceId} on port ${port}`);
    }
  }

  // Start all services
  async start() {
    console.log("🎯 Starting all microservices...\n");

    // Start service discovery server first
    this.spawnServiceDiscoveryServer();

    // Wait for service discovery server to be ready
    const isReady = await this.waitForServiceDiscovery();
    if (!isReady) {
      this.shutdown();
      return;
    }

    // Spawn User Service instances (ports 4000-4002)
    this.spawnService("user-service", "./user.service.app.js", 4000);

    // Wait a bit between services
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Spawn Order Service instances (ports 5000-5002)
    this.spawnService("order-service", "./order.service.app.js", 5000);

    console.log("\n🎉 All services started successfully!");
    console.log("\n📊 Service URLs:");
    console.log("Service Discovery Dashboard:");
    console.log("  - http://localhost:3000");
    console.log("\nUser Service instances:");
    console.log("  - http://localhost:4000");
    console.log("  - http://localhost:4001");
    console.log("  - http://localhost:4002");
    console.log("\nOrder Service instances:");
    console.log("  - http://localhost:5000");
    console.log("  - http://localhost:5001");
    console.log("  - http://localhost:5002");
    console.log("\n💡 Try these endpoints:");
    console.log("  - GET http://localhost:4000/users");
    console.log("  - GET http://localhost:4000/health");
    console.log("  - GET http://localhost:5000/orders/user/1");
    console.log("  - GET http://localhost:5000/health");
  }

  // Shutdown all processes
  shutdown() {
    console.log("\n🛑 Shutting down all services...");

    this.processes.forEach((process) => {
      process.kill("SIGTERM");
    });

    process.exit(0);
  }
}

// Main execution
async function main() {
  const spawner = new SimpleSpawner();

  // Setup graceful shutdown
  process.on("SIGTERM", () => spawner.shutdown());
  process.on("SIGINT", () => spawner.shutdown());

  // Start all services
  await spawner.start();

  // Keep alive
  setInterval(() => {}, 1000);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = SimpleSpawner;
