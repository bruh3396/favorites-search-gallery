import { Timeout } from "../../../types/async";

export function debounceLeading<V>(this: unknown, fn: (...args: V[]) => void, delay: number): (...args: V[]) => void {
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

export function debounceTrailing<V>(this: unknown, fn: (...args: V[]) => void, delay: number): (...args: V[]) => void {
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
  return (...args) => {
    if (!throttling) {
      fn(...args);
      throttling = true;
      setTimeout(() => {
        throttling = false;
      }, delay);
    }
  };
}
