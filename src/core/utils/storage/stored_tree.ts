import { StoredMapDefinition } from "@/core/utils/storage/stored_map_definition";
import { StoredMap } from "@/core/utils/storage/stored_map";
import { StoredValue } from "@/core/utils/storage/stored_value";
import { StoredValueDefinition } from "@/core/utils/storage/stored_value_definition";
import { StoredValueStorage } from "@/core/utils/storage/stored_value_storage";
import { KeyedStoredValue } from "@/core/utils/storage/keyed_stored_value";
import { isRecord } from "@/core/utils/guard/unknown_utilities";

export type StoredTree<S> = {
  readonly [K in keyof S]:
    S[K] extends StoredValueDefinition<infer T> ? StoredValue<T> :
    S[K] extends StoredMapDefinition<infer E> ? StoredMap<E> :
    StoredTree<S[K]>;
};

export function createStoredTree<S extends object, B extends keyof S & string>(schema: S, storedValueStorage: StoredValueStorage, branches: readonly B[]): Pick<StoredTree<S>, B> {
  return Object.fromEntries(branches.map(branch => [branch, createNode(branch, schema[branch], storedValueStorage)])) as Pick<StoredTree<S>, B>;
}

function createNode(key: string, node: unknown, storedValueStorage: StoredValueStorage): unknown {
  if (isDefinition(node)) {
    return new KeyedStoredValue({ key, defaultValue: node.defaultValue }, { storedValueStorage, codec: node.codec });
  }
  const sectionStoredValueStorage = createSectionStorage(key, storedValueStorage);

  if (node instanceof StoredMapDefinition) {
    return createMap(node.entry as object, sectionStoredValueStorage);
  }
  return createSection(node as object, sectionStoredValueStorage);
}

function createSection(node: object, sectionStoredValueStorage: StoredValueStorage): unknown {
  return Object.fromEntries(Object.entries(node).map(([childKey, child]) => [childKey, createNode(childKey, child, sectionStoredValueStorage)]));
}

function createMap(entry: object, storedValueStorage: StoredValueStorage): StoredMap<object> {
  const entries = new Map<string, unknown>();
  return {
    get: (key): StoredTree<object> => {
      if (!entries.has(key)) {
        entries.set(key, createSection(entry, createSectionStorage(key, storedValueStorage)));
      }
      return entries.get(key) as StoredTree<object>;
    }
  };
}

function createSectionStorage(name: string, parentStoredValueStorage: StoredValueStorage): StoredValueStorage {
  const read = (): Record<string, unknown> => {
    const stored = parentStoredValueStorage.get(name);
    return isRecord(stored) ? stored : {};
  };
  return {
    get: key => read()[key],
    set: (key, value): void => parentStoredValueStorage.set(name, { ...read(), [key]: value })
  };
}

function isDefinition(node: unknown): node is StoredValueDefinition<unknown> {
  return isRecord(node) && "defaultValue" in node && "codec" in node;
}
