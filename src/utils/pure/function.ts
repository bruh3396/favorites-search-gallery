export function doNothing(): void { }

export function chain<T>(initial: T, ...functions: Array<(acc: T) => T>): T {
  return functions.reduce((previous, f) => f(previous), initial);
}
