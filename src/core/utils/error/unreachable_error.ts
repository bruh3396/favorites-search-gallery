export class UnreachableError extends Error {
  constructor(value: never) {
    super(`Unexpected value: ${String(value)}`);
    this.name = "UnreachableError";
  }
}
