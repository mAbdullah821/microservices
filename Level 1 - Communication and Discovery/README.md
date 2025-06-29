# Microservices Service Discovery System

A complete service discovery implementation with client, server, and spawner components for managing microservices communication and discovery.

## 🚀 Features

- **Service Discovery Server** with registration, heartbeat, and discovery endpoints
- **Service Discovery Client** with intelligent caching and load balancing
- **Service Spawner** to manage multiple service instances
- **Example Services** (User & Order) with health checks
- **Web Dashboard** for monitoring registered services

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Components](#components)
- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Dashboard](#dashboard)
- [Examples](#examples)

## 🏗️ Architecture Overview

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

## 🧩 Components

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

Manages the lifecycle of multiple service instances.

**Key Features:**

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

## 📦 Installation

1. **Clone the repository:**

```bash
git clone <repository-url>
cd "Level 1 - Communication and Discovery"
```

2. **Install dependencies:**

```bash
npm install
cd service-discovery-server && npm install
cd ../service-discovery-client && npm install
```

3. **Verify installation:**

```bash
node --version
npm --version
```

## 🚀 Usage

### Quick Start

1. **Start the Service Discovery Server:**

```bash
node service-discovery-server/index.js
```

The server will start on `http://localhost:3000`

2. **Start the Service Spawner:**

```bash
node service.spawner.app.js
```

This will automatically spawn:

- 3 User Service instances (ports 4000-4002)
- 3 Order Service instances (ports 5000-5002)

3. **Access the Dashboard:**
   Open `http://localhost:3000` in your browser to view the service discovery dashboard.

### Manual Service Management

You can also start services individually:

```bash
# Start User Service on specific port
PORT=4000 node user.service.app.js

# Start Order Service on specific port
PORT=5000 node order.service.app.js
```

## 📚 API Reference

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

## 🖥️ Dashboard

The web dashboard provides real-time monitoring of all registered services:

- **Service Overview**: List of all registered services
- **Instance Details**: Individual service instances with status
- **Health Monitoring**: Real-time heartbeat status
- **Service Management**: Manual registration and removal
- **Statistics**: Service counts and uptime information

Access the dashboard at: `http://localhost:3000`

## 💡 Examples

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

## 🔧 Configuration

### Service Discovery Server

- **Port**: 3000 (default)
- **Heartbeat Grace Period**: 50% of heartbeat interval
- **Cleanup Interval**: 60 seconds

### Service Discovery Client

- **Default Heartbeat Interval**: 30 seconds
- **Cache Multiplier**: 2x heartbeat interval
- **Request Timeout**: 5 seconds

### Service Spawner

- **User Service Ports**: 4000-4002
- **Order Service Ports**: 5000-5002
- **Startup Delay**: 2 seconds between services

## 🐛 Troubleshooting

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
