export function throttle<V>(fn: (...args: V[]) => void, delay: number): (...args: V[]) => void {
  let isThrottling = false;
  return (...args) => {
    if (!isThrottling) {
      fn(...args);
      isThrottling = true;
      setTimeout(() => {
        isThrottling = false;
      }, delay);
    }
  };
}
