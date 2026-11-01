export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isNumber(value: unknown): value is number {
  return typeof value === "number";
}

export function isInUnitInterval(value: unknown): value is number {
  return Number.isFinite(value) && (value as number) >= 0 && (value as number) <= 1;
}

export function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

export function isOneOf<T>(members: readonly T[], value: unknown): value is T {
  return members.some(member => member === value);
}
