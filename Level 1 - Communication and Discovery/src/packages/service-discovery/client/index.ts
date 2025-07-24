import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  ServiceDiscoveryClientOptions,
  CurrentService,
  ServiceCacheEntry,
  ServiceCache,
  AllServiceCacheStatus,
  HealthCheckResult,
  RegisterRequest,
  RegisterResponse,
  HeartbeatRequest,
  HeartbeatResponse,
  ServicesResponse,
  ServiceResponse,
} from './client.types';

/**
 * ServiceDiscoveryClient - A TypeScript client for interacting with the service discovery server
 *
 * This client handles:
 * - Registering your service with the discovery server
 * - Automatically sending heartbeat messages to stay "alive"
 * - Discovering other services by name (with caching for performance)
 * - Load balancing through random service selection
 * - Graceful cleanup when shutting down
 *
 * Think of it as your service's "phone book" and "answering service" combined.
 */
class ServiceDiscoveryClient {
  private readonly discoveryServerUrl: string;
  private readonly options: Required<ServiceDiscoveryClientOptions>;

  // Service registration state
  private currentService: CurrentService | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isRegistered: boolean = false;

  // Service discovery cache
  private serviceCache: ServiceCache = new Map();

  // HTTP client for making requests
  private readonly httpClient: AxiosInstance;

