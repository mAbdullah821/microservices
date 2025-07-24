/**
 * =============================================================================
 * ORDER APP - TYPE DEFINITIONS
 * =============================================================================
 *
 * This file contains all TypeScript type definitions for the Order App.
 * The Order App is responsible for managing order data and retrieving
 * related user information.
 *
 * Key Concepts:
 * - Order: Represents a purchase or transaction made by a user.
 * - User: A shared entity representing the customer who placed the order.
 * - HealthResponse: A standard structure for reporting service health.
 * =============================================================================
 */

// =============================================================================
// CORE ENTITY TYPES
// =============================================================================

/**
 * Order - Represents a single order in the system.
 *
 * This interface defines the core attributes of an order, including its
 * unique ID, the ID of the user who placed it, and the products included.
 */
export interface Order {
  /** The unique numeric identifier for the order. */
  id: number;

  /** The ID of the user who created the order. */
  userId: number;

  /** An array of product names included in the order. */
  products: string[];
}

/**
 * User - Represents a customer associated with an order.
 *
 * This is a shared type that defines the structure of a user. In the context
 * of the Order Service, it's used to represent the customer who placed an order.
 */
export interface User {
  /** The unique numeric identifier for the user. */
  id: number;

  /** The full name of the user. */
  name: string;

  /** The user's unique email address. */
  email: string;

  /** The age of the user. */
  age: number;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/**
 * HealthResponse - The response format for the /health endpoint.
 *
 * This provides a standardized way for monitoring tools and other services
 * to check if this instance of the Order Service is running correctly.
 */
export interface HealthResponse {
  /** The name of the service (e.g., "order-service"). */
  service: string;

  /** The unique identifier for this specific running instance. */
  instance: string;

  /** The port number this instance is running on. */
  port: number;

  /** The current operational status (e.g., "healthy"). */
  status: string;

  /** The ISO 8601 timestamp of when the health check was performed. */
  timestamp: string;
}

/**
 * GetOrdersResponse - The response format for the GET /orders endpoint.
 *
 * This structure contains the list of orders, the associated user data, and
 * metadata about the service instance that handled the request.
 */
export interface GetOrdersResponse {
  /** An array of Order objects. */
  orders: Order[];

  /** The ID of the user who created the order. */
  userId: number;

  /** The total number of orders. */
  totalOrders: number;

  /** The unique identifier of the service instance that processed the request. */
  instance: string;
}
