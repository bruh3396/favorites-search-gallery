import { RandomSource } from "@/core/boundary/ports/random_source/random_source";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

export interface RetryConfiguration {
  readonly attempts: number;
  readonly baseDelay: number;
}

export interface RetryDependencies {
  readonly scheduler: Scheduler;
  readonly randomSource: RandomSource;
  readonly isRetryable: (error: unknown) => boolean;
}

export class Retry {
  constructor(
    private readonly configuration: RetryConfiguration,
    private readonly dependencies: RetryDependencies
  ) {}

  public retry<T>(task: () => Promise<T>): Promise<T> {
    return this.attempt(task, 1);
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

      const delay =
        this.dependencies.randomSource.next() *
        this.configuration.baseDelay *
        (2 ** (count - 1));

      await this.dependencies.scheduler.sleep(delay);
      return this.attempt(task, count + 1);
    }
  }
}
