export type Guard<T> = (raw: unknown) => raw is T;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isNumber(value: unknown): value is number {
  return typeof value === "number";
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

export function isOneOf<T>(members: readonly T[], value: unknown): value is T {
  return members.some(member => member === value);
}

export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`);
}

export function oneOf<T>(members: readonly T[]): Guard<T> {
  return (raw): raw is T => isOneOf(members, raw);
}

export function hasFields<T extends object>(fields: { [K in keyof T]: Guard<T[K]> }): Guard<T> {
  const entries = Object.entries(fields as Record<string, Guard<unknown>>);
  return (raw): raw is T => isRecord(raw) && entries.every(([key, accepts]) => accepts(raw[key]));
}

export function sameKindAs<T>(example: T): Guard<T> {
  return (raw): raw is T => getKind(raw) === getKind(example);
}

function getKind(value: unknown): string {
  if (value === null) {
    return "null";
  }
  return Array.isArray(value) ? "array" : typeof value;
}
