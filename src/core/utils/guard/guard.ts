import { isOneOf, isRecord } from "@/core/utils/guard/unknown_utilities";

export type Guard<T> = (raw: unknown) => raw is T;

export type FieldGuards<T extends object> = { [K in keyof T]: Guard<T[K]> };

export function createOneOfGuard<T>(members: readonly T[]): Guard<T> {
  return (raw): raw is T => isOneOf(members, raw);
}

export function createFieldsGuard<T extends object>(fields: FieldGuards<T>): Guard<T> {
  const entries = Object.entries(fields as Record<string, Guard<unknown>>);
  return (raw): raw is T => isRecord(raw) && entries.every(([key, accepts]) => accepts(raw[key]));
}

export function createSameKindGuard<T>(example: T): Guard<T> {
  return (raw): raw is T => getKind(raw) === getKind(example);
}

function getKind(value: unknown): string {
  if (value === null) {
    return "null";
  }
  return Array.isArray(value) ? "array" : typeof value;
}
