import { Request } from 'express';

/**
 * =============================================================================
 * SERVICE DISCOVERY SERVER - TYPE DEFINITIONS
 * =============================================================================
 *
 * This file contains all TypeScript type definitions for our service discovery
 * system. Service discovery allows microservices to find and communicate with
 * each other automatically.
 *
 * Key Concepts:
 * - Service: An application running on a specific IP and port
 * - Registration: When a service tells the discovery server "I exist"
 * - Heartbeat: Regular "I'm still alive" messages from services
 * - Discovery: Finding available services by name
 * =============================================================================
 */

// =============================================================================
// CORE SERVICE TYPES
// =============================================================================

/**
 * ServiceInstance - Represents a single running service in our system
 *
 * Think of this as a "business card" for each service that contains
 * all the information needed to contact it and track its health.
 *
 * Example: A "user-service" running on 192.168.1.10:3001
 */
export interface ServiceInstance {
  /** Unique identifier for this specific service instance (name-ip-port) */
  id: string;

  /** Human-readable name of the service (e.g., "user-service", "payment-api") */
  name: string;

  /** IP address where this service can be reached */
  ip: string;

  /** Port number where this service is listening */
  port: number;

  /** How often (in seconds) this service sends heartbeat messages */
  heartbeatInterval: number;

  /** Timestamp when this service first registered with us */
  registeredAt: number;

  /** Timestamp of the last heartbeat we received from this service */
  lastHeartbeat: number;
}

/**
 * ServiceResponse - Sanitized service information sent to clients
 *
 * This is what we send back when someone asks "what services are available?"
 * It's similar to ServiceInstance but may include additional status information.
 */
export interface ServiceResponse extends ServiceInstance {
  /** Optional status field (e.g., "alive", "warning") */
  status?: string;
}

// =============================================================================
// REQUEST TYPES - What clients send TO our server
// =============================================================================

/**
 * Service Registry Interface
 *
 * Common interface for service registration and heartbeat communication.
 * Services use this interface to register themselves with the service registry
 * and maintain their active status through periodic heartbeat messages.
 *
 * Usage:
 * 1. When a service starts up, it sends a RegisterRequest to /register
 * 2. The service then periodically sends HeartbeatRequest to /heartbeat
 * 3. If heartbeats stop, the service is considered dead and removed
 *
 * Example Registration:
 * POST /register
 * {
 *   "name": "user-service",
 *   "port": 3001,
 *   "heartbeatInterval": 30
 * }
 *
 * Example Heartbeat:
 * POST /heartbeat
 * {
 *   "name": "user-service",
 *   "port": 3001,
 *   "heartbeatInterval": 30
 * }
 */

/**
 * Base interface for service communication
 * Contains common fields used by both registration and heartbeat requests
 */
interface ServiceRequest {
  /** Name of the service (must be unique across the registry) */
  name: string;

  /** Port where the service is running */
  port: number;

  /** How often (in seconds) the service will send heartbeats (default: 30) */
  heartbeatInterval?: number;
}

/**
 * RegisterRequest - Data sent when a service wants to register
 *
 * When a new service starts up, it sends this information to say:
 * "Hi, I'm a new service, please add me to your registry!"
 */
export interface RegisterRequest extends ServiceRequest {}

/**
 * HeartbeatRequest - Data sent in heartbeat messages
 *
 * Services send this periodically to say "I'm still alive and working!"
 * If we don't receive heartbeats, we assume the service is dead.
 */
export interface HeartbeatRequest extends ServiceRequest {}

// =============================================================================
// RESPONSE TYPES - What our server sends BACK to clients
// =============================================================================

/**
 * RegisterResponse - What we send back after successful registration
 *
 * When a service registers successfully, we send back confirmation
 * with important details they need to know.
 */
export interface RegisterResponse {
  /** The unique ID we assigned to this service instance */
  id: string;

  /** Confirmed heartbeat interval (we might adjust it) */
  heartbeatInterval: number;

  /** Timestamp when registration completed */
  registeredAt: number;
}

/**
 * HeartbeatResponse - Confirmation that we received a heartbeat
 *
 * When a service sends a heartbeat, we respond with this to confirm
 * we're still tracking them and when they should send the next one.
 */
export interface HeartbeatResponse {
  /** Always true if heartbeat was processed successfully */
  ok: boolean;

  /** Timestamp when we processed this heartbeat */
  lastHeartbeat: number;

  /** Seconds until the next heartbeat should be sent */
  nextHeartbeatIn: number;
}

