import { Preference } from "@/core/utils/preference/preference";
import { PreferenceDefinition } from "@/core/utils/preference/preference_definition";
import { PreferenceStorage } from "@/core/utils/preference/preference_storage";
import { StoredPreference } from "@/core/utils/preference/stored_preference";
import { isRecord } from "@/core/utils/guard/guard";

export type PreferenceTree<S> = {
  readonly [K in keyof S]: S[K] extends PreferenceDefinition<infer T> ? Preference<T> : PreferenceTree<S[K]>;
};

export function createPreferenceTree<S extends object, B extends keyof S & string>(schema: S, storage: PreferenceStorage, branches: readonly B[]): Pick<PreferenceTree<S>, B> {
  return Object.fromEntries(branches.map(branch => [branch, createNode(branch, schema[branch], storage)])) as Pick<PreferenceTree<S>, B>;
}

function createNode(key: string, node: unknown, storage: PreferenceStorage): unknown {
  if (isDefinition(node)) {
    return new StoredPreference({ key, defaultValue: node.defaultValue }, { storage, codec: node.codec });
  }
  const section = createSectionStorage(key, storage);
  return Object.fromEntries(Object.entries(node as object).map(([childKey, child]) => [childKey, createNode(childKey, child, section)]));
}

function createSectionStorage(name: string, parent: PreferenceStorage): PreferenceStorage {
  const read = (): Record<string, unknown> => {
    const stored = parent.get(name);
    return isRecord(stored) ? stored : {};
  };
  return {
    get: key => read()[key],
    set: (key, value): void => parent.set(name, { ...read(), [key]: value })
  };
}

function isDefinition(node: unknown): node is PreferenceDefinition<unknown> {
  return isRecord(node) && "defaultValue" in node && "codec" in node;
}
