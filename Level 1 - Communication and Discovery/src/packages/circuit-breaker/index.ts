import { CircuitBreakerConfig, MethodCircuitBreakerConfig, ClassMethodConfigurations } from './circuit-breaker.types';

/**
 * Manages the state and logic for a single circuit breaker tied to one method.
 * This class is used internally by the wrappers and is not meant for direct consumption.
 */
class SingleMethodCircuitBreaker {
  private isCircuitCurrentlyOpen: boolean = false;
  private failureTimestampsWithinWindow: number[] = [];
  private nextAllowedAttemptTime: number = 0;

  constructor(
    private methodName: string,
    private configuration: CircuitBreakerConfig,
    private fallbackMethodToCall: (...args: any[]) => any,
  ) {}

  /**
   * Main execution method that handles circuit breaker logic
   */
  public async executeWithCircuitBreaker<ReturnType>(
    originalMethodToExecute: (...args: any[]) => Promise<ReturnType>,
    methodArguments: any[],
  ): Promise<ReturnType> {
    const currentTimestamp = Date.now();

    // Remove old failure records outside the time window
    this.removeOldFailureRecords(currentTimestamp);

    // Check if circuit should be opened due to too many failures
    if (this.shouldOpenCircuit()) {
      this.openCircuitAndSetResetTime(currentTimestamp);
    }

    // Check if it's time to attempt recovery by transitioning the circuit to half-open
    if (this.shouldAttemptRecovery(currentTimestamp)) {
      this.setCircuitToHalfOpen();
    }

    // If circuit is open, use fallback method
    if (this.isCircuitCurrentlyOpen) {
      console.log(`🔴 Circuit is OPEN for ${this.methodName} - using fallback method`);
      return this.fallbackMethodToCall(...methodArguments);
    }

    // Circuit is closed, try the original method
    try {
      const executionResult = await originalMethodToExecute(...methodArguments);
      this.handleSuccessfulExecution();
      return executionResult;
    } catch (executionError) {
      this.handleFailedExecution(currentTimestamp);
      console.log(`❌ Method ${this.methodName} failed:`, (executionError as Error).message);
      return this.fallbackMethodToCall(...methodArguments);
    }
  }

  /**
   * Determines if the circuit should be opened based on failure count
   *
   * @returns True if the circuit should be opened, false otherwise
   */
  private shouldOpenCircuit(): boolean {
    return (
      !this.isCircuitCurrentlyOpen &&
      this.failureTimestampsWithinWindow.length >= this.configuration.maximumFailuresAllowed
    );
  }

  /**
   * Determines if the circuit should be closed based on reset timeout
   *
   * @param currentTimestamp The current timestamp
   * @returns True if the circuit should be closed, false otherwise
   */
  private shouldAttemptRecovery(currentTimestamp: number): boolean {
    return this.isCircuitCurrentlyOpen && currentTimestamp >= this.nextAllowedAttemptTime;
  }

  /**
   * Open the circuit and set the reset time
   *
   * @param currentTimestamp The current timestamp
   */
  private openCircuitAndSetResetTime(currentTimestamp: number): void {
    this.isCircuitCurrentlyOpen = true;
    this.nextAllowedAttemptTime = currentTimestamp + this.configuration.resetTimeoutInMilliseconds;
    console.log(`🔴 Circuit OPENED for ${this.methodName} - too many failures detected`);
  }

  /**
   * Set the circuit to half open, allowing one trial request
   */
  private setCircuitToHalfOpen(): void {
    this.isCircuitCurrentlyOpen = false;
    console.log(`🟡 Circuit is HALF-OPEN for ${this.methodName} - attempting recovery`);
  }

  /**
   * Close the circuit and reset the failure count
   */
  private closeCircuit(): void {
    this.failureTimestampsWithinWindow = [];
    console.log(`🟢 Circuit CLOSED for ${this.methodName} - recovery successful`);
  }

