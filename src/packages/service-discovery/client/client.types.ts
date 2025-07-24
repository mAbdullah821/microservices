/**
 * =============================================================================
 * SERVICE DISCOVERY CLIENT - TYPE DEFINITIONS
 * =============================================================================
 *
 * This file contains all TypeScript type definitions for the service discovery
 * client library. The client handles service registration, heartbeat management,
 * service discovery with caching, and load balancing.
 *
 * Key Concepts:
 * - Registration: Announcing your service to the discovery server
 * - Heartbeat: Periodic "I'm alive" messages to maintain registration
 * - Discovery: Finding and connecting to other services by name
 * - Caching: Local storage of service lists for performance
 * - Load Balancing: Random selection among available service instances
 * =============================================================================
 */

// =============================================================================
// CLIENT CONFIGURATION TYPES
// =============================================================================

/**
 * ServiceDiscoveryClientOptions - Configuration options for creating a client instance
 *
 * These options control the behavior of the service discovery client,
 * including timing, caching, and network settings.
 *
 * Example usage:
 * ```typescript
 * const client = new ServiceDiscoveryClient('http://localhost:3000', {
 *   defaultHeartbeatInterval: 45,  // Send heartbeat every 45 seconds
 *   cacheMultiplier: 3,            // Cache services for 3x heartbeat interval
 *   requestTimeout: 10000          // 10 second HTTP timeout
 * });
 * ```
 */
export interface ServiceDiscoveryClientOptions {
  /**
   * Default interval (in seconds) between heartbeat messages
   *
   * When registering a service, this is the initial heartbeat interval
   * requested from the server. The server may adjust this value.
   *
   * @default 30
   * @example 60 // Send heartbeat every minute
   */
  defaultHeartbeatInterval?: number;

  /**
   * Cache duration multiplier for service discovery results
   *
   * Cache duration = (shortest service heartbeat interval) × cacheMultiplier
   * This ensures we refresh the cache before services might be marked as dead.
   *
   * Higher values = better performance, but potentially stale data
   * Lower values = fresher data, but more network requests
   *
   * @default 2
   * @example 3 // Cache for 3x the heartbeat interval
   */
  cacheMultiplier?: number;

  /**
   * HTTP request timeout in milliseconds
   *
   * Maximum time to wait for responses from the discovery server.
   * Applies to registration, heartbeat, and service lookup requests.
   *
   * @default 5000
   * @example 10000 // 10 second timeout
   */
  requestTimeout?: number;
}

// =============================================================================
// SERVICE INFORMATION TYPES
// =============================================================================

/**
 * CurrentService - Information about the service this client has registered
 *
 * After successful registration, the client stores this information
 * to manage heartbeats and provide status information.
 *
 * This represents the "identity" of the current service instance
 * as known by the discovery server.
 */
export interface CurrentService {
  /**
   * Service name as registered with the discovery server
   *
   * This is the name other services will use to discover this service.
   * Must be unique and descriptive (e.g., "user-service", "payment-api").
   */
  name: string;

  /**
   * Port number where this service is listening
   *
   * Combined with the detected IP address, this tells other services
   * exactly where to connect to reach this service.
   */
  port: number;

  /**
   * Heartbeat interval in seconds as confirmed by the server
   *
   * The server may adjust the requested heartbeat interval.
   * This is the actual interval being used for heartbeat messages.
   */
  heartbeatInterval: number;

  /**
   * Unique service instance ID assigned by the discovery server
   *
   * Format: typically "{name}-{ip}-{port}"
   * Used for logging and debugging registration issues.
   *
   * @example "user-service-192.168.1.10-3001"
   */
  id: string;
}

// =============================================================================
// SERVER COMMUNICATION TYPES
// =============================================================================

/**
 * RegisterRequest - Data sent when registering a new service
 *
 * When a service starts up, it sends this information to the discovery
 * server to announce its presence and availability.
 *
 * Example HTTP request:
 * POST /register
 * {
 *   "name": "user-service",
 *   "port": 3001,
 *   "heartbeatInterval": 30
 * }
 */
export interface RegisterRequest {
  /**
   * Name to register this service under
   *
   * This name will be used by other services to discover and connect
   * to instances of this service. Should be descriptive and unique
   * across your system.
   *
   * @example "user-service", "payment-api", "notification-worker"
   */
  name: string;

