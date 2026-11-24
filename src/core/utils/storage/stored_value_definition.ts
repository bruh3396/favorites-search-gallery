import { Codec, createGuardedCodec } from "@/core/utils/codec/codec";
import { Guard } from "@/core/utils/guard/guard";
import { createSameKindGuard } from "@/core/utils/guard/same_kind_guard";
export interface StoredValueDefinition<T> {
  readonly defaultValue: T;
  readonly codec: Codec<T>;
}

export function createStoredValueDefinition<T>(defaultValue: T, accepts: Guard<T> | Codec<T> = createSameKindGuard(defaultValue)): StoredValueDefinition<T> {
  return { defaultValue, codec: typeof accepts === "function" ? createGuardedCodec(accepts) : accepts };
}
