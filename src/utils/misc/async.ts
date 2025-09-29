import { PromiseTimeoutError } from "../../types/primitives/errors";
import { Timeout } from "../../types/primitives/primitives";

export function sleep(milliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

export function yield1(): Promise<void> {
  return sleep(0);
}

export function debounceAfterFirstCall<V>(this: unknown, fn: (...args: V[]) => void, delay: number): (...args: V[]) => void {
  let timeoutId: Timeout;
  let firstCall = true;
  let calledDuringDebounce = false;
  return (...args: V[]): void => {
    if (firstCall) {

      Reflect.apply(fn, this, args);
      firstCall = false;
    } else {
      calledDuringDebounce = true;
    }

    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      if (calledDuringDebounce) {

        Reflect.apply(fn, this, args);
        calledDuringDebounce = false;
      }
      firstCall = true;
    }, delay) as Timeout;
  };
}

export function debounceAlways<V>(this: unknown, fn: (...args: V[]) => void, delay: number): (...args: V[]) => void {
  let timeoutId: Timeout;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      Reflect.apply(fn, this, args);
    }, delay);
  };
}

export function throttle<V>(fn: (...args: V[]) => void, delay: number): (...args: V[]) => void {
  let throttling = false;
  return (/** @type {any} */ ...args) => {
    if (!throttling) {
      fn(...args);
      throttling = true;
      setTimeout(() => {
        throttling = false;
      }, delay);
    }
  };
}

export async function runWithPools<T>(
  items: T[],
  poolSize: number,
  task: (item: T, index: number) => Promise<void>
): Promise<void> {
  let index = 0;

  async function worker(): Promise<void> {
    while (index < items.length) {
      const i = index;

      index += 1;
      await task(items[i], i);
    }
  }

  await Promise.all(Array.from({ length: poolSize }, () => worker()));
}

export function withTimeout<T>(promise: Promise<T>, milliseconds: number): Promise<T> {
  const timeout = new Promise((_, reject) => setTimeout(() => reject(new PromiseTimeoutError()), milliseconds));
  return Promise.race([promise, timeout]) as Promise<T>;
}

export const DO_NOTHING = (): void => { };