  /**
   * Port number where this service is accepting connections
   *
   * The discovery server will combine this with the detected IP
   * address to create the full connection URL for this service.
   */
  port: number;

  /**
   * Requested heartbeat interval in seconds (optional)
   *
   * How often this service plans to send heartbeat messages.
   * The server may adjust this value based on its configuration.
   *
   * @default Uses client's defaultHeartbeatInterval option
   */
  heartbeatInterval?: number;
}

/**
 * HeartbeatRequest - Data sent in periodic heartbeat messages
 *
 * Services send this regularly to prove they're still alive and healthy.
 * If heartbeats stop, the discovery server assumes the service is dead.
 *
 * Example HTTP request:
 * POST /heartbeat
 * {
 *   "name": "user-service",
 *   "port": 3001,
 *   "heartbeatInterval": 30
 * }
 */
export interface HeartbeatRequest {
  /**
   * Name of the service sending the heartbeat
   *
   * Must match the name used during registration.
   */
  name: string;

  /**
   * Port of the service sending the heartbeat
   *
   * Must match the port used during registration.
   * Combined with name and detected IP, this identifies the service instance.
   */
  port: number;

  /**
   * Current heartbeat interval in seconds (optional)
   *
   * Allows services to adjust their heartbeat frequency if needed.
   * Most services keep this constant after registration.
   */
  heartbeatInterval?: number;
}

/**
 * RegisterResponse - Server response after successful service registration
 *
 * The discovery server sends this back to confirm successful registration
 * and provide important information the service needs for operation.
 */
export interface RegisterResponse {
  /**
   * Unique service instance ID assigned by the server
   *
   * This ID uniquely identifies this specific service instance
   * and is used for logging and debugging purposes.
   *
   * @example "user-service-192.168.1.10-3001"
   */
  id: string;

  /**
   * Confirmed heartbeat interval in seconds
   *
   * The server may adjust the requested heartbeat interval
   * based on its configuration and load. Use this value
   * for actual heartbeat timing.
   */
  heartbeatInterval: number;

  /**
   * Timestamp when registration was completed
   *
   * Unix timestamp (milliseconds since epoch) when the
   * service was successfully registered and became available
   * for discovery by other services.
   */
  registeredAt: number;
}

/**
 * HeartbeatResponse - Server response to heartbeat messages
 *
 * The discovery server sends this back to acknowledge receipt
 * of a heartbeat message and provide timing information.
 */
export interface HeartbeatResponse {
  /**
   * Indicates successful heartbeat processing
   *
   * Always true when the heartbeat was received and processed
   * successfully. If false, there was an issue with the heartbeat.
   */
  ok: boolean;

  /**
   * Timestamp when the heartbeat was processed
   *
   * Unix timestamp (milliseconds since epoch) when the
   * server processed this heartbeat message.
   */
  lastHeartbeat: number;

  /**
   * Seconds until the next heartbeat should be sent
   *
   * Calculated based on the service's heartbeat interval.
   * Services can use this to optimize their heartbeat timing.
   */
  nextHeartbeatIn: number;
}

/**
 * ServiceResponse - Information about a discovered service instance
 *
 * When discovering services, the server returns an array of these objects,
 * each representing a healthy, available service instance.
 *
 * This contains all the information needed to connect to the service.
 */
export interface ServiceResponse {
  /**
   * Unique service instance ID
   *
   * Identifies this specific instance among all instances
   * of the same service name.
   *
   * @example "user-service-192.168.1.10-3001"
   */
  id: string;

  /**
   * Service name
   *
   * The name used to group related service instances.
   * All instances with the same name provide the same functionality.
   */
  name: string;

  /**
   * IP address where the service can be reached
   *
   * This is the actual IP address detected by the discovery server
   * when the service registered. Can be IPv4 or IPv6.
   *
   * @example "192.168.1.10", "::1"
   */
  ip: string;

  /**
   * Port number where the service is listening
   *
   * Combined with the IP address, this provides the complete
   * network endpoint for connecting to this service.
   */
  port: number;

