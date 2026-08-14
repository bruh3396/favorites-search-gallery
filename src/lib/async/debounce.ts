import { Timeout } from "@/types/async";

export function debounceLeading<V>(this: unknown, fn: (...args: V[]) => void, delay: number): (...args: V[]) => void {
  let timeoutId: Timeout;
  let isFirstCall = true;
  let wasCalledDuringDebounce = false;
  return (...args: V[]): void => {
    if (isFirstCall) {

      Reflect.apply(fn, this, args);
      isFirstCall = false;
    } else {
      wasCalledDuringDebounce = true;
    }

    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      if (wasCalledDuringDebounce) {

        Reflect.apply(fn, this, args);
        wasCalledDuringDebounce = false;
      }
      isFirstCall = true;
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
