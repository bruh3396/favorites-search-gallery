import { Guard } from "@/core/utils/guards/guards";

export interface Codec<T> {
  decode: (stored: unknown) => T | undefined;
  encode: (value: T) => unknown;
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
