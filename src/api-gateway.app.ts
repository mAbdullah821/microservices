import express, { Request, Response } from 'express';
import axios from 'axios';
import cors from 'cors';
import ServiceDiscoveryClient from './packages/service-discovery/client';
import { createCircuitBreakerMethod } from './packages/circuit-breaker';
import { User, Order, UserWithOrders } from './shared/types';
import { API_GATEWAY_DASHBOARD_HTML } from './shared/constants';

const app = express();
const port = parseInt(process.env.PORT || '8000');

app.use(express.json());
app.use(cors());

// =============================================================================
// SERVICE DISCOVERY SETUP
// =============================================================================

// Initialize service discovery client
const discoveryClient = new ServiceDiscoveryClient('http://localhost:3000', {
  defaultHeartbeatInterval: 30, // 30 seconds
  cacheMultiplier: 2, // Cache for 60 seconds
  requestTimeout: 5000, // 5 second timeout
});

// =============================================================================
// FALLBACK METHODS FOR CIRCUIT BREAKER
// =============================================================================

const fallbackUsers: User[] = [
  { id: 1, name: 'Fallback User', email: 'fallback@example.com', age: 25 },
  { id: 2, name: 'Default User', email: 'default@example.com', age: 30 },
];

const fallbackOrders: Order[] = [
  { id: 1, userId: 1, products: ['Fallback Product'] },
  { id: 2, userId: 2, products: ['Fallback Product'] },
];

async function getUsersFallback(): Promise<User[]> {
  console.log('🔄 Circuit breaker activated - using fallback users');
  return fallbackUsers;
}

async function getOrdersFallback(userId: number): Promise<Order[]> {
  console.log(`🔄 Circuit breaker activated - using fallback orders for user ${userId}`);
  return fallbackOrders.filter((order) => order.userId === userId);
}

// =============================================================================
// CORE API METHODS WITH SERVICE DISCOVERY
// =============================================================================

/**
 * Fetch users from user service using service discovery
 */
async function fetchUsersFromService(): Promise<User[]> {
  // Use service discovery to get the URL
  const userServiceUrl = await discoveryClient.getServiceUrl('user-service');
  console.log(`🔍 Discovered user service at: ${userServiceUrl}`);

  const response = await axios.get(`${userServiceUrl}/users`, {
    timeout: 5000,
  });

  console.log('✅ Successfully fetched users from user service');
  return response.data.users || response.data;
}

/**
 * Fetch orders for a specific user using service discovery
 */
async function fetchOrdersFromService(userId: number): Promise<Order[]> {
  // Use service discovery to get the URL
  const orderServiceUrl = await discoveryClient.getServiceUrl('order-service');
  console.log(`🔍 Discovered order service at: ${orderServiceUrl}`);

  const response = await axios.get(`${orderServiceUrl}/orders/user/${userId}`, {
    timeout: 5000,
  });

  console.log(`✅ Successfully fetched orders for user ${userId} from order service`);
  return response.data.orders || response.data;
}

// =============================================================================
// CIRCUIT BREAKER WRAPPED METHODS
// =============================================================================

/**
 * Users API call protected by circuit breaker
 * - Service discovery finds the service URL
 * - Circuit breaker handles failures and provides fallback
 */
const protectedFetchUsers = createCircuitBreakerMethod(
  fetchUsersFromService,
  {
    maximumFailuresAllowed: 3, // Open circuit after 3 failures within time window
    timeWindowInMilliseconds: 30000, // 30 seconds - rolling window for failure counting
    resetTimeoutInMilliseconds: 30000, // 30 seconds - wait before testing recovery
  },
  getUsersFallback,
);

/**
 * Orders API call protected by circuit breaker
 * - Service discovery finds the service URL
 * - Circuit breaker handles failures and provides fallback
 */
const protectedFetchOrders = createCircuitBreakerMethod(
  fetchOrdersFromService,
  {
    maximumFailuresAllowed: 3, // Open circuit after 3 failures within time window
    timeWindowInMilliseconds: 30000, // 30 seconds - rolling window for failure counting
    resetTimeoutInMilliseconds: 10000, // 10 seconds - wait before testing recovery
  },
  getOrdersFallback,
);

// =============================================================================
// API ENDPOINTS
// =============================================================================

// Web Interface
app.get('/', (req: Request, res: Response) => {
  res.send(API_GATEWAY_DASHBOARD_HTML);
});

/**
 * Health check endpoint - includes service discovery status
 */
app.get('/health', async (req: Request, res: Response) => {
  // Check service discovery health
  const discoveryHealth = await discoveryClient.healthCheck();

  res.json({
    service: 'api-gateway',
    instance: discoveryClient.getServiceId(),
    status: 'healthy',
    port: port,
    timestamp: new Date().toISOString(),
    serviceDiscovery: {
      status: discoveryHealth.status,
      server: discoveryHealth.discoveryServer,
      ...(discoveryHealth.error && { error: discoveryHealth.error }),
    },
    cache: discoveryClient.getCacheStatus(),
  });
});

