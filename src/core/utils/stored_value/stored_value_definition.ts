import { Codec, createGuardedCodec } from "@/core/utils/codec/codec";
import { Guard, sameKindAs } from "@/core/utils/guard/guard";

export interface StoredValueDefinition<T> {
  readonly defaultValue: T;
  readonly codec: Codec<T>;
}

export function defineStoredValue<T>(defaultValue: T, accepts: Guard<T> | Codec<T> = sameKindAs(defaultValue)): StoredValueDefinition<T> {
  return { defaultValue, codec: typeof accepts === "function" ? createGuardedCodec(accepts) : accepts };
}
