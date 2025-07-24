import express, { Request, Response } from 'express';
import ServiceDiscoveryClient from '../../packages/service-discovery/client';
import cors from 'cors';
import { Order, HealthResponse, GetOrdersResponse } from './order.types';

const app = express();
const port = parseInt(process.env.PORT || '5000');

// Initialize service discovery client
const client = new ServiceDiscoveryClient('http://localhost:3000');

app.use(express.json());

// Enable CORS
app.use(cors());

// In-memory order data
const orders: Order[] = [
  { id: 1, userId: 1, products: ['Laptop'] },
  { id: 2, userId: 1, products: ['Mouse'] },
  { id: 3, userId: 2, products: ['Keyboard'] },
  { id: 4, userId: 2, products: ['Monitor'] },
  { id: 5, userId: 3, products: ['Headphones'] },
];

// Health check endpoint
app.get('/health', (req: Request, res: Response<HealthResponse>) => {
  res.json({
    service: 'order-service',
    instance: client.getServiceId(),
    port: port,
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// Get orders for a specific user
app.get('/orders/user/:userId', (req: Request<{ userId: string }>, res: Response<GetOrdersResponse>) => {
  const userId = parseInt(req.params.userId);
  const userOrders = orders.filter((order) => order.userId === userId);

  res.json({
    orders: userOrders,
    userId: userId,
    instance: client.getServiceId(),
    totalOrders: userOrders.length,
  });
});

// Start server and register with service discovery
app.listen(port, async () => {
  console.log(`🚀 Order Service running on port ${port}`);

  try {
    await client.register('order-service', port);
    console.log(`✅ Order Service [${client.getServiceId()}] registered with discovery server`);
  } catch (error) {
    console.error(
      `❌ Failed to register Order Service running on port ${port}:`,
      error instanceof Error ? error.message : String(error),
    );
  }
});

export default app;
