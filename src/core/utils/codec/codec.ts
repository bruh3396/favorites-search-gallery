import { Guard, isRecord } from "@/core/utils/guards/guards";

export interface Codec<T> {
  decode: (stored: unknown) => T | undefined;
  encode: (value: T) => unknown;
}

export function createFieldsCodec<T extends object>(fields: { [K in keyof T]: Guard<T[K]> }): Codec<Partial<T>> {
  const entries = Object.entries(fields as Record<string, Guard<unknown>>);
  const pickAccepted = (record: Record<string, unknown>): Partial<T> => Object.fromEntries(entries
    .filter(([key, accepts]) => accepts(record[key]))
    .map(([key]) => [key, record[key]])) as Partial<T>;
  return {
    decode: (stored): Partial<T> | undefined => (isRecord(stored) ? pickAccepted(stored) : undefined),
    encode: (value): unknown => pickAccepted(value as Record<string, unknown>)
  };
}

export function createGuardedCodec<T>(accepts: Guard<T>): Codec<T> {
  return {
    decode: (stored): T | undefined => (accepts(stored) ? stored : undefined),
    encode: (value): unknown => value
  };
}

export function createSetCodec<T>(acceptsMember: Guard<T>): Codec<ReadonlySet<T>> {
  return {
    decode: (stored): ReadonlySet<T> | undefined => (Array.isArray(stored) && stored.every(acceptsMember) ? new Set(stored) : undefined),
    encode: (value): unknown => [...value]
  };
}
