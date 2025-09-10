// Simple circuit breaker to prevent cascading failures
interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

const circuitBreakers = new Map<string, CircuitBreakerState>();

export class CircuitBreaker {
  private name: string;
  private failureThreshold: number;
  private resetTimeout: number;

  constructor(name: string, failureThreshold = 3, resetTimeout = 60000) {
    this.name = name;
    this.failureThreshold = failureThreshold;
    this.resetTimeout = resetTimeout;
    
    if (!circuitBreakers.has(name)) {
      circuitBreakers.set(name, {
        failures: 0,
        lastFailure: 0,
        state: 'CLOSED'
      });
    }
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const state = circuitBreakers.get(this.name)!;
    
    // Check if circuit is open
    if (state.state === 'OPEN') {
      const timeSinceLastFailure = Date.now() - state.lastFailure;
      
      if (timeSinceLastFailure < this.resetTimeout) {
        throw new Error(`Circuit breaker ${this.name} is OPEN. Try again in ${Math.ceil((this.resetTimeout - timeSinceLastFailure) / 1000)}s`);
      } else {
        // Move to half-open state
        state.state = 'HALF_OPEN';
        console.log(`🔄 Circuit breaker ${this.name} moved to HALF_OPEN`);
      }
    }

    try {
      const result = await fn();
      
      // Success - reset circuit breaker
      if (state.failures > 0) {
        console.log(`✅ Circuit breaker ${this.name} reset after success`);
        state.failures = 0;
        state.state = 'CLOSED';
      }
      
      return result;
    } catch (error) {
      state.failures++;
      state.lastFailure = Date.now();
      
      if (state.failures >= this.failureThreshold) {
        state.state = 'OPEN';
        console.log(`🚫 Circuit breaker ${this.name} OPENED after ${state.failures} failures`);
      }
      
      throw error;
    }
  }

  getState(): string {
    const state = circuitBreakers.get(this.name);
    return state ? state.state : 'UNKNOWN';
  }
}