  /**
   * Service's heartbeat interval in seconds
   *
   * How often this service sends heartbeat messages.
   * Used by the client to calculate appropriate cache durations.
   */
  heartbeatInterval: number;

  /**
   * Timestamp when service was first registered
   *
   * Unix timestamp (milliseconds since epoch) of initial registration.
   * Useful for debugging and monitoring service lifecycle.
   */
  registeredAt: number;

  /**
   * Timestamp of the last received heartbeat
   *
   * Unix timestamp (milliseconds since epoch) of the most recent
   * heartbeat message from this service. Indicates service health.
   */
  lastHeartbeat: number;

  /**
   * Optional status indicator (optional)
   *
   * May contain additional status information like "healthy", "warning", etc.
   * Not all discovery servers provide this field.
   */
  status?: string;
}

/**
 * ServicesResponse - Response containing discovered service instances
 *
 * When requesting instances of a specific service name, the discovery
 * server responds with this format containing all healthy instances.
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
  /**
   * Array of healthy service instances
   *
   * All instances returned here are considered healthy and available
   * for connection. The client will randomly select from this list
   * for load balancing.
   */
  services: ServiceResponse[];
}

// =============================================================================
// CACHING SYSTEM TYPES
// =============================================================================

/**
 * ServiceCacheEntry - Single entry in the service discovery cache
 *
 * The client caches service discovery results to improve performance
 * and reduce load on the discovery server. Each cache entry contains
 * the cached services plus timing information.
 *
 * Cache entries have expiration times calculated based on the shortest
 * heartbeat interval among cached services to ensure data freshness.
 */
export interface ServiceCacheEntry {
  /**
   * Cached array of service instances
   *
   * These are the service instances that were returned by the
   * discovery server at the time of caching. They're stored
   * exactly as received from the server.
   */
  services: ServiceResponse[];

  /**
   * Timestamp when this entry was cached
   *
   * Unix timestamp (milliseconds since epoch) when the cache
   * entry was created. Used for debugging and cache analysis.
   */
  cachedAt: number;

  /**
   * Timestamp when this entry expires
   *
   * Unix timestamp (milliseconds since epoch) after which this
   * cache entry is considered stale and should be refreshed.
   *
   * Calculated as: cachedAt + (minHeartbeatInterval × cacheMultiplier × 1000)
   */
  expiresAt: number;
}

/**
 * ServiceCache - Complete cache storage for all discovered services
 *
 * A Map that stores cache entries for different service names.
 * Each service name has its own cache entry with its own expiration.
 *
 * Structure:
 * - Key: service name (e.g., "user-service")
 * - Value: ServiceCacheEntry with instances and timing info
 */
export type ServiceCache = Map<string, ServiceCacheEntry>;

/**
 * ServiceCacheStatus - Human-readable cache status for one service
 *
 * Provides detailed information about the cache state for a specific
 * service name. Used for debugging, monitoring, and cache analysis.
 *
 * This is returned by the getCacheStatus() method to help developers
 * understand cache behavior and performance.
 */
export interface ServiceCacheStatus {
  /**
   * Number of service instances currently cached
   *
   * How many instances of this service are stored in the cache.
   * Zero means no instances are cached (possibly none available).
   */
  servicesCount: number;

  /**
   * ISO string of when this entry was cached
   *
   * Human-readable timestamp showing when the cache entry
   * was last updated with fresh data from the server.
   *
   * @example "2023-12-07T10:30:45.123Z"
   */
  cachedAt: string;

  /**
   * ISO string of when this entry expires
   *
   * Human-readable timestamp showing when this cache entry
   * will be considered stale and needs refreshing.
   *
   * @example "2023-12-07T10:31:45.123Z"
   */
  expiresAt: string;

  /**
   * Whether the cache entry is still valid (not expired)
   *
   * True if the current time is before the expiration time.
   * False if the cache entry is stale and needs refreshing.
   */
  isValid: boolean;

  /**
   * Milliseconds until this cache entry expires
   *
   * Time remaining before the cache entry becomes stale.
   * Zero if already expired. Useful for monitoring cache efficiency.
   */
  timeToExpiry: number;
}

