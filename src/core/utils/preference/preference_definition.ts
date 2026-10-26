import { Codec, createGuardedCodec, createRecordCodec } from "@/core/utils/codec/codec";
import { FieldGuards, Guard, sameKindAs } from "@/core/utils/guard/guard";

export interface PreferenceDefinition<T> {
  readonly defaultValue: T;
  readonly codec: Codec<T>;
}

export function definePreference<T>(defaultValue: T, accepts: Guard<T> = sameKindAs(defaultValue)): PreferenceDefinition<T> {
  return { defaultValue, codec: createGuardedCodec(accepts) };
}

export function defineRecordPreference<T extends object>(defaultValue: T, fields: FieldGuards<T>): PreferenceDefinition<T> {
  return { defaultValue, codec: createRecordCodec(defaultValue, fields) };
}
