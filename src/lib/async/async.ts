import { PromiseTimeoutError } from "@/types/errors";

export function sleep(milliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

export function queueMacroTask(callback: () => void): void {
  const channel = new MessageChannel();

  channel.port1.onmessage = (): void => {
    channel.port1.close();
    callback();
  };
  channel.port2.postMessage(null);
}

export function macroTask(): Promise<void> {
  return new Promise(resolve => queueMacroTask(resolve));
}

export function microtask(): Promise<void> {
  return new Promise(resolve => queueMicrotask(resolve));
}

export function idle(timeout = 1_000): Promise<void> {
  if (typeof requestIdleCallback === "function") {
    return new Promise(resolve => requestIdleCallback(() => resolve(), { timeout }));
  }
  return macroTask();
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
