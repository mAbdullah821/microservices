# Microservices Service Discovery System

A complete service discovery implementation with client, server, and spawner components for managing microservices communication and discovery.

## 🚀 Features <span id="features"></span>

- **Service Discovery Server** with registration, heartbeat, and discovery endpoints
- **Service Discovery Client** with intelligent caching and load balancing
- **Service Spawner** to manage multiple service instances (and the discovery server)
- **Example Services** (User & Order) with health checks
- **Web Dashboard** for monitoring registered services

## 📋 Table of Contents <span id="table-of-contents"></span>

- [🚀 Features](#features)
- [📋 Table of Contents](#table-of-contents)
- [🏗️ Architecture Overview](#architecture-overview)
- [🧩 Components](#components)
- [📦 Installation](#installation)
- [🚀 Usage](#usage)
- [📚 API Reference](#api-reference)
- [🖥️ Dashboard](#dashboard)
- [💡 Examples](#examples)
- [🔧 Configuration](#configuration)
- [🐛 Troubleshooting](#troubleshooting)

## 🏗️ Architecture Overview <span id="architecture-overview"></span>

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Service  │    │  Order Service   │    │ Service Spawner │
│   (Port 4000+)  │    │   (Port 5000+)   │    │                 │
└─────────┬───────┘    └──────────┬───────┘    └─────────┬───────┘
          │                       │                      │
          └───────────────────────┼──────────────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │  Service Discovery Client │
                    │     (Caching & LB)        │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │  Service Discovery Server │
                    │      (Port 3000)          │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │   Web Dashboard           │
                    │   (Monitoring UI)         │
                    └───────────────────────────┘
```

## 🧩 Components <span id="components"></span>

### 1. Service Discovery Server (`service-discovery-server/`)

The central registry that manages service registration, health monitoring, and discovery.

**Key Features:**

- Service registration with automatic IP detection
- Heartbeat monitoring with configurable intervals
- Automatic cleanup of dead services
- RESTful API for service discovery
- Web dashboard for monitoring

**Endpoints:**

- `POST /register` - Register a new service
- `POST /heartbeat` - Send heartbeat to keep service alive
- `GET /services/:name` - Discover services by name
- `GET /services` - Get all registered services
- `DELETE /services/:name/:port` - Remove a service
- `GET /` - Web dashboard

### 2. Service Discovery Client (`service-discovery-client/`)

A client library that services use to register themselves and discover other services.

**Key Features:**

- Automatic service registration
- Periodic heartbeat sending
- Intelligent caching with TTL
- Load balancing with random selection
- Graceful fallback to stale cache
- Health check capabilities

### 3. Service Spawner (`service.spawner.app.js`)

Manages the lifecycle of the entire system:

- **Automatically starts the Service Discovery Server**
- Waits for the discovery server to be ready before spawning services
- Spawns multiple instances of each service
- Automatic port assignment
- Health checks before starting services
- Graceful shutdown handling
- Process management

### 4. Example Services

#### User Service (`user.service.app.js`)

- Manages user data
- Demonstrates service-to-service communication
- Health check endpoint
- CORS enabled

#### Order Service (`order.service.app.js`)

- Manages order data
- Provides order lookup by user
- Health check endpoint
- CORS enabled

## 📦 Installation <span id="installation"></span>

1. **Clone the repository:**

```bash
git clone <repository-url>
cd "Level 1 - Communication and Discovery"
```

2. **Install dependencies (single step):**

```bash
npm install
```

## 🚀 Usage <span id="usage"></span>

### Quick Start (Recommended)

1. **Start the entire system (discovery server, user & order services):**

```bash
npm start
```

This will automatically:

- Start the Service Discovery Server (on port 3000)
- Wait for the server to be ready
- Spawn 3 User Service instances (ports 4000-4002)
- Spawn 3 Order Service instances (ports 5000-5002)

2. **Access the Dashboard:**
   Open `http://localhost:3000` in your browser to view the service discovery dashboard.

3. **Try Example Endpoints:**

- User Service: `http://localhost:4000/users`, `http://localhost:4000/health`
- Order Service: `http://localhost:5000/orders/user/1`, `http://localhost:5000/health`

### Manual Service Management

You can also start services individually (not recommended, as the spawner manages everything):

```bash
# Start User Service on specific port
PORT=4000 node user.service.app.js

# Start Order Service on specific port
PORT=5000 node order.service.app.js

# Start Service Discovery Server manually (not needed if using npm start)
node service-discovery-server/index.js
```

## 📚 API Reference <span id="api-reference"></span>

### Service Discovery Server API

#### Register Service

```http
POST /register
Content-Type: application/json

{
  "name": "user-service",
  "port": 4000,
  "heartbeatInterval": 30
}
```

#### Send Heartbeat

```http
POST /heartbeat
Content-Type: application/json

{
  "name": "user-service",
  "port": 4000,
  "heartbeatInterval": 30
}
```

#### Discover Services

```http
GET /services/user-service
```

#### Get All Services

```http
GET /services
```

### Service Discovery Client API

```javascript
const ServiceDiscoveryClient = require("./service-discovery-client");

// Initialize client
const client = new ServiceDiscoveryClient("http://localhost:3000");

// Register service
await client.register("user-service", 4000);

// Discover service URL
const serviceUrl = await client.getServiceUrl("order-service");

// Get cache status
const cacheStatus = client.getCacheStatus();

// Health check
const health = await client.healthCheck();
```

## 🖥️ Dashboard <span id="dashboard"></span>

The web dashboard provides real-time monitoring of all registered services:

- **Service Overview**: List of all registered services
- **Instance Details**: Individual service instances with status
- **Health Monitoring**: Real-time heartbeat status
- **Service Management**: Manual registration and removal
- **Statistics**: Service counts and uptime information

Access the dashboard at: `http://localhost:3000`

## 💡 Examples <span id="examples"></span>

### Service-to-Service Communication

The User Service demonstrates how to communicate with the Order Service:

```javascript
// Get order service URL using service discovery
const orderServiceUrl = await client.getServiceUrl("order-service");

// Make request to order service
const response = await axios.get(`${orderServiceUrl}/orders/user/${userId}`);
```

### Health Checks

All services include health check endpoints:

```bash
# User Service health check
curl http://localhost:4000/health

# Order Service health check
curl http://localhost:5000/health
```

### Load Balancing

The service discovery client automatically load balances requests:

```javascript
// Each call may return a different service instance
const serviceUrl1 = await client.getServiceUrl("user-service");
const serviceUrl2 = await client.getServiceUrl("user-service");
// serviceUrl1 and serviceUrl2 may be different instances
```

## 🔧 Configuration <span id="configuration"></span>

### Service Discovery Server

- **Port**: 3000 (default)
- **Heartbeat Grace Period**: 50% of heartbeat interval
- **Cleanup Interval**: 60 seconds

### Service Discovery Client

- **Default Heartbeat Interval**: 30 seconds
- **Cache Multiplier**: 2x heartbeat interval
- **Request Timeout**: 5 seconds

### Service Spawner

- **Automatically starts the Service Discovery Server**
- **User Service Ports**: 4000-4002
- **Order Service Ports**: 5000-5002
- **Startup Delay**: 2 seconds between services

## 🐛 Troubleshooting <span id="troubleshooting"></span>

### Common Issues

1. **Service Discovery Server Not Responding**

   - Ensure the server is running on port 3000
   - Check for port conflicts

2. **Services Not Registering**

   - Verify network connectivity
   - Check firewall settings
   - Ensure correct discovery server URL

3. **Heartbeat Failures**
   - Check network stability
   - Verify service discovery server is accessible
   - Review heartbeat interval settings

---

**Built with ❤️ for microservices architecture learning and development.**