/**
 * AllServiceCacheStatus - Cache status for all cached services
 *
 * An object containing cache status information for every service
 * name that has been cached. Used by getCacheStatus() to provide
 * a complete picture of cache state.
 *
 * Example:
 * {
 *   "user-service": {
 *     servicesCount: 2,
 *     cachedAt: "2023-12-07T10:30:45.123Z",
 *     expiresAt: "2023-12-07T10:31:45.123Z",
 *     isValid: true,
 *     timeToExpiry: 45000
 *   },
 *   "payment-service": { ... }
 * }
 */
export interface AllServiceCacheStatus {
  /**
   * Cache status keyed by service name
   *
   * Each key is a service name (e.g., "user-service") and
   * each value is the detailed cache status for that service.
   */
  [serviceName: string]: ServiceCacheStatus;
}

// =============================================================================
// HEALTH AND MONITORING TYPES
// =============================================================================

/**
 * HealthCheckResult - Result of connectivity test to discovery server
 *
 * Used by the healthCheck() method to test whether the discovery
 * server is reachable and responsive. Useful for service health
 * endpoints and monitoring systems.
 *
 * Example usage:
 * ```typescript
 * const health = await client.healthCheck();
 * if (health.status === 'unhealthy') {
 *   console.error('Discovery server unreachable:', health.error);
 * }
 * ```
 */
export interface HealthCheckResult {
  /**
   * Overall health status
   *
   * - "healthy": Discovery server is reachable and responding
   * - "unhealthy": Cannot connect to discovery server or error occurred
   */
  status: 'healthy' | 'unhealthy';

  /**
   * Discovery server connectivity status
   *
   * - "connected": Successfully communicated with discovery server
   * - "disconnected": Cannot reach discovery server
   */
  discoveryServer: 'connected' | 'disconnected';

  /**
   * Error message if health check failed (optional)
   *
   * Contains the specific error message when status is "unhealthy".
   * Useful for debugging connectivity issues.
   *
   * @example "connect ECONNREFUSED 127.0.0.1:3000"
   */
  error?: string;
}

// =============================================================================
// USAGE EXAMPLES AND PATTERNS
// =============================================================================

/**
 * COMMON USAGE PATTERNS:
 *
 * 1. SERVICE REGISTRATION AND HEARTBEATS:
 *    ```typescript
 *    const client = new ServiceDiscoveryClient('http://localhost:3000');
 *
 *    // Register service
 *    await client.register('my-service', 3001);
 *    // Client automatically sends heartbeats
 *
 *    // Check registration status
 *    const isRegistered = client.isServiceRegistered();
 *    const serviceInfo = client.getCurrentService();
 *    ```
 *
 * 2. SERVICE DISCOVERY WITH LOAD BALANCING:
 *    ```typescript
 *    // Get URL for any healthy instance of user-service
 *    const userServiceUrl = await client.getServiceUrl('user-service');
 *    // Returns: "http://192.168.1.10:3001" (random selection)
 *
 *    // Make request to discovered service
 *    const response = await axios.get(`${userServiceUrl}/api/users`);
 *    ```
 *
 * 3. CACHE MANAGEMENT:
 *    ```typescript
 *    // Check cache status
 *    const cacheStatus = client.getCacheStatus();
 *    console.log('User service cache:', cacheStatus['user-service']);
 *
 *    // Force cache refresh
 *    client.clearCache();
 *    const freshUrl = await client.getServiceUrl('user-service');
 *    ```
 *
 * 4. HEALTH MONITORING:
 *    ```typescript
 *    // Check if discovery server is available
 *    const health = await client.healthCheck();
 *    if (health.status === 'unhealthy') {
 *       // Handle discovery server outage
 *    }
 *    ```
 *
 * 5. GRACEFUL SHUTDOWN:
 *    ```typescript
 *    // Cleanup when service shuts down
 *    process.on('SIGTERM', async () => {
 *       await client.unregister();
 *       process.exit(0);
 *    });
 *    ```
 *
 * 6. ADVANCED CONFIGURATION:
 *    ```typescript
 *    const client = new ServiceDiscoveryClient('http://localhost:3000', {
 *       defaultHeartbeatInterval: 60,  // 1 minute heartbeats
 *       cacheMultiplier: 3,            // Cache for 3 minutes
 *       requestTimeout: 10000          // 10 second timeout
 *    });
 *    ```
 */