  /**
   * Remove old failure records outside the time window
   *
   * @param currentTimestamp The current timestamp
   */
  private removeOldFailureRecords(currentTimestamp: number): void {
    const timeWindowCutoff = currentTimestamp - this.configuration.timeWindowInMilliseconds;
    this.failureTimestampsWithinWindow = this.failureTimestampsWithinWindow.filter(
      (timestamp) => timestamp > timeWindowCutoff,
    );
  }

  /**
   * Handle successful execution
   */
  private handleSuccessfulExecution(): void {
    this.closeCircuit();
    console.log(`✅ Method ${this.methodName} executed successfully`);
  }

  /**
   * Handle failed execution
   *
   * @param currentTimestamp The current timestamp
   */
  private handleFailedExecution(currentTimestamp: number): void {
    this.failureTimestampsWithinWindow.push(currentTimestamp);
  }

  /**
   * Get the current status of the circuit breaker
   *
   * @returns The current status of the circuit breaker
   */
  public getCurrentStatus() {
    return {
      methodName: this.methodName,
      isCircuitOpen: this.isCircuitCurrentlyOpen,
      currentFailureCount: this.failureTimestampsWithinWindow.length,
      maximumFailuresAllowed: this.configuration.maximumFailuresAllowed,
      timeWindowInMilliseconds: this.configuration.timeWindowInMilliseconds,
    };
  }
}

/**
 * **Wraps a class instance to apply circuit breaker logic to its methods.**
 *
 * This class uses a Proxy to intercept method calls on an existing class instance.
 * For each method configured, it applies circuit breaker protection, automatically
 * handling failures and redirecting to a fallback method when the circuit is open.
 *
 * @template ClassType The type of the class instance being wrapped.
 *
 * @example
 * ```typescript
 * // Suppose you have a service class with methods that may fail:
 * class ApiService {
 *   async fetchData(id: number): Promise<string> {
 *     // Simulate a call that may fail
 *     if (Math.random() < 0.5) throw new Error("Random failure");
 *     return `Data for ${id}`;
 *   }
 * }
 *
 * // Define a fallback for when the circuit is open or the method fails
 * function fetchDataFallback(id: number) {
 *   return `Fallback data for ${id}`;
 * }
 *
 * // Configure the circuit breaker for the fetchData method
 * const methodConfigs = {
 *   fetchData: {
 *     circuitBreakerConfig: {
 *       maximumFailuresAllowed: 3,
 *       timeWindowInMilliseconds: 10000,
 *       resetTimeoutInMilliseconds: 5000,
 *     },
 *     fallbackMethod: fetchDataFallback,
 *   },
 * };
 *
 * // Wrap the ApiService instance
 * const apiService = new ApiService();
 * const wrapper = new CircuitBreakerClassWrapper(apiService, methodConfigs);
 * const protectedApiService = wrapper.getWrappedInstance();
 *
 * // Use the protected instance as usual
 * (async () => {
 *   for (let i = 0; i < 10; i++) {
 *     const result = await protectedApiService.fetchData(i);
 *     console.log(result);
 *   }
 * })();
 */
export class CircuitBreakerClassWrapper<ClassType extends object> {
  private methodCircuitBreakers: Map<string, SingleMethodCircuitBreaker> = new Map();
  private proxiedClassInstance: ClassType;

  /**
   * Creates a new circuit breaker wrapper for a class instance.
   *
   * @param originalClassInstance The original instance of the class you want to protect.
   * @param methodConfigurations An object where keys are method names of the class,
   * and values are the circuit breaker and fallback configurations for that method.
   */
  constructor(
    private originalClassInstance: ClassType,
    private methodConfigurations: ClassMethodConfigurations<ClassType>,
  ) {
    this.initializeCircuitBreakersForMethods();
    this.proxiedClassInstance = this.createProxiedInstance();
  }

  private initializeCircuitBreakersForMethods(): void {
    Object.entries(this.methodConfigurations).forEach(([methodName, methodConfig]) => {
      if (!methodConfig) return;

      const config = methodConfig as MethodCircuitBreakerConfig;

      const circuitBreaker = new SingleMethodCircuitBreaker(
        methodName,
        config.circuitBreakerConfig,
        config.fallbackMethod,
      );

      this.methodCircuitBreakers.set(methodName, circuitBreaker);
    });
  }

