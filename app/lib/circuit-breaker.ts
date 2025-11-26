/**
 * Circuit Breaker Pattern Implementation
 * 
 * Prevents cascading failures when WordPress API is down by:
 * 1. Tracking failure rates
 * 2. Opening circuit after threshold reached
 * 3. Serving cached/fallback data when circuit is open
 * 4. Periodically testing API health (half-open state)
 * 5. Closing circuit when API recovers
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerOptions {
  // Number of failures before opening circuit
  failureThreshold: number;
  // Time to wait before trying again (ms)
  resetTimeout: number;
  // Number of successful requests needed to close circuit
  successThreshold: number;
  // Time window for counting failures (ms)
  failureWindow: number;
}

interface CircuitBreakerState {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime: number;
  lastStateChange: number;
  totalRequests: number;
  totalFailures: number;
}

const DEFAULT_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 5,
  resetTimeout: 30000, // 30 seconds
  successThreshold: 2,
  failureWindow: 60000, // 1 minute
};

// Circuit breaker instances for different services
const circuits = new Map<string, CircuitBreakerState>();

/**
 * Get or create circuit breaker state for a service
 */
function getCircuitState(serviceName: string): CircuitBreakerState {
  if (!circuits.has(serviceName)) {
    circuits.set(serviceName, {
      state: 'CLOSED',
      failures: 0,
      successes: 0,
      lastFailureTime: 0,
      lastStateChange: Date.now(),
      totalRequests: 0,
      totalFailures: 0,
    });
  }
  return circuits.get(serviceName)!;
}

/**
 * Check if circuit should allow request
 */
export function canMakeRequest(
  serviceName: string,
  options: Partial<CircuitBreakerOptions> = {}
): boolean {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const circuit = getCircuitState(serviceName);
  const now = Date.now();

  switch (circuit.state) {
    case 'CLOSED':
      return true;

    case 'OPEN':
      // Check if enough time has passed to try again
      if (now - circuit.lastStateChange >= opts.resetTimeout) {
        // Transition to half-open
        circuit.state = 'HALF_OPEN';
        circuit.lastStateChange = now;
        circuit.successes = 0;
        console.warn(`[CircuitBreaker] ${serviceName}: OPEN -> HALF_OPEN`);
        return true;
      }
      return false;

    case 'HALF_OPEN':
      // Allow limited requests to test if service recovered
      return true;

    default:
      return true;
  }
}

/**
 * Record a successful request
 */
export function recordSuccess(
  serviceName: string,
  options: Partial<CircuitBreakerOptions> = {}
): void {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const circuit = getCircuitState(serviceName);

  circuit.totalRequests++;
  circuit.successes++;

  if (circuit.state === 'HALF_OPEN') {
    if (circuit.successes >= opts.successThreshold) {
      // Service recovered, close circuit
      circuit.state = 'CLOSED';
      circuit.failures = 0;
      circuit.lastStateChange = Date.now();
      console.warn(`[CircuitBreaker] ${serviceName}: HALF_OPEN -> CLOSED (recovered)`);
    }
  } else if (circuit.state === 'CLOSED') {
    // Reset failure count on success
    circuit.failures = 0;
  }
}

/**
 * Record a failed request
 */
export function recordFailure(
  serviceName: string,
  options: Partial<CircuitBreakerOptions> = {}
): void {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const circuit = getCircuitState(serviceName);
  const now = Date.now();

  circuit.totalRequests++;
  circuit.totalFailures++;
  circuit.failures++;
  circuit.lastFailureTime = now;

  // Reset failure count if outside failure window
  if (now - circuit.lastFailureTime > opts.failureWindow) {
    circuit.failures = 1;
  }

  if (circuit.state === 'HALF_OPEN') {
    // Any failure in half-open state reopens circuit
    circuit.state = 'OPEN';
    circuit.lastStateChange = now;
    console.warn(`[CircuitBreaker] ${serviceName}: HALF_OPEN -> OPEN (still failing)`);
  } else if (circuit.state === 'CLOSED' && circuit.failures >= opts.failureThreshold) {
    // Too many failures, open circuit
    circuit.state = 'OPEN';
    circuit.lastStateChange = now;
    console.warn(`[CircuitBreaker] ${serviceName}: CLOSED -> OPEN (threshold reached: ${circuit.failures} failures)`);
  }
}

/**
 * Get current circuit state
 */
export function getCircuitStatus(serviceName: string): {
  state: CircuitState;
  failures: number;
  lastFailure: string | null;
  totalRequests: number;
  totalFailures: number;
  failureRate: string;
} {
  const circuit = getCircuitState(serviceName);
  const failureRate = circuit.totalRequests > 0
    ? ((circuit.totalFailures / circuit.totalRequests) * 100).toFixed(2)
    : '0.00';

  return {
    state: circuit.state,
    failures: circuit.failures,
    lastFailure: circuit.lastFailureTime
      ? new Date(circuit.lastFailureTime).toISOString()
      : null,
    totalRequests: circuit.totalRequests,
    totalFailures: circuit.totalFailures,
    failureRate: `${failureRate}%`,
  };
}

/**
 * Reset circuit breaker (for testing or manual recovery)
 */
export function resetCircuit(serviceName: string): void {
  circuits.delete(serviceName);
  console.warn(`[CircuitBreaker] ${serviceName}: Reset`);
}

/**
 * Get all circuit statuses
 */
export function getAllCircuitStatuses(): Record<string, ReturnType<typeof getCircuitStatus>> {
  const statuses: Record<string, ReturnType<typeof getCircuitStatus>> = {};
  for (const [name] of circuits) {
    statuses[name] = getCircuitStatus(name);
  }
  return statuses;
}

/**
 * Execute function with circuit breaker protection
 */
export async function withCircuitBreaker<T>(
  serviceName: string,
  operation: () => Promise<T>,
  fallback: () => T | Promise<T>,
  options: Partial<CircuitBreakerOptions> = {}
): Promise<T> {
  // Check if we can make request
  if (!canMakeRequest(serviceName, options)) {
    console.warn(`[CircuitBreaker] ${serviceName}: Circuit OPEN, using fallback`);
    return fallback();
  }

  try {
    const result = await operation();
    recordSuccess(serviceName, options);
    return result;
  } catch (error) {
    recordFailure(serviceName, options);
    console.warn(`[CircuitBreaker] ${serviceName}: Request failed, using fallback`, {
      error: error instanceof Error ? error.message : String(error),
    });
    return fallback();
  }
}

/**
 * Circuit breaker decorator for class methods
 */
export function circuitBreaker(
  serviceName: string,
  options: Partial<CircuitBreakerOptions> = {}
) {
  return function <T extends (..._args: unknown[]) => Promise<unknown>>(
    _target: object,
    _propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const originalMethod = descriptor.value!;

    descriptor.value = async function (this: unknown, ..._callArgs: unknown[]) {
      if (!canMakeRequest(serviceName, options)) {
        throw new Error(`Circuit breaker OPEN for ${serviceName}`);
      }

      try {
        const result = await originalMethod.apply(this, _callArgs);
        recordSuccess(serviceName, options);
        return result;
      } catch (error) {
        recordFailure(serviceName, options);
        throw error;
      }
    } as T;

    return descriptor;
  };
}

// Service names constants
export const SERVICES = {
  WORDPRESS_API: 'wordpress-api',
  WORDPRESS_DOWNLOADS: 'wordpress-downloads',
  LAMBDA_RECOMMENDATIONS: 'lambda-recommendations',
  REDIS_CACHE: 'redis-cache',
} as const;

