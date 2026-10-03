export type Guard<T> = (raw: unknown) => raw is T;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

export function sameKindAs<T>(example: T): Guard<T> {
  return (raw): raw is T => kindOf(raw) === kindOf(example);
}

function kindOf(value: unknown): string {
  if (value === null) {
    return "null";
  }
  return Array.isArray(value) ? "array" : typeof value;
}
