import { PromiseTimeoutError } from "../../../types/errors";

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
