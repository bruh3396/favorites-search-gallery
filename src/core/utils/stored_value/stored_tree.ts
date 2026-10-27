import { StoredMapDefinition } from "@/core/utils/stored_value/stored_map_definition";
import { StoredValue } from "@/core/utils/stored_value/stored_value";
import { StoredValueDefinition } from "@/core/utils/stored_value/stored_value_definition";
import { StoredValueStorage } from "@/core/utils/stored_value/stored_value_storage";
import { KeyedStoredValue } from "@/core/utils/stored_value/keyed_stored_value";
import { isRecord } from "@/core/utils/guard/guard";

export type StoredTree<S> = {
  readonly [K in keyof S]:
    S[K] extends StoredValueDefinition<infer T> ? StoredValue<T> :
    S[K] extends StoredMapDefinition<infer E> ? StoredMap<E> :
    StoredTree<S[K]>;
};

export interface StoredMap<S> {
  get: (key: string) => StoredTree<S>;
}

export function createStoredTree<S extends object, B extends keyof S & string>(schema: S, storage: StoredValueStorage, branches: readonly B[]): Pick<StoredTree<S>, B> {
  return Object.fromEntries(branches.map(branch => [branch, createNode(branch, schema[branch], storage)])) as Pick<StoredTree<S>, B>;
}

function createNode(key: string, node: unknown, storage: StoredValueStorage): unknown {
  if (isDefinition(node)) {
    return new KeyedStoredValue({ key, defaultValue: node.defaultValue }, { storage, codec: node.codec });
  }
  const section = createSectionStorage(key, storage);

  if (node instanceof StoredMapDefinition) {
    return createMap(node.entry as object, section);
  }
  return createSection(node as object, section);
}

function createSection(node: object, section: StoredValueStorage): unknown {
  return Object.fromEntries(Object.entries(node).map(([childKey, child]) => [childKey, createNode(childKey, child, section)]));
}

function createMap(entry: object, storage: StoredValueStorage): StoredMap<object> {
  const entries = new Map<string, unknown>();
  return {
    get: (key): StoredTree<object> => {
      if (!entries.has(key)) {
        entries.set(key, createSection(entry, createSectionStorage(key, storage)));
      }
      return entries.get(key) as StoredTree<object>;
    }
  };
}

function createSectionStorage(name: string, parent: StoredValueStorage): StoredValueStorage {
  const read = (): Record<string, unknown> => {
    const stored = parent.get(name);
    return isRecord(stored) ? stored : {};
  };
  return {
    get: key => read()[key],
    set: (key, value): void => parent.set(name, { ...read(), [key]: value })
  };
}

function isDefinition(node: unknown): node is StoredValueDefinition<unknown> {
  return isRecord(node) && "defaultValue" in node && "codec" in node;
}
