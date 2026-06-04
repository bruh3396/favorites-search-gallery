import { PromiseTimeoutError } from "@/types/errors";

export function sleep(milliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

export function yieldControl(): Promise<void> {
  return sleep(0);
}

export function withTimeout<T>(promise: Promise<T>, milliseconds: number): Promise<T> {
  const timeout = new Promise((_, reject) => setTimeout(() => reject(new PromiseTimeoutError()), milliseconds));
  return Promise.race([promise, timeout]) as Promise<T>;
}

export async function withExponentialBackoff<T>(task: () => Promise<T>, maxAttempts: number, baseDelay = 1_000): Promise<T> {
  try {
    return await task();
  } catch (error) {
    if (maxAttempts <= 1) {
      throw error;
    }
    await sleep(baseDelay);
    return withExponentialBackoff(task, maxAttempts - 1, baseDelay * 2);
  }
}