/**
 * Get all users (with service discovery + circuit breaker protection)
 */
app.get('/users', async (req: Request, res: Response) => {
  try {
    console.log('📥 Request received for /users');
    const users = await protectedFetchUsers();

    res.json({
      users,
      meta: {
        source: 'service-discovery + circuit-breaker',
        instance: discoveryClient.getServiceId(),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('❌ Error in /users endpoint:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      message: error instanceof Error ? error.message : 'Unknown error',
      instance: discoveryClient.getServiceId(),
    });
  }
});

/**
 * Get orders for a specific user (with service discovery + circuit breaker protection)
 */
app.get('/orders/user/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    console.log(`📥 Request received for /orders/user/${userId}`);
    const orders = await protectedFetchOrders(userId);

    res.json({
      orders,
      meta: {
        userId,
        source: 'service-discovery + circuit-breaker',
        instance: discoveryClient.getServiceId(),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error(`❌ Error in /orders/user/${req.params.userId} endpoint:`, error);
    res.status(500).json({
      error: 'Failed to fetch orders',
      message: error instanceof Error ? error.message : 'Unknown error',
      instance: discoveryClient.getServiceId(),
    });
  }
});

/**
 * Get all users with their orders (combined endpoint)
 * Demonstrates multiple service calls with shared protection
 */
app.get('/users-with-orders', async (req: Request, res: Response) => {
  try {
    console.log('📥 Request received for /users-with-orders');

    // First, get all users (with circuit breaker protection)
    const users = await protectedFetchUsers();
    console.log(`📊 Found ${users.length} users`);

    // Then, get orders for each user (with circuit breaker protection)
    const usersWithOrders: UserWithOrders[] = await Promise.all(
      users.map(async (user): Promise<UserWithOrders> => {
        console.log(`🔍 Fetching orders for user ${user.id}`);
        const orders = await protectedFetchOrders(user.id);
        return { ...user, orders };
      }),
    );

    res.json({
      users: usersWithOrders,
      meta: {
        totalUsers: usersWithOrders.length,
        totalOrders: usersWithOrders.reduce((sum, user) => sum + user.orders.length, 0),
        source: 'service-discovery + circuit-breaker',
        instance: discoveryClient.getServiceId(),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('❌ Error in /users-with-orders endpoint:', error);
    res.status(500).json({
      error: 'Failed to fetch users with orders',
      message: error instanceof Error ? error.message : 'Unknown error',
      instance: discoveryClient.getServiceId(),
    });
  }
});

// =============================================================================
// GRACEFUL SHUTDOWN HANDLING
// =============================================================================

/**
 * Handle graceful shutdown
 */
async function gracefulShutdown(signal: string) {
  console.log(`\n🛑 Received ${signal}, starting graceful shutdown...`);

  try {
    // Unregister from service discovery
    await discoveryClient.unregister();
    console.log('✅ Unregistered from service discovery');

    // Exit gracefully
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// =============================================================================
// SERVER STARTUP
// =============================================================================

app.listen(port, async () => {
  console.log(`🚀 API Gateway running on port ${port}`);

  console.log('\n📚 API Gateway Endpoints:');
  console.log(`  - Dashboard: http://localhost:${port}/`);
  console.log(`  - Health (with discovery status): http://localhost:${port}/health`);
  console.log(`  - Users (protected): http://localhost:${port}/users`);
  console.log(`  - Orders (protected): http://localhost:${port}/orders/user/:userId`);
  console.log(`  - Combined (protected): http://localhost:${port}/users-with-orders`);

  console.log('\n🌟 Architecture Features:');
  console.log('  ✅ Service Discovery - Automatic service URL resolution');
  console.log('  ✅ Circuit Breaker - Failure protection with fallbacks');
  console.log('  ✅ Load Balancing - Random selection from available instances');
  console.log('  ✅ Caching - Performance optimization for service lookups');
  console.log('  ✅ Health Monitoring - Service and discovery server status');
  console.log('  ✅ Graceful Shutdown - Clean unregistration on exit');

  try {
    // Register with service discovery
    console.log('\n🔗 Registering with service discovery...');
    await discoveryClient.register('api-gateway', port);
    console.log(`✅ API Gateway registered as: ${discoveryClient.getServiceId()}`);

    console.log('\n🎯 Ready to serve requests!');
    console.log('\n💡 Try these learning scenarios:');
    console.log('  1. Make requests while all services are running');
    console.log('  2. Stop user-service to see circuit breaker fallbacks');
    console.log('  3. Stop order-service to see partial failures handled gracefully');
    console.log('  4. Check /health to view API Gateway and service discovery status');
    console.log('  5. Use Ctrl+C to see graceful shutdown');
  } catch (error) {
    console.error('❌ Failed to register with service discovery:', error);
    console.log('⚠️  Gateway will run without service discovery registration');
  }
});

export default app;
