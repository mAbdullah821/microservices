import { spawn, ChildProcess } from 'child_process';
import axios from 'axios';

/**
 * Microservices Orchestrator
 *
 * This orchestrator manages the lifecycle of all microservices in the system:
 * - Service Discovery Server (port 3000)
 * - User Service instances (ports 4000-4002)
 * - Order Service instances (ports 5000-5002)
 * - API Gateway (port 8000)
 *
 * Features:
 * - Automatic service discovery registration
 * - Health monitoring and startup coordination
 * - Graceful shutdown handling
 * - Process management and cleanup
 */
class MicroservicesOrchestrator {
  private processes: ChildProcess[] = [];

  // Spawn the service discovery server
  spawnServiceDiscoveryServer(): ChildProcess {
    console.log('🚀 Starting Service Discovery Server...');

    const child = spawn('node', ['-r', 'ts-node/register', 'src/packages/service-discovery/server/index.ts'], {
      stdio: 'inherit',
      shell: true,
    });

    this.processes.push(child);
    console.log('✅ Service Discovery Server started on port 3000');

    return child;
  }

  // Wait for service discovery server to be ready
  async waitForServiceDiscovery(): Promise<boolean> {
    console.log('⏳ Checking service discovery server...');

    let attempts = 0;
    const maxAttempts = 10;
    let delay = 500; // Initial delay of 500ms

    while (attempts < maxAttempts) {
      try {
        await axios.get('http://localhost:3000/services', { timeout: 2000 });
        console.log('✅ Service discovery server is ready');
        return true;
      } catch (error) {
        attempts++;
        console.log(`⏳ Waiting for service discovery server... (${attempts}/${maxAttempts})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // Double the delay for next attempt
      }
    }

    console.error('❌ Service discovery server failed to start');
    return false;
  }

  // Spawn 3 instances of a service
  spawnService(serviceName: string, scriptPath: string, basePort: number): void {
    console.log(`\n🚀 Spawning 3 instances of ${serviceName}...`);

    for (let i = 0; i < 3; i++) {
      const port = basePort + i;
      const instanceId = `${serviceName}-${port}`;

      const child = spawn('node', ['-r', 'ts-node/register', scriptPath], {
        env: {
          ...process.env,
          PORT: port.toString(),
        },
        stdio: 'inherit',
        shell: true,
      });

      this.processes.push(child);
      console.log(`✅ Started ${instanceId} on port ${port}`);
    }
  }

  // Spawn a single instance of a service
  spawnSingleService(serviceName: string, scriptPath: string, port: number): void {
    console.log(`\n🚀 Starting ${serviceName}...`);

    const instanceId = `${serviceName}-${port}`;

    const child = spawn('node', ['-r', 'ts-node/register', scriptPath], {
      env: {
        ...process.env,
        PORT: port.toString(),
      },
      stdio: 'inherit',
      shell: true,
    });

    this.processes.push(child);
    console.log(`✅ Started ${instanceId} on port ${port}`);
  }

  // Start all services
  async start(): Promise<void> {
    console.log('🎯 Starting all microservices...\n');

    // Start service discovery server first
    this.spawnServiceDiscoveryServer();

    // Wait for service discovery server to be ready
    const isReady = await this.waitForServiceDiscovery();
    if (!isReady) {
      this.shutdown();
      return;
    }

    // Spawn User Service instances (ports 4000-4002)
    this.spawnService('user-service', 'src/apps/user/index.ts', 4000);

    // Wait a bit between services
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Spawn Order Service instances (ports 5000-5002)
    this.spawnService('order-service', 'src/apps/order/index.ts', 5000);

    // Wait a bit before starting API Gateway
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Spawn API Gateway (port 8000)
    this.spawnSingleService('api-gateway', 'src/api-gateway.app.ts', 8000);

    console.log('\n🎉 All services started successfully!');
    console.log('\n📊 Service URLs:');
    console.log('Service Discovery Dashboard:');
    console.log('  - http://localhost:3000');

    console.log('\nAPI Gateway:');
    console.log('  - Dashboard: http://localhost:8000/');
    console.log('  - Health: http://localhost:8000/health');
    console.log('  - Users: http://localhost:8000/users');
    console.log('  - Orders: http://localhost:8000/orders/user/:userId');
    console.log('  - Combined: http://localhost:8000/users-with-orders');

    console.log('\nUser Service instances:');
    console.log('  - http://localhost:4000');
    console.log('  - http://localhost:4001');
    console.log('  - http://localhost:4002');

    console.log('\nOrder Service instances:');
    console.log('  - http://localhost:5000');
    console.log('  - http://localhost:5001');
    console.log('  - http://localhost:5002');

    console.log('\n💡 Try these endpoints:');
    console.log('  - 🚀 API Gateway Dashboard: http://localhost:8000/');
    console.log('  - 🌐 Service Discovery Dashboard: http://localhost:3000/');
    console.log('  - GET http://localhost:8000/users');
    console.log('  - GET http://localhost:8000/orders/user/1');
    console.log('  - GET http://localhost:8000/users-with-orders');
    console.log('  - GET http://localhost:8000/health');

    console.log('\n🔗 Direct service endpoints (for testing):');
    console.log('  - GET http://localhost:4000/users');
    console.log('  - GET http://localhost:4000/health');
    console.log('  - GET http://localhost:5000/orders/user/1');
    console.log('  - GET http://localhost:5000/health');
  }

  // Shutdown all processes
  shutdown(): void {
    console.log('\n🛑 Shutting down all services...');

    this.processes.forEach((process) => {
      process.kill('SIGTERM');
    });

    process.exit(0);
  }
}

// Main execution
async function main(): Promise<void> {
  const orchestrator = new MicroservicesOrchestrator();

  // Setup graceful shutdown
  process.on('SIGTERM', () => orchestrator.shutdown());
  process.on('SIGINT', () => orchestrator.shutdown());

  // Start all services
  await orchestrator.start();

  // Keep alive
  setInterval(() => {}, 1000);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export default MicroservicesOrchestrator;