  /**
   * Create a new ServiceDiscoveryClient
   *
   * @param discoveryServerUrl - Base URL of the discovery server (e.g., 'http://localhost:3000')
   * @param options - Optional configuration settings
   */
  constructor(discoveryServerUrl: string, options: ServiceDiscoveryClientOptions = {}) {
    // Remove trailing slash from URL for consistency
    this.discoveryServerUrl = discoveryServerUrl.replace(/\/$/, '');

    // Merge user options with defaults
    this.options = {
      defaultHeartbeatInterval: 30, // seconds
      cacheMultiplier: 2, // cache duration = heartbeat * multiplier
      requestTimeout: 5000, // milliseconds
      ...options,
    };

    // Create HTTP client with configured timeout and headers
    this.httpClient = axios.create({
      timeout: this.options.requestTimeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Register current service with the discovery server
   *
   * This tells the discovery server "I exist and here's how to reach me".
   * After registration, the client automatically sends heartbeat messages.
   *
   * @param serviceName - Name to register this service under (e.g., 'user-service')
   * @param servicePort - Port number where this service is running
   * @returns Promise with registration details from the server
   */
  async register(serviceName: string, servicePort: number): Promise<RegisterResponse> {
    const payload: RegisterRequest = {
      name: serviceName,
      port: servicePort,
      heartbeatInterval: this.options.defaultHeartbeatInterval,
    };

    const response: AxiosResponse<RegisterResponse> = await this.httpClient.post(
      `${this.discoveryServerUrl}/register`,
      payload,
    );

    const { heartbeatInterval, id } = response.data;

    // Store service information for heartbeats and cleanup
    this.currentService = {
      id,
      name: serviceName,
      port: servicePort,
      heartbeatInterval,
    };

    this.isRegistered = true;
    this._startHeartbeat();

    console.log(`✅ Service registered: ${this.currentService.id}`);
    return response.data;
  }

  /**
   * Start periodic heartbeat messages
   *
   * Heartbeats tell the server "I'm still alive and working".
   * If heartbeats stop, the server assumes the service is dead.
   * This is automatically called after successful registration.
   */
  private _startHeartbeat(): void {
    // Clear any existing heartbeat timer
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    if (!this.currentService) {
      console.error('❌ Cannot start heartbeat: no service registered');
      return;
    }

    // Convert seconds to milliseconds
    const interval: number = this.currentService.heartbeatInterval * 1000;

    // Set up recurring heartbeat
    this.heartbeatTimer = setInterval(() => {
      this._sendHeartbeat();
    }, interval);

    // Send immediate heartbeat to confirm we're alive
    this._sendHeartbeat();
  }

  /**
   * Send a heartbeat message to the discovery server
   *
   * This is automatically called at regular intervals after registration.
   * You typically don't need to call this manually.
   */
  private async _sendHeartbeat(): Promise<void> {
    if (!this.currentService) {
      console.error('❌ Cannot send heartbeat: no service registered');
      return;
    }

    try {
      const payload: HeartbeatRequest = {
        name: this.currentService.name,
        port: this.currentService.port,
        heartbeatInterval: this.currentService.heartbeatInterval,
      };

      await this.httpClient.post<HeartbeatResponse>(`${this.discoveryServerUrl}/heartbeat`, payload);

      console.log(`💓 Heartbeat sent for service ID: ${this.currentService.id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Heartbeat failed:', errorMessage);
    }
  }

  /**
   * Get URL for a service instance with load balancing and caching
   *
   * This is the main method for discovering other services. It:
   * 1. Checks cache first (for performance)
   * 2. Fetches fresh data from server if cache is expired
   * 3. Randomly selects one instance for load balancing
   * 4. Falls back to stale cache if server is unreachable
   *
   * @param serviceName - Name of the service to discover (e.g., 'user-service')
   * @returns Promise with a complete URL to contact the service (e.g., 'http://192.168.1.10:3001')
   */
  async getServiceUrl(serviceName: string): Promise<string> {
    // Try to get from cache first
    const cachedServices: ServiceResponse[] | null = this._getCachedServices(serviceName);

    // If cache is valid and has services, use it
    if (cachedServices && cachedServices.length > 0 && this._isCacheValid(serviceName)) {
      return this._selectRandomService(cachedServices);
    }

    // Cache is invalid or empty, fetch fresh data
    try {
      const freshServices: ServiceResponse[] = await this._fetchServices(serviceName);

      if (freshServices && freshServices.length > 0) {
        this._updateCache(serviceName, freshServices);
        return this._selectRandomService(freshServices);
      }
    } catch (error) {
      console.warn(
        `⚠️ Failed to fetch fresh services for ${serviceName}:`,
        error instanceof Error ? error.message : 'Unknown error',
      );
    }

    // No fresh services available, try stale cache as fallback
    if (cachedServices && cachedServices.length > 0) {
      console.warn(`⚠️ No fresh services for ${serviceName}, using stale cache`);
      return this._selectRandomService(cachedServices);
    }

    // No services available anywhere
    throw new Error(`No instances available for service: ${serviceName}`);
  }

  /**
   * Fetch services from discovery server
   *
   * Makes an HTTP request to the discovery server to get current list
   * of healthy service instances.
   *
   * @param serviceName - Name of service to fetch instances for
   * @returns Promise with array of service instances
   */
  private async _fetchServices(serviceName: string): Promise<ServiceResponse[]> {
    try {
      const response: AxiosResponse<ServicesResponse> = await this.httpClient.get(
        `${this.discoveryServerUrl}/services/${serviceName}`,
      );
      return response.data.services || [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Failed to fetch services for ${serviceName}:`, errorMessage);
      throw error;
    }
  }

  /**
   * Get cached services for a given service name
   *
   * @param serviceName - Name of service to get from cache
   * @returns Array of cached service instances or null if not cached
   */
  private _getCachedServices(serviceName: string): ServiceResponse[] | null {
    const cacheEntry: ServiceCacheEntry | undefined = this.serviceCache.get(serviceName);
    return cacheEntry ? cacheEntry.services : null;
  }

  /**
   * Check if cached data is still valid (not expired)
   *
   * @param serviceName - Name of service to check cache validity for
   * @returns true if cache is valid, false if expired or doesn't exist
   */
  private _isCacheValid(serviceName: string): boolean {
    const cacheEntry: ServiceCacheEntry | undefined = this.serviceCache.get(serviceName);
    if (!cacheEntry) return false;

    const now: number = Date.now();
    return now < cacheEntry.expiresAt;
  }

  /**
   * Update service cache with fresh data
   *
   * Stores service instances in cache with calculated expiration time.
   * Cache duration is based on the shortest heartbeat interval of all services.
   *
   * @param serviceName - Name of service to cache
   * @param services - Array of service instances to cache
   */
  private _updateCache(serviceName: string, services: ServiceResponse[]): void {
    if (!services || services.length === 0) return;

    // Calculate cache duration based on shortest heartbeat interval
    // This ensures we refresh before any service might be marked as dead
    const minHeartbeatInterval: number = Math.min(
      ...services.map((service: ServiceResponse) => service.heartbeatInterval),
    );
    const cacheDuration: number = minHeartbeatInterval * 1000 * this.options.cacheMultiplier;

    const cacheEntry: ServiceCacheEntry = {
      services,
      cachedAt: Date.now(),
      expiresAt: Date.now() + cacheDuration,
    };

    this.serviceCache.set(serviceName, cacheEntry);
    console.log(`📦 Cached ${services.length} instances for ${serviceName} (expires in ${cacheDuration / 1000}s)`);
  }

  /**
   * Randomly select one service instance from available instances
   *
   * This provides simple load balancing by distributing requests
   * randomly across all healthy instances.
   *
   * @param services - Array of available service instances
   * @returns Complete URL to the selected service instance
   */
  private _selectRandomService(services: ServiceResponse[]): string {
    if (!services || services.length === 0) {
      throw new Error('No instances available');
    }

    // Select random instance
    const randomIndex: number = Math.floor(Math.random() * services.length);
    const selectedService: ServiceResponse = services[randomIndex];

    return this._formatUrl(selectedService.ip, selectedService.port);
  }

  /**
   * Format IP and port into a complete URL
   *
   * Handles both IPv4 and IPv6 addresses correctly.
   *
   * @param ip - IP address (IPv4 or IPv6)
   * @param port - Port number
   * @returns Complete URL (e.g., 'http://192.168.1.10:3001' or 'http://[::1]:3001')
   */
  private _formatUrl(ip: string, port: number): string {
    // IPv6 addresses contain colons and need brackets in URLs
    if (ip.includes(':')) {
      return `http://[${ip}]:${port}`;
    }

    // IPv4 addresses can be used directly
    return `http://${ip}:${port}`;
  }

  /**
   * Unregister service and cleanup all resources
   *
   * Call this when your service is shutting down to:
   * - Remove the service from the discovery server
   * - Stop sending heartbeats
   * - Clear all cached data
   *
   * @returns Promise that resolves when unregistration is complete
   */
  async unregister(): Promise<void> {
    if (!this.currentService || !this.isRegistered) {
      console.log('ℹ️ No service registered, nothing to unregister');
      return;
    }

    try {
      await this.httpClient.delete(
        `${this.discoveryServerUrl}/services/${this.currentService.name}/${this.currentService.port}`,
      );

      console.log(`✅ Service unregistered: ${this.currentService.id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to unregister service:', errorMessage);
    } finally {
      this._cleanup();
    }
  }

  /**
   * Cleanup all client resources
   *
   * Stops heartbeat timer, clears service information, and clears cache.
   * This is automatically called by unregister().
   */
  private _cleanup(): void {
    // Stop heartbeat timer
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    // Clear service information
    this.currentService = null;
    this.isRegistered = false;

    // Clear service cache
    this.serviceCache.clear();
  }

  /**
   * Get detailed cache status for debugging
   *
   * Returns information about what services are cached, when they expire,
   * and whether the cache entries are still valid.
   *
   * @returns Object with cache status for all cached services
   */
  getCacheStatus(): AllServiceCacheStatus {
    const status: AllServiceCacheStatus = {};
    const now: number = Date.now();

    for (const [serviceName, cacheEntry] of this.serviceCache.entries()) {
      status[serviceName] = {
        servicesCount: cacheEntry.services.length,
        cachedAt: new Date(cacheEntry.cachedAt).toISOString(),
        expiresAt: new Date(cacheEntry.expiresAt).toISOString(),
        isValid: now < cacheEntry.expiresAt,
        timeToExpiry: Math.max(0, cacheEntry.expiresAt - now),
      };
    }

    return status;
  }

  /**
   * Check if the discovery server is accessible
   *
   * Useful for health checks and monitoring. Tests connectivity
   * to the discovery server without affecting service registration.
   *
   * @returns Promise with health check result
   */
  async healthCheck(): Promise<HealthCheckResult> {
    try {
      await this.httpClient.get(`${this.discoveryServerUrl}/services`);
      return {
        status: 'healthy',
        discoveryServer: 'connected',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        status: 'unhealthy',
        discoveryServer: 'disconnected',
        error: errorMessage,
      };
    }
  }

  /**
   * Get current registration status
   *
   * @returns Whether this client has a registered service
   */
  isServiceRegistered(): boolean {
    return this.isRegistered;
  }

  /**
   * Get information about the currently registered service
   *
   * @returns Current service information or null if not registered
   */
  getCurrentService(): CurrentService | null {
    return this.currentService;
  }

  /**
   * Get the unique ID for the registered service instance.
   * Falls back to "name-port" if not registered.
   *
   * @returns Service instance ID as a string.
   */
  getServiceId(): string {
    return this.currentService?.id || `${this.currentService?.name}-${this.currentService?.port}`;
  }

  /**
   * Clear the service cache
   *
   * Forces fresh lookups on the next getServiceUrl() call.
   * Useful if you know services have changed and want to bypass the cache.
   */
  clearCache(): void {
    this.serviceCache.clear();
    console.log('🗑️ Service cache cleared');
  }

  /**
   * Get cache entry for a specific service
   *
   * @param serviceName - Name of service to get cache info for
   * @returns Cache entry or undefined if not cached
   */
  getCacheEntry(serviceName: string): ServiceCacheEntry | undefined {
    return this.serviceCache.get(serviceName);
  }
}

export default ServiceDiscoveryClient;
