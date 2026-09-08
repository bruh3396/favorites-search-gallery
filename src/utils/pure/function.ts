export function doNothing(): void { }

export function identity<T>(value: T): T {
  return value;
}

export function chain<T>(initial: T, ...functions: Array<(acc: T) => T>): T {
  return functions.reduce((previous, f) => f(previous), initial);
}
