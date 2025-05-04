import {Timeout} from "../../types/primitives/primitives";

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
      // eslint-disable-next-line no-invalid-this
      Reflect.apply(fn, this, args);
      firstCall = false;
    } else {
      calledDuringDebounce = true;
    }

    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      if (calledDuringDebounce) {
        // eslint-disable-next-line no-invalid-this
        Reflect.apply(fn, this, args);
        calledDuringDebounce = false;
      }
      firstCall = true;
    }, delay) as Timeout;
  };
}
