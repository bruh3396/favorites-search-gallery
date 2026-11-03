import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

export interface RetryConfiguration {
  readonly attempts: number;
}

export interface RetryDependencies {
  scheduler: Scheduler;
  computeDelay: (failureCount: number) => number;
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

      await this.dependencies.scheduler.sleep(this.dependencies.computeDelay(count));
      return this.attempt(task, count + 1);
    }
  }
}
