# Microservices Architecture with Service Discovery & Circuit Breaker

A comprehensive microservices system demonstrating advanced patterns including service discovery, circuit breaker implementation, load balancing, and real-time monitoring dashboards.

## 🚀 Features <span id="features"></span>

- **🔍 Service Discovery System** - Automatic service registration, discovery, and health monitoring
- **⚡ Circuit Breaker Pattern** - Failure protection with intelligent fallback mechanisms
- **⚖️ Load Balancing** - Random selection across multiple service instances
- **🎯 API Gateway** - Centralized routing with circuit breaker protection
- **📊 Real-time Dashboards** - Interactive monitoring for both API Gateway and Service Discovery
- **🔄 Auto-refresh Monitoring** - Configurable health checks with adjustable refresh rates
- **🧪 Comprehensive Testing** - Built-in scenarios for learning microservices patterns
- **🛡️ Graceful Degradation** - Fallback responses when services are unavailable
- **📈 Performance Optimization** - Intelligent caching and connection pooling

## 📋 Table of Contents <span id="table-of-contents"></span>

- [🚀 Features](#features)
- [📋 Table of Contents](#table-of-contents)
- [🏗️ Architecture Overview](#architecture-overview)
- [🧩 Components](#components)
- [📦 Installation](#installation)
- [🚀 Usage](#usage)
- [📚 API Reference](#api-reference)
- [🖥️ Dashboards](#dashboards)
  - [API Gateway Dashboard](#api-gateway-dashboard)
  - [Service Discovery Dashboard](#service-discovery-dashboard)
- [💡 Learning Scenarios](#learning-scenarios)
- [🔧 Configuration](#configuration)
- [🐛 Troubleshooting](#troubleshooting)

## 🏗️ Architecture Overview <span id="architecture-overview"></span>

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MICROSERVICES ORCHESTRATOR                        │
│                              (Process Manager)                              │
└─────────────────────┬───────────────────────────────────────────────────────┘
                      │
┌─────────────────────▼─────────────────────┐    ┌─────────────────────────────┐
│         SERVICE DISCOVERY SERVER          │    │      USER SERVICE           │
│              (Port 3000)                  │    │    (Ports 4000-4002)        │
│  • Service Registration                   │    │  • User Management          │
│  • Health Monitoring                      │    │  • Health Checks            │
│  • Web Dashboard                          │    │  • Service Discovery Client │
│  • Automatic Cleanup                      │    │  • Heartbeat Management     │
└─────────────────────┬─────────────────────┘    └─────────────┬───────────────┘
                      │                                        │
                      │                                        │
┌─────────────────────▼─────────────────────┐    ┌─────────────▼───────────────┐
│              API GATEWAY                  │    │      ORDER SERVICE          │
│              (Port 8000)                  │    │    (Ports 5000-5002)        │
│  • Circuit Breaker Protection             │    │  • Order Management         │
│  • Service Discovery Integration          │    │  • Health Checks            │
│  • Load Balancing                         │    │  • Service Discovery Client │
│  • Intelligent Caching                    │    │  • Heartbeat Management     │
│  • Enhanced Web Dashboard                 │    │                             │
│  • Auto-refresh Monitoring                │    │                             │
└─────────────────────┬─────────────────────┘    └─────────────────────────────┘
                      │
                      │
┌─────────────────────▼─────────────────────┐
│              WEB DASHBOARDS               │
│  • API Gateway Dashboard (Port 8000)      │
│  • Service Discovery Dashboard (Port 3000)│
│  • Real-time Health Monitoring            │
│  • Interactive Testing Interface          │
│  • Configurable Auto-refresh              │
└───────────────────────────────────────────┘
```

## 🧩 Components <span id="components"></span>

### 1. **Service Discovery Server** (`src/packages/service-discovery/server/`)

The central registry that manages service registration, health monitoring, and discovery.

**Key Features:**

- **Automatic Service Registration** - Services register themselves with IP detection
- **Heartbeat Monitoring** - Configurable intervals with automatic cleanup
- **RESTful API** - Complete service discovery endpoints
- **Web Dashboard** - Real-time monitoring interface
- **Graceful Cleanup** - Automatic removal of dead services

**Endpoints:**

- `POST /register` - Register a new service
- `POST /heartbeat` - Send heartbeat to keep service alive
- `GET /services/:name` - Discover services by name
- `GET /services` - Get all registered services
- `DELETE /services/:name/:port` - Remove a service
- `GET /` - Web dashboard

### 2. **Service Discovery Client** (`src/packages/service-discovery/client/`)

A TypeScript client library that services use to register themselves and discover other services.

**Key Features:**

- **Automatic Registration** - Self-registration with discovery server
- **Periodic Heartbeats** - Configurable heartbeat intervals
- **Intelligent Caching** - TTL-based caching with stale-while-revalidate
- **Load Balancing** - Random selection from available instances
- **Graceful Fallback** - Fallback to stale cache when discovery fails
- **Health Check Integration** - Built-in health monitoring capabilities

### 3. **Circuit Breaker** (`src/packages/circuit-breaker/`)

Advanced failure protection system that prevents cascade failures.

**Key Features:**

- **Three-State Pattern** - Closed, Open, and Half-Open states
- **Configurable Thresholds** - Failure count, time windows, and reset timeouts
- **Intelligent Fallbacks** - Automatic fallback method execution
- **Method-Level Protection** - Protect individual methods with custom configurations
- **Real-time Monitoring** - State tracking and metrics

**Configuration Options:**

- `maximumFailuresAllowed` - Number of failures before opening circuit
- `timeWindowInMilliseconds` - Rolling window for failure counting
- `resetTimeoutInMilliseconds` - Time to wait before testing recovery

### 4. **API Gateway** (`src/api-gateway.app.ts`)

A comprehensive API Gateway that provides centralized routing with advanced protection.

**Key Features:**

- **Service Discovery Integration** - Automatic service URL resolution
- **Circuit Breaker Protection** - Failure protection with fallback responses
- **Load Balancing** - Random selection from available service instances
- **Intelligent Caching** - Performance optimization for service lookups
- **Enhanced Dashboard** - Interactive interface with 4 dedicated sections
- **Auto-refresh Monitoring** - Configurable health checks (1-10 seconds)
- **Graceful Shutdown** - Clean unregistration on exit

**Architecture Benefits:**

- **Resilience** - Circuit breaker prevents cascade failures
- **Scalability** - Load balancing across multiple service instances
- **Observability** - Comprehensive health checks and monitoring
- **Developer Experience** - Interactive dashboard for testing and learning

### 5. **Microservices Orchestrator** (`src/microservices-orchestrator.ts`)

Manages the complete lifecycle of all microservices in the system.

**Key Features:**

- **Automatic Startup Coordination** - Starts services in the correct order
- **Health Monitoring** - Waits for services to be ready before proceeding
- **Process Management** - Handles multiple service instances
- **Graceful Shutdown** - Clean termination of all processes
- **Port Management** - Automatic port assignment and conflict resolution

### 6. **Example Services**

#### **User Service** (`src/apps/user/`)

- **User Management** - CRUD operations for user data
- **Health Checks** - Standardized health monitoring
- **Service Discovery Integration** - Automatic registration and heartbeats
- **CORS Support** - Cross-origin request handling

#### **Order Service** (`src/apps/order/`)

- **Order Management** - Order creation and retrieval
- **User Association** - Orders linked to specific users
- **Health Checks** - Standardized health monitoring
- **Service Discovery Integration** - Automatic registration and heartbeats

## 📦 Installation <span id="installation"></span>

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Git**

### Setup Instructions

1. **Clone the repository:**

```bash
git clone <repository-url>
cd "Level 1 - Communication and Discovery"
```

2. **Install dependencies:**

```bash
npm install
```

3. **Verify installation:**

```bash
npm run dev --help
```

## 🚀 Usage <span id="usage"></span>

### Quick Start (Recommended)

1. **Start the entire system:**

```bash
npm run dev
```

This single command will automatically:

- Start the Service Discovery Server (port 3000)
- Wait for discovery server to be ready
- Spawn 3 User Service instances (ports 4000-4002)
- Spawn 3 Order Service instances (ports 5000-5002)
- Start the API Gateway (port 8000) with circuit breaker protection

2. **Access the Dashboards:**

   - **API Gateway Dashboard**: `http://localhost:8000/`
   - **Service Discovery Dashboard**: `http://localhost:3000/`

3. **Test the System:**
   - Use the interactive dashboard at `http://localhost:8000/`
   - Try the learning scenarios described below
   - Monitor real-time health status

### Individual Service Management

You can also start services individually for development:

```bash
# Start Service Discovery Server only
npm run service-discovery

# Start User Service only
npm run user-service

# Start Order Service only
npm run order-service

# Start API Gateway only
npm run api-gateway
```

### Port Configuration

The system uses the following port assignments:

- **Service Discovery Server**: 3000
- **API Gateway**: 8000
- **User Services**: 4000-4002
- **Order Services**: 5000-5002

## 📚 API Reference <span id="api-reference"></span>

### API Gateway Endpoints

#### **Dashboard Interface**

```http
GET /
```

Returns the interactive API Gateway dashboard with 4 sections and real-time monitoring.

#### **Health Check**

```http
GET /health
```

Returns comprehensive health status including service discovery connection and cache information.

**Response:**

```json
{
  "service": "api-gateway",
  "instance": "api-gateway-8000",
  "status": "healthy",
  "port": 8000,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "serviceDiscovery": {
    "status": "connected",
    "server": "http://localhost:3000"
  },
  "cache": {
    "user-service": {
      "cached": true,
      "ttl": 45,
      "services": 3
    }
  }
}
```

#### **Get All Users**

```http
GET /users
```

Retrieves all users with circuit breaker protection and service discovery.

**Response:**

```json
{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "age": 30
    }
  ],
  "meta": {
    "source": "service-discovery + circuit-breaker",
    "instance": "api-gateway-8000",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

#### **Get User Orders**

```http
GET /orders/user/:userId
```

Retrieves orders for a specific user with circuit breaker protection.

**Response:**

```json
{
  "orders": [
    {
      "id": 1,
      "userId": 1,
      "products": ["Product A", "Product B"]
    }
  ],
  "meta": {
    "userId": 1,
    "source": "service-discovery + circuit-breaker",
    "instance": "api-gateway-8000",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

#### **Get Users with Orders**

```http
GET /users-with-orders
```

Combined endpoint that retrieves all users with their associated orders.

**Response:**

```json
{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "age": 30,
      "orders": [
        {
          "id": 1,
          "userId": 1,
          "products": ["Product A"]
        }
      ]
    }
  ],
  "meta": {
    "totalUsers": 1,
    "totalOrders": 1,
    "source": "service-discovery + circuit-breaker",
    "instance": "api-gateway-8000",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### Service Discovery Server API

#### **Register Service**

```http
POST /register
Content-Type: application/json

{
  "name": "user-service",
  "port": 4000,
  "heartbeatInterval": 30
}
```

#### **Send Heartbeat**

```http
POST /heartbeat
Content-Type: application/json

{
  "name": "user-service",
  "port": 4000,
  "heartbeatInterval": 30
}
```

#### **Discover Services**

```http
GET /services/user-service
```

#### **Get All Services**

```http
GET /services
```

## 🖥️ Dashboards <span id="dashboards"></span>

### API Gateway Dashboard

**Access**: `http://localhost:8000/`

The API Gateway provides a comprehensive web interface with 4 dedicated sections for monitoring and testing the microservices system.

#### 🎯 Dashboard Features

1. **Four Dedicated Sections**

   - **👥 All Users** - Test and view all users from user service
   - **📦 User Orders** - Test orders for specific user ID (customizable input)
   - **🔗 Users with Orders** - Combined data showing users with their orders
   - **🏥 Health & Cache** - System health, service discovery status, and cache information

2. **Interactive Controls**

   - **🔄 Refresh All** - Manual refresh for all sections
   - **⏱️ Auto-refresh Toggle** - Smart auto-refresh that starts after 5 seconds
   - **🎚️ Refresh Rate Slider** - Adjustable interval from 1-10 seconds
   - **🔗 Service Discovery Link** - Direct access to Service Discovery Dashboard
   - **🧪 Individual Testing** - Test each endpoint independently

3. **Real-time Monitoring**

   - **Live Health Status** - Color-coded indicators with pulse animations
   - **Service Discovery Connection** - Real-time connection monitoring
   - **Circuit Breaker Status** - State tracking and metrics
   - **Cache Information** - TTL, hit rates, and service counts
   - **Instance Tracking** - Service instance identification

4. **Modern UI Features**
   - **Responsive Design** - Works on desktop, tablet, and mobile
   - **Modern Animations** - Smooth hover effects and transitions
   - **Clear Status Indicators** - Visual feedback for all operations
   - **Error Handling** - Graceful error display with retry options
   - **Loading States** - Visual feedback during API calls

#### 🚀 Dashboard Endpoints

- **`GET /`** - **Main Interactive Dashboard**
- **`GET /health`** - API Gateway health with service discovery status
- **`GET /users`** - Get all users (with circuit breaker protection)
- **`GET /orders/user/:userId`** - Get orders for specific user ID
- **`GET /users-with-orders`** - Combined endpoint with all user data

#### 🔧 Dashboard Configuration

The dashboard automatically connects to:

- **Service Discovery Server**: `http://localhost:3000`
- **API Gateway**: `http://localhost:8000`
- **User Services**: `http://localhost:4000-4002`
- **Order Services**: `http://localhost:5000-5002`

### Service Discovery Dashboard

**Access**: `http://localhost:3000/`

The Service Discovery Dashboard provides real-time monitoring of all registered services:

- **Service Overview** - List of all registered services
- **Instance Details** - Individual service instances with status
- **Health Monitoring** - Real-time heartbeat status
- **Service Management** - Manual registration and removal
- **Statistics** - Service counts and uptime information

## 💡 Learning Scenarios <span id="learning-scenarios"></span>

The enhanced dashboard supports comprehensive learning scenarios for understanding microservices patterns:

### 1. **Normal Operation Testing**

- **Scenario**: All services are healthy and responding
- **Actions**: Use the dashboard to test all endpoints
- **Learning**: Understand how service discovery and load balancing work
- **Expected**: All requests succeed with data from different service instances

### 2. **Individual Endpoint Testing**

- **Scenario**: Test specific functionality in isolation
- **Actions**: Use individual "Test Endpoint" buttons for each section
- **Learning**: Understand how each service operates independently
- **Expected**: Targeted testing of specific functionality

### 3. **User ID Customization**

- **Scenario**: Test different user scenarios
- **Actions**: Change user ID in the orders section (try IDs 1, 2, 3)
- **Learning**: Understand how parameterized requests work
- **Expected**: Different order results based on user ID

### 4. **Circuit Breaker Activation**

- **Scenario**: Simulate service failures
- **Actions**: Stop user-service instances (Ctrl+C in their terminals)
- **Learning**: Observe circuit breaker pattern in action
- **Expected**: Fallback responses after 3 failures, then circuit opens

### 5. **Partial Failure Handling**

- **Scenario**: One service fails while others remain healthy
- **Actions**: Stop order-service instances
- **Learning**: Understand graceful degradation
- **Expected**: User data works, order data shows fallbacks

### 6. **Recovery Testing**

- **Scenario**: Services recover from failure
- **Actions**: Restart stopped services
- **Learning**: Observe circuit breaker recovery (half-open state)
- **Expected**: Gradual return to normal operation

### 7. **Auto-refresh Demonstration**

- **Scenario**: Real-time monitoring
- **Actions**: Watch the health section update automatically
- **Learning**: Understand real-time system monitoring
- **Expected**: Health status updates every 5 seconds (configurable)

### 8. **Refresh Rate Adjustment**

- **Scenario**: Customize monitoring frequency
- **Actions**: Use the slider to change refresh rate (1-10 seconds)
- **Learning**: Understand monitoring configuration
- **Expected**: Health checks update at the selected interval

### 9. **Service Discovery Integration**

- **Scenario**: Cross-dashboard navigation
- **Actions**: Click "Service Discovery Dashboard" button
- **Learning**: Understand how different monitoring tools work together
- **Expected**: Opens Service Discovery Dashboard in new tab

### 10. **Load Balancing Verification**

- **Scenario**: Multiple service instances
- **Actions**: Make multiple requests to the same endpoint
- **Learning**: Observe load balancing in action
- **Expected**: Requests distributed across different service instances

## 🔧 Configuration <span id="configuration"></span>

### Circuit Breaker Configuration

The circuit breaker can be configured with these parameters:

```typescript
const circuitBreakerConfig = {
  maximumFailuresAllowed: 3, // Open circuit after 3 failures
  timeWindowInMilliseconds: 30000, // Within 30-second window
  resetTimeoutInMilliseconds: 30000, // Wait 30 seconds before testing recovery
};
```

### Service Discovery Configuration

#### Client Options

```typescript
const clientOptions = {
  defaultHeartbeatInterval: 30, // 30 seconds
  cacheMultiplier: 2, // Cache for 60 seconds
  requestTimeout: 5000, // 5 second timeout
};
```

#### Server Configuration

- **Port**: 3000 (default)
- **Heartbeat Grace Period**: 50% of heartbeat interval
- **Cleanup Interval**: 60 seconds

### API Gateway Configuration

- **Port**: 8000 (default)
- **Service Discovery URL**: `http://localhost:3000`
- **Circuit Breaker**: Applied to all external service calls
- **CORS**: Enabled for cross-origin requests
- **Auto-refresh**: 5 seconds default, configurable 1-10 seconds

### Microservices Orchestrator Configuration

- **Service Discovery Server**: Port 3000
- **User Service Instances**: Ports 4000-4002
- **Order Service Instances**: Ports 5000-5002
- **API Gateway**: Port 8000
- **Startup Delay**: 2 seconds between services

## 🐛 Troubleshooting <span id="troubleshooting"></span>

### Common Issues

#### 1. **Port Already in Use**

```bash
# Check what's using the port
netstat -ano | findstr :3000

# Kill the process
taskkill //F //PID <process_id>
```

#### 2. **Service Discovery Server Not Responding**

- Ensure the server is running on port 3000
- Check for port conflicts
- Verify network connectivity

#### 3. **Services Not Registering**

- Verify network connectivity
- Check firewall settings
- Ensure correct discovery server URL
- Check service logs for registration errors

#### 4. **Circuit Breaker Not Working**

- Verify circuit breaker configuration
- Check fallback methods are properly defined
- Monitor circuit breaker state in dashboard
- Ensure service failures are actually occurring

#### 5. **Dashboard Not Loading**

- Check if API Gateway is running on port 8000
- Verify Service Discovery Server is accessible
- Check browser console for JavaScript errors
- Ensure CORS is properly configured

#### 6. **Auto-refresh Not Working**

- Check if auto-refresh is enabled in dashboard
- Verify refresh rate is set correctly
- Check browser console for errors
- Ensure health endpoint is responding

### Debug Commands

#### Check Service Status

```bash
# Check all Node.js processes
tasklist | findstr node

# Check specific ports
netstat -ano | findstr ":3000\|:400[0-9]\|:500[0-9]\|:8000"
```

#### Kill All Services

```bash
# Kill all Node.js processes
taskkill //F //IM node.exe
```

#### Restart System

```bash
# Kill all processes and restart
taskkill //F //IM node.exe
npm run dev
```

### Log Analysis

#### Service Discovery Issues

- Check Service Discovery Server logs for registration errors
- Verify heartbeat intervals are appropriate
- Monitor service cleanup logs

#### Circuit Breaker Issues

- Monitor circuit breaker state transitions
- Check failure count and timing
- Verify fallback method execution

#### API Gateway Issues

- Check service discovery client logs
- Monitor circuit breaker activation
- Verify endpoint responses

---

**Built with ❤️ for microservices architecture learning and development.**

_This project demonstrates advanced microservices patterns including service discovery, circuit breaker implementation, load balancing, and comprehensive monitoring systems._
