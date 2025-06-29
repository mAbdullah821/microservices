const axios = require("axios");

class ServiceDiscoveryClient {
  constructor(discoveryServerUrl, options = {}) {
    this.discoveryServerUrl = discoveryServerUrl.replace(/\/$/, "");
    this.options = {
      defaultHeartbeatInterval: 30, // seconds
      cacheMultiplier: 2, // cache duration = heartbeat * multiplier
      requestTimeout: 5000,
      ...options,
    };

    // Service registration info
    this.currentService = null;
    this.heartbeatTimer = null;
    this.isRegistered = false;

    // Cache for discovered services
    this.serviceCache = new Map();

    // HTTP client with timeout
    this.httpClient = axios.create({
      timeout: this.options.requestTimeout,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Register current service with the discovery server
   */
  async register(serviceName, servicePort) {
    const payload = {
      name: serviceName,
      port: servicePort,
      heartbeatInterval: this.options.defaultHeartbeatInterval,
    };

    const response = await this.httpClient.post(
      `${this.discoveryServerUrl}/register`,
      payload
    );

    this.currentService = {
      name: serviceName,
      port: servicePort,
      heartbeatInterval: response.data.heartbeatInterval,
      id: response.data.id, // Store the service ID from registration
    };

    this.isRegistered = true;
    this._startHeartbeat();

    console.log(`✅ Service registered: ${this.currentService.id}`);
    return response.data;
  }

  /**
   * Start periodic heartbeat
   */
  _startHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    const interval = this.currentService.heartbeatInterval * 1000;
    this.heartbeatTimer = setInterval(() => {
      this._sendHeartbeat();
    }, interval);

    // Send immediate heartbeat
    this._sendHeartbeat();
  }

  /**
   * Send heartbeat to discovery server
   */
  async _sendHeartbeat() {
    if (!this.currentService) return;

    try {
      const payload = {
        name: this.currentService.name,
        port: this.currentService.port,
        heartbeatInterval: this.options.defaultHeartbeatInterval,
      };

      await this.httpClient.post(
        `${this.discoveryServerUrl}/heartbeat`,
        payload
      );

      // Print the service ID in heartbeat
      console.log(
        `💓 Heartbeat sent for service ID: ${this.currentService.id}`
      );
    } catch (error) {
      console.error("❌ Heartbeat failed:", error.message);
    }
  }

  /**
   * Get service URL with random selection and caching
   */
  async getServiceUrl(serviceName) {
    // Try to get from cache first
    const cachedServices = this._getCachedServices(serviceName);

    if (
      cachedServices &&
      cachedServices.length > 0 &&
      this._isCacheValid(serviceName)
    ) {
      return this._selectRandomService(cachedServices);
    }

    // Cache is invalid or empty, fetch fresh data
    const freshServices = await this._fetchServices(serviceName);

    if (freshServices && freshServices.length > 0) {
      this._updateCache(serviceName, freshServices);
      return this._selectRandomService(freshServices);
    }

    // No services available, try stale cache as fallback
    if (cachedServices && cachedServices.length > 0) {
      console.warn(
        `⚠️ No fresh services for ${serviceName}, using stale cache`
      );
      return this._selectRandomService(cachedServices);
    }

    throw new Error(`No instances available for service: ${serviceName}`);
  }

  /**
   * Fetch services from discovery server
   */
  async _fetchServices(serviceName) {
    const response = await this.httpClient.get(
      `${this.discoveryServerUrl}/services/${serviceName}`
    );
    return response.data.services || [];
  }

  /**
   * Get cached services
   */
  _getCachedServices(serviceName) {
    const cacheEntry = this.serviceCache.get(serviceName);
    return cacheEntry ? cacheEntry.services : null;
  }

  /**
   * Check if cache is valid
   */
  _isCacheValid(serviceName) {
    const cacheEntry = this.serviceCache.get(serviceName);
    if (!cacheEntry) return false;

    const now = Date.now();
    return now < cacheEntry.expiresAt;
  }

  /**
   * Update service cache
   */
  _updateCache(serviceName, services) {
    if (!services || services.length === 0) return;

    // Calculate cache duration based on heartbeat interval
    let minHeartbeatInterval = Math.min(
      ...services.map((s) => s.heartbeatInterval)
    );
    const cacheDuration =
      minHeartbeatInterval * 1000 * this.options.cacheMultiplier;

    const cacheEntry = {
      services,
      cachedAt: Date.now(),
      expiresAt: Date.now() + cacheDuration,
    };

    this.serviceCache.set(serviceName, cacheEntry);
    console.log(
      `📦 Cached ${services.length} instances for ${serviceName} (expires in ${
        cacheDuration / 1000
      }s)`
    );
  }

  /**
   * Random service selection
   */
  _selectRandomService(services) {
    if (!services || services.length === 0) {
      throw new Error("No instances available");
    }

    const randomIndex = Math.floor(Math.random() * services.length);
    const { ip, port } = services[randomIndex];

    return this._formatUrl(ip, port);
  }

  /**
   * Format URL for service instance
   */
  _formatUrl(ip, port) {
    // Check if it's IPv6 (contains colons)
    if (ip.includes(":")) {
      return `http://[${ip}]:${port}`;
    }

    return `http://${ip}:${port}`;
  }

  /**
   * Unregister service and cleanup
   */
  async unregister() {
    if (!this.currentService || !this.isRegistered) {
      return;
    }

    try {
      await this.httpClient.delete(
        `${this.discoveryServerUrl}/services/${this.currentService.name}/${this.currentService.port}`
      );

      console.log(`✅ Service unregistered: ${this.currentService.id}`);
    } catch (error) {
      console.error("❌ Failed to unregister service:", error.message);
    } finally {
      this._cleanup();
    }
  }

  /**
   * Cleanup resources
   */
  _cleanup() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    this.currentService = null;
    this.isRegistered = false;
    this.serviceCache.clear();
  }

  /**
   * Get cache status for debugging
   */
  getCacheStatus() {
    const status = {};

    for (const [serviceName, cacheEntry] of this.serviceCache.entries()) {
      const now = Date.now();
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
   * Health check
   */
  async healthCheck() {
    try {
      await this.httpClient.get(`${this.discoveryServerUrl}/services`);
      return { status: "healthy", discoveryServer: "connected" };
    } catch (error) {
      return {
        status: "unhealthy",
        discoveryServer: "disconnected",
        error: error.message,
      };
    }
  }
}

module.exports = ServiceDiscoveryClient;
