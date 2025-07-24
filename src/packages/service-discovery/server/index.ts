import express, { Request, Response } from 'express';
import { DASHBOARD_HTML } from './constants';
import {
  ServiceInstance,
  ServiceGroup,
  ServicesMap,
  RegisterRequest,
  HeartbeatRequest,
  TypedRequest,
  RegisterResponse,
  HeartbeatResponse,
  ServicesResponse,
  AllServicesResponse,
  ErrorResponse,
  SuccessResponse,
} from './server.types';

const app = express();
const port: number = 3000;

app.use(express.json());
app.use(express.static('public'));

// Store services by name, each service can have multiple instances
const services: ServicesMap = new Map();

// Helper function to extract IP from request
function getClientIP(req: Request): string {
  return req.ip || req.connection.remoteAddress || '127.0.0.1';
}

// Helper function to create service instance ID
function createServiceId(name: string, ip: string, port: number): string {
  return `${name}-${ip}-${port}`;
}

// Helper function to check if service is alive
function isServiceAlive(service: ServiceInstance): boolean {
  const now: number = Date.now();
  const timeSinceLastHeartbeat: number = now - service.lastHeartbeat;
  const graceTime: number = service.heartbeatInterval * 1000 * 0.5; // 50% grace
  const maxAllowedTime: number = service.heartbeatInterval * 1000 + graceTime;

  return timeSinceLastHeartbeat <= maxAllowedTime;
}

// 1. Register Service
app.post('/register', (req: TypedRequest<RegisterRequest>, res: Response<RegisterResponse | ErrorResponse>) => {
  const { name, port, heartbeatInterval = 30 } = req.body;

  if (!name || !port) {
    return res.status(400).json({ error: 'Name and port are required' });
  }

  const ip: string = getClientIP(req);
  const id: string = createServiceId(name, ip, port);
  const now: number = Date.now();

  // Get or create service group
  if (!services.has(name)) {
    services.set(name, new Map<string, ServiceInstance>());
  }

  const serviceGroup: ServiceGroup = services.get(name)!;

  // Add this instance to the service group
  serviceGroup.set(id, {
    id,
    name,
    ip,
    port,
    heartbeatInterval,
    registeredAt: now,
    lastHeartbeat: now,
  });

  res.json({
    id,
    heartbeatInterval,
    registeredAt: now,
  });
});

// 2. Heartbeat
app.post('/heartbeat', (req: TypedRequest<HeartbeatRequest>, res: Response<HeartbeatResponse | ErrorResponse>) => {
  const { name, port, heartbeatInterval = 30 } = req.body;

  if (!name || !port) {
    return res.status(400).json({ error: 'Name and port are required' });
  }

  const ip: string = getClientIP(req);
  const id: string = createServiceId(name, ip, port);
  const now: number = Date.now();

  // Get or create service group
  if (!services.has(name)) {
    services.set(name, new Map<string, ServiceInstance>());
  }

  const serviceGroup: ServiceGroup = services.get(name)!;

  // Get or create service entity
  if (!serviceGroup.has(id)) {
    serviceGroup.set(id, {
      id,
      name,
      ip,
      port,
      heartbeatInterval,
      registeredAt: now,
      lastHeartbeat: now,
    });
  }

  const service: ServiceInstance = serviceGroup.get(id)!;

  // Update last heartbeat
  service.lastHeartbeat = now;

  res.json({
    ok: true,
    lastHeartbeat: now,
    nextHeartbeatIn: service.heartbeatInterval,
  });
});

// 3. Discover Services
app.get('/services/:name', (req: Request, res: Response<ServicesResponse>) => {
  const { name } = req.params;

  if (!services.has(name)) {
    return res.json({ services: [] });
  }

  const serviceGroup: ServiceGroup = services.get(name)!;

  // Filter only alive services and construct response
  const aliveServices = Array.from(serviceGroup.values()).filter((service: ServiceInstance) => isServiceAlive(service));

  res.json({ services: aliveServices });
});

// 4. Get all services (for admin/debugging)
app.get('/services', (req: Request, res: Response<AllServicesResponse>) => {
  const allServices: AllServicesResponse = {};

  for (const [serviceName, serviceGroup] of services.entries()) {
    allServices[serviceName] = Array.from(serviceGroup.values())
      .filter((service: ServiceInstance) => isServiceAlive(service))
      .map((service: ServiceInstance) => ({ ...service, status: 'alive' }));
  }

  res.json(allServices);
});

// 5. Remove service
app.delete('/services/:name/:port', (req: Request, res: Response<SuccessResponse | ErrorResponse>) => {
  const { name, port } = req.params;
  const ip: string = getClientIP(req);
  const id: string = createServiceId(name, ip, parseInt(port));

  if (!services.has(name)) {
    return res.status(404).json({ error: 'Service not found' });
  }

  const serviceGroup: ServiceGroup = services.get(name)!;

  const deleted: boolean = serviceGroup.delete(id);

  // Remove service group if empty
  if (serviceGroup.size === 0) {
    services.delete(name);
  }

  if (deleted) {
    res.json({ message: 'Service removed successfully' });
  } else {
    res.status(404).json({ error: 'Service instance not found' });
  }
});

// Web Interface
app.get('/', (req: Request, res: Response) => {
  res.send(DASHBOARD_HTML);
});

// Cleanup dead services every 60 seconds
setInterval(() => {
  let removedCount: number = 0;

  for (const [serviceName, serviceGroup] of services.entries()) {
    for (const [serviceId, service] of serviceGroup.entries()) {
      if (!isServiceAlive(service)) {
        serviceGroup.delete(serviceId);
        removedCount++;
      }
    }

    // Remove empty service groups
    if (serviceGroup.size === 0) {
      services.delete(serviceName);
    }
  }

  if (removedCount > 0) {
    console.log(`🧹 Cleaned up ${removedCount} dead services`);
  }
}, 60 * 1000);

app.listen(port, () => {
  console.log(`🚀 Service Discovery Server running at http://localhost:${port}`);
  console.log(`📊 Dashboard available at http://localhost:${port}`);
});
