const express = require("express");
const { dashboard_html } = require("./constants");
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static("public"));

// Store services by name, each service can have multiple instances
const services = new Map();

// Helper function to extract IP from request
function getClientIP(req) {
  return req.ip || req.connection.remoteAddress || "127.0.0.1";
}

// Helper function to create service instance ID
function createServiceId(name, ip, port) {
  return `${name}-${ip}-${port}`;
}

// Helper function to check if service is alive
function isServiceAlive(service) {
  const now = Date.now();
  const timeSinceLastHeartbeat = now - service.lastHeartbeat;
  const graceTime = service.heartbeatInterval * 1000 * 0.5; // 50% grace
  const maxAllowedTime = service.heartbeatInterval * 1000 + graceTime;

  return timeSinceLastHeartbeat <= maxAllowedTime;
}

// 1. Register Service
app.post("/register", (req, res) => {
  const { name, port, heartbeatInterval = 30 } = req.body;

  if (!name || !port) {
    return res.status(400).json({ error: "Name and port are required" });
  }

  const ip = getClientIP(req);
  const id = createServiceId(name, ip, port);
  const now = Date.now();

  // Get or create service group
  if (!services.has(name)) {
    services.set(name, new Map());
  }

  const serviceGroup = services.get(name);

  // Add this instance to the service group
  serviceGroup.set(id, {
    id,
    name,
    ip,
    port: parseInt(port),
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
app.post("/heartbeat", (req, res) => {
  const { name, port, heartbeatInterval = 30 } = req.body;

  if (!name || !port) {
    return res.status(400).json({ error: "Name and port are required" });
  }

  const ip = getClientIP(req);
  const id = createServiceId(name, ip, port);
  const now = Date.now();

  // Get or create service group
  if (!services.has(name)) {
    services.set(name, new Map());
  }

  const serviceGroup = services.get(name);

  // Get or create service entity
  if (!serviceGroup.has(id)) {
    serviceGroup.set(id, {
      id,
      name,
      ip,
      port: parseInt(port),
      heartbeatInterval,
      registeredAt: now,
      lastHeartbeat: now,
    });
  }

  const service = serviceGroup.get(id);

  // Update last heartbeat
  service.lastHeartbeat = now;

  res.json({
    ok: true,
    lastHeartbeat: now,
    nextHeartbeatIn: service.heartbeatInterval,
  });
});

// 3. Discover Services
app.get("/services/:name", (req, res) => {
  const { name } = req.params;

  const serviceGroup = services.get(name);
  if (!serviceGroup) {
    return res.json({ services: [] });
  }

  // Filter only alive services and construct response
  const aliveServices = Array.from(serviceGroup.values())
    .filter((service) => isServiceAlive(service))
    .map((service) => ({
      id: service.id,
      name: service.name,
      ip: service.ip,
      port: service.port,
      lastHeartbeat: service.lastHeartbeat,
      registeredAt: service.registeredAt,
      heartbeatInterval: service.heartbeatInterval,
    }));

  res.json({ services: aliveServices });
});

// 4. Get all services (for admin/debugging)
app.get("/services", (req, res) => {
  const allServices = {};

  for (const [serviceName, serviceGroup] of services.entries()) {
    allServices[serviceName] = Array.from(serviceGroup.values())
      .filter((service) => isServiceAlive(service))
      .map((service) => ({
        id: service.id,
        name: service.name,
        ip: service.ip,
        port: service.port,
        lastHeartbeat: service.lastHeartbeat,
        registeredAt: service.registeredAt,
        heartbeatInterval: service.heartbeatInterval,
        status: "alive",
      }));
  }

  res.json(allServices);
});

// 5. Remove service
app.delete("/services/:name/:port", (req, res) => {
  const { name, port } = req.params;
  const ip = getClientIP(req);
  const id = createServiceId(name, ip, port);

  const serviceGroup = services.get(name);
  if (!serviceGroup) {
    return res.status(404).json({ error: "Service not found" });
  }

  const deleted = serviceGroup.delete(id);

  // Remove service group if empty
  if (serviceGroup.size === 0) {
    services.delete(name);
  }

  if (deleted) {
    res.json({ message: "Service removed successfully" });
  } else {
    res.status(404).json({ error: "Service instance not found" });
  }
});

// Web Interface
app.get("/", (req, res) => {
  res.send(dashboard_html);
});

// Cleanup dead services every 60 seconds
setInterval(() => {
  let removedCount = 0;

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
  console.log(
    `🚀 Service Discovery Server running at http://localhost:${port}`
  );
  console.log(`📊 Dashboard available at http://localhost:${port}`);
});
