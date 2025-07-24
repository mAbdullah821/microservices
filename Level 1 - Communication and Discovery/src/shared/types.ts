/**
 * =============================================================================
 * SHARED TYPE DEFINITIONS
 * =============================================================================
 *
 * This file contains shared TypeScript type definitions used across
 * multiple services, particularly for the API Gateway.
 * =============================================================================
 */

// Import base types from apps
import { User } from '../apps/user/user.types';
import { Order } from '../apps/order/order.types';

// =============================================================================
// EXTENDED TYPES
// =============================================================================

/**
 * UserWithOrders - A user with their associated orders
 */
export interface UserWithOrders extends User {
  orders: Order[];
}

// =============================================================================
// API GATEWAY TYPES
// =============================================================================

/**
 * DefaultValues - Default values for error handling
 */
export interface DefaultValues {
  users: User[];
  orders: Order[];
}

/**
 * ServiceError - Error information for a service
 */
export interface ServiceError {
  service: string;
  error: string;
  timestamp: string;
}

/**
 * ApiResponse - Generic API response wrapper
 */
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  instance?: string;
}

// Re-export base types for convenience
export { User, Order };
