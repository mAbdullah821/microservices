/**
 * =============================================================================
 * CIRCUIT BREAKER - TYPE DEFINITIONS
 * =============================================================================
 *
 * This file contains all TypeScript type definitions for the circuit breaker
 * utility. The circuit breaker is a design pattern used to detect failures
 * and prevent a recurring failure from overwhelming a system.
 *
 * Key Concepts:
 * - Closed State: The normal state where operations are executed.
 * - Open State: After enough failures, the circuit "opens," and operations are rejected immediately, typically calling a fallback.
 * - Half-Open State: After a timeout, the circuit allows a single trial request. If it succeeds, the circuit closes; otherwise, it opens again.
 * =============================================================================
 */

// =============================================================================
// CORE CONFIGURATION TYPES
// =============================================================================

/**
 * CircuitBreakerConfig - Defines the behavior of a circuit breaker instance.
 *
 * These settings control how the circuit breaker detects failures, how long it
 * stays open, and the time windows it uses for tracking.
 *
 * @example
 * ```typescript
 * const config: CircuitBreakerConfig = {
 * maximumFailuresAllowed: 5,       // Open circuit after 5 failures
 * timeWindowInMilliseconds: 30000, // within a 30-second window
 * resetTimeoutInMilliseconds: 10000, // Stay open for 10 seconds before trying again
 * };
 * ```
 */
export interface CircuitBreakerConfig {
  /**
   * The maximum number of failures allowed within the time window before the circuit opens.
   * @example 3 // After 3 failures, the circuit will open.
   */
  maximumFailuresAllowed: number;

  /**
   * The time window in milliseconds during which failures are counted.
   * @example 10000 // Failures are counted within a rolling 10-second window.
   */
  timeWindowInMilliseconds: number;

  /**
   * The duration in milliseconds the circuit should remain open before transitioning to half-open.
   * @example 5000 // Wait 5 seconds before allowing a trial request.
   */
  resetTimeoutInMilliseconds: number;
}

/**
 * MethodCircuitBreakerConfig - Configuration for applying a circuit breaker to a specific method.
 *
 * This interface bundles the core `CircuitBreakerConfig` with a fallback function
 * that will be executed when the circuit is open.
 */
export interface MethodCircuitBreakerConfig {
  /** The core behavioral settings for the circuit breaker. */
  circuitBreakerConfig: CircuitBreakerConfig;

  /**
   * The function to execute when the circuit is open or when the primary method fails.
   * It should accept the same arguments as the original method.
   */
  fallbackMethod: (...args: any[]) => any;
}

/**
 * ClassMethodConfigurations - A type helper for configuring circuit breakers for a class.
 *
 * This mapped type ensures that you can only provide circuit breaker configurations
 * for properties that are methods (functions) on the target class, providing type safety.
 *
 * @template T The class type to be wrapped.
 */
export type ClassMethodConfigurations<T> = {
  [K in keyof T]?: T[K] extends (...args: any[]) => any ? MethodCircuitBreakerConfig : never;
};
