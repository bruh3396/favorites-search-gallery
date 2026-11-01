import { RandomSource } from "@/core/boundary/ports/random_source/random_source";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

export interface RetryConfiguration {
  readonly attempts: number;
  readonly baseDelay: number;
  readonly maxDelay?: number;
}

export interface RetryDependencies {
  scheduler: Scheduler;
  randomSource: RandomSource;
  isRetryable: (error: unknown) => boolean;
}

export class Retry {
  constructor(
    private readonly configuration: RetryConfiguration,
    private readonly dependencies: RetryDependencies
  ) {}

  public retry<T>(task: () => Promise<T>): Promise<T> {
    return this.attempt(task, 1);
  }

  public computeDelay(failureCount: number): number {
    const exponentialDelay = this.configuration.baseDelay * (2 ** (failureCount - 1));
    return this.dependencies.randomSource.next() * Math.min(exponentialDelay, this.configuration.maxDelay ?? Infinity);
  }

  private async attempt<T>(task: () => Promise<T>, count: number): Promise<T> {
    try {
      return await task();
    } catch (error) {
      if (
        count >= this.configuration.attempts ||
        !this.dependencies.isRetryable(error)
      ) {
        throw error;
      }

      await this.dependencies.scheduler.sleep(this.computeDelay(count));
      return this.attempt(task, count + 1);
    }
  }
}