  private createProxiedInstance(): ClassType {
    return new Proxy(this.originalClassInstance, {
      get: (targetObject, propertyName) => {
        const methodName = propertyName as string;
        const originalMethod = targetObject[methodName as keyof ClassType];

        if (typeof originalMethod === 'function' && this.methodCircuitBreakers.has(methodName)) {
          return async (...methodArguments: any[]) => {
            const circuitBreaker = this.methodCircuitBreakers.get(methodName)!;

            return circuitBreaker.executeWithCircuitBreaker(originalMethod.bind(targetObject), methodArguments);
          };
        }

        return originalMethod;
      },
    });
  }

  /**
   * **Retrieves the wrapped class instance with circuit breaker functionality.**
   *
   * Use this method to get the protected instance. All method calls on this
   * returned object will be guarded by the configured circuit breakers.
   *
   * @returns The proxied class instance of type `ClassType`.
   */
  public getWrappedInstance(): ClassType {
    return this.proxiedClassInstance;
  }

  /**
   * **Retrieves the current status of one or all configured circuit breakers.**
   *
   * This is useful for monitoring and debugging. You can check the state (open/closed)
   * and failure count for each protected method.
   *
   * @param methodName An optional method name to get the status for a single circuit breaker.
   * If omitted, the status of all circuit breakers will be returned.
   * @returns An object containing the status details.
   */
  public getCircuitBreakerStatus(methodName?: keyof ClassType) {
    const key = methodName as string;
    if (key) {
      return this.methodCircuitBreakers.get(key)?.getCurrentStatus();
    }

    const allStatuses: Record<string, any> = {};
    this.methodCircuitBreakers.forEach((circuitBreaker, name) => {
      allStatuses[name] = circuitBreaker.getCurrentStatus();
    });

    return allStatuses;
  }
}

/**
 * **Wraps a single standalone function with circuit breaker functionality.**
 *
 * This factory function is a convenient way to apply circuit breaker protection
 * to any individual async function, such as a direct API call.
 *
 * @template MethodType The signature of the original async function.
 *
 * @param originalMethod The original async function to protect.
 * @param configuration Optional circuit breaker settings. Defaults will be used if not provided.
 * @param fallbackMethod Optional function to call when the circuit is open. It must match the original function's signature.
 * @returns A new function with the same signature as the original, but with circuit breaker logic built-in.
 *
 * @example
 * ```typescript
 * const protectedApiCall = createCircuitBreakerMethod(
 * async (userId: string) => await apiService.getUser(userId),
 * {
 * maximumFailuresAllowed: 3,
 * timeWindowInMilliseconds: 10000,
 * resetTimeoutInMilliseconds: 5000
 * },
 * (userId: string) => ({ id: userId, name: 'Default User' })
 * );
 *
 * const user = await protectedApiCall('123');
 * ```
 */
export function createCircuitBreakerMethod<MethodType extends (...args: any[]) => Promise<any>>(
  originalMethod: MethodType,
  configuration?: CircuitBreakerConfig,
  fallbackMethod?: (...args: Parameters<MethodType>) => ReturnType<MethodType>,
): MethodType {
  const defaultConfiguration: CircuitBreakerConfig = {
    maximumFailuresAllowed: 3,
    timeWindowInMilliseconds: 10000, // 10 seconds
    resetTimeoutInMilliseconds: 5000, // 5 seconds
  };

  const defaultFallback = (...args: any[]) => {
    console.log('🔄 Using default fallback - no custom fallback provided');
    throw new Error('Service unavailable and no fallback method configured');
  };

  const finalConfiguration = configuration || defaultConfiguration;
  const finalFallback = fallbackMethod || defaultFallback;

  const circuitBreaker = new SingleMethodCircuitBreaker(
    originalMethod.name || 'anonymous-method',
    finalConfiguration,
    finalFallback,
  );

  return (async (...methodArguments: Parameters<MethodType>) => {
    return circuitBreaker.executeWithCircuitBreaker(originalMethod, methodArguments);
  }) as MethodType;
}
