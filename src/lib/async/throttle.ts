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