/**
 * ServicesResponse - List of available services for a specific service name
 *
 * When someone asks "show me all instances of user-service", we respond
 * with this. It contains an array of all healthy instances.
 *
 * Example response from GET /services/user-service:
 * {
 *   "services": [
 *     { "id": "user-service-192.168.1.10-3001", "name": "user-service", ... },
 *     { "id": "user-service-192.168.1.11-3001", "name": "user-service", ... }
 *   ]
 * }
 */
export interface ServicesResponse {
  /** Array of all healthy instances of the requested service */
  services: ServiceResponse[];
}

/**
 * AllServicesResponse - Complete registry of all services organized by name
 *
 * When someone asks "show me everything" (GET /services), we send this.
 * It's organized as an object where keys are service names and values
 * are arrays of instances.
 *
 * Example:
 * {
 *   "user-service": [
 *     { "id": "user-service-192.168.1.10-3001", ... }
 *   ],
 *   "payment-service": [
 *     { "id": "payment-service-192.168.1.20-3002", ... }
 *   ]
 * }
 */
export interface AllServicesResponse {
  /** Object mapping service names to arrays of their instances */
  [serviceName: string]: ServiceResponse[];
}

/**
 * ErrorResponse - Standard error format for all API endpoints
 *
 * When something goes wrong, we always respond with this format.
 * It provides a human-readable error message.
 */
export interface ErrorResponse {
  /** Human-readable description of what went wrong */
  error: string;
}

/**
 * SuccessResponse - Standard success format for operations
 *
 * For operations that don't return data (like deleting a service),
 * we send back a simple success confirmation.
 */
export interface SuccessResponse {
  /** Human-readable success message */
  message: string;
}

// =============================================================================
// EXPRESS.JS INTEGRATION TYPES
// =============================================================================

/**
 * TypedRequest - Enhanced Express Request with typed body
 *
 * Express.js requests don't know what type of data is in req.body by default.
 * This generic type lets us specify the expected body type for better
 * type safety and autocompletion.
 *
 * Usage: TypedRequest<RegisterRequest> means req.body will be a RegisterRequest
 */
export interface TypedRequest<T> extends Request {
  /** The request body with a specific type instead of 'any' */
  body: T;
}

// =============================================================================
// DATA STORAGE TYPES
// =============================================================================

/**
 * ServiceGroup - Collection of all instances for one service name
 *
 * Since we can have multiple instances of the same service (for load balancing
 * or high availability), we group them together. This is a Map where:
 * - Key: service instance ID (e.g., "user-service-192.168.1.10-3001")
 * - Value: the ServiceInstance object with all details
 *
 * Example: All instances of "user-service" would be stored in one ServiceGroup
 */
export type ServiceGroup = Map<string, ServiceInstance>;

/**
 * ServicesMap - The main registry storing all services
 *
 * This is our main data structure - a Map of Maps:
 * - Outer Map Key: service name (e.g., "user-service")
 * - Outer Map Value: ServiceGroup (containing all instances of that service)
 *
 * Structure visualization:
 * ServicesMap {
 *   "user-service" => ServiceGroup {
 *     "user-service-192.168.1.10-3001" => ServiceInstance {...}
 *     "user-service-192.168.1.11-3001" => ServiceInstance {...}
 *   },
 *   "payment-service" => ServiceGroup {
 *     "payment-service-192.168.1.20-3002" => ServiceInstance {...}
 *   }
 * }
 */
export type ServicesMap = Map<string, ServiceGroup>;

// =============================================================================
// USAGE EXAMPLES AND PATTERNS
// =============================================================================

/**
 * COMMON USAGE PATTERNS:
 *
 * 1. SERVICE REGISTRATION:
 *    - Service sends RegisterRequest to POST /register
 *    - Server responds with RegisterResponse
 *    - Service is now tracked in the registry
 *
 * 2. HEALTH MONITORING:
 *    - Service sends HeartbeatRequest to POST /heartbeat every X seconds
 *    - Server updates lastHeartbeat timestamp
 *    - Server responds with HeartbeatResponse
 *
 * 3. SERVICE DISCOVERY:
 *    - Client sends GET /services/user-service
 *    - Server responds with ServicesResponse containing healthy instances
 *    - Client can now connect to any of the returned instances
 *
 * 4. SERVICE CLEANUP:
 *    - Server automatically removes services that stop sending heartbeats
 *    - Services can explicitly unregister with DELETE /services/:name/:port
 *
 * 5. MONITORING:
 *    - Admins can view all services with GET /services
 *    - Dashboard shows real-time service health status
 */
