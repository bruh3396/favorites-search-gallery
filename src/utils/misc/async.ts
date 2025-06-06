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
