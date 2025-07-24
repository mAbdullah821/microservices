import express, { Request, Response } from 'express';
import cors from 'cors';
import ServiceDiscoveryClient from '../../packages/service-discovery/client';
import { User, HealthResponse, GetUsersResponse } from './user.types';

const app = express();
const port = parseInt(process.env.PORT || '4000');

// Initialize service discovery client
const client = new ServiceDiscoveryClient('http://localhost:3000');

app.use(express.json());

// Enable CORS
app.use(cors());

// In-memory user data
const users: User[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', age: 30 },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 25 },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', age: 35 },
];

// Health check endpoint
app.get('/health', (req: Request, res: Response<HealthResponse>) => {
  res.json({
    service: 'user-service',
    instance: client.getServiceId(),
    port: port,
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// Get all users (modified to only return users, no orders)
app.get('/users', (req: Request, res: Response<GetUsersResponse>) => {
  res.json({
    users,
    instance: client.getServiceId(),
  });
});

// Start server and register with service discovery
app.listen(port, async () => {
  console.log(`🚀 User Service running on port ${port}`);

  try {
    await client.register('user-service', port);
    console.log(`✅ User Service [${client.getServiceId()}] registered with discovery server`);
  } catch (error) {
    console.error(
      `❌ Failed to register User Service running on port ${port}:`,
      error instanceof Error ? error.message : String(error),
    );
  }
});

export default app;
