import { Preference } from "@/core/utils/preference/preference";
import { PreferenceDefinition } from "@/core/utils/preference/preference_definition";
import { PreferenceStorage } from "@/core/utils/preference/preference_storage";
import { StoredPreference } from "@/core/utils/preference/stored_preference";

export type PreferenceSetSchema<T extends object> = { readonly [K in keyof T]: PreferenceDefinition<T[K]> };

export type PreferenceSet<T extends object> = { readonly [K in keyof T]: Preference<T[K]> };

export function createPreferenceSet<T extends object>(schema: PreferenceSetSchema<T>, storage: PreferenceStorage): PreferenceSet<T> {
  const definitions = Object.entries(schema) as Array<[string, PreferenceDefinition<unknown>]>;
  return Object.fromEntries(definitions
    .map(([key, { defaultValue, codec }]) => [key, new StoredPreference({ key, defaultValue }, { storage, codec })])) as unknown as PreferenceSet<T>;
}
