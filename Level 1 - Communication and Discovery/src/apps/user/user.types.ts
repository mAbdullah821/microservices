/**
 * =============================================================================
 * USER APP - TYPE DEFINITIONS
 * =============================================================================
 *
 * This file contains all TypeScript type definitions for the User App.
 * The User App is responsible for managing user data, including retrieval
 * and health status monitoring.
 *
 * Key Concepts:
 * - User: Represents a user account in the system.
 * - HealthResponse: A standard structure for reporting the health of a service instance.
 * =============================================================================
 */

// =============================================================================
// CORE ENTITY TYPES
// =============================================================================

/**
 * User - Represents a single user in our system.
 *
 * This interface defines the core attributes of a user account, such as their
 * unique ID, name, and contact information.
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
 * to check if this instance of the User Service is running correctly.
 */
export interface HealthResponse {
  /** The name of the service (e.g., "user-service"). */
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
 * GetUsersResponse - The response format for the GET /users endpoint.
 *
 * This structure contains the list of users returned by the service, along with
 * metadata about the service instance that handled the request.
 */
export interface GetUsersResponse {
  /** An array of User objects. */
  users: User[];

  /** The unique identifier of the service instance that processed the request. */
  instance: string;
}
