import { RandomSource } from "@/core/boundary/ports/random_source";
import { Scheduler } from "@/core/boundary/ports/scheduler";

export interface RetryPolicy {
  attempts: number;
  baseDelay: number;
  scheduler: Scheduler;
  randomSource: RandomSource;
  isRetryable: (error: unknown) => boolean;
}

export function retry<T>(task: () => Promise<T>, policy: RetryPolicy): Promise<T> {
  return attempt(task, policy, 1);
}

async function attempt<T>(task: () => Promise<T>, policy: RetryPolicy, count: number): Promise<T> {
  try {
    return await task();
  } catch (error) {
    if (count >= policy.attempts || !policy.isRetryable(error)) {
      throw error;
    }
    await policy.scheduler.sleep(policy.randomSource.next() * policy.baseDelay * (2 ** (count - 1)));
    return attempt(task, policy, count + 1);
  }
}
