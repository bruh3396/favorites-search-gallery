export class StoredMapDefinition<S> {
  constructor(public readonly entry: S) { }
}

export function defineStoredMap<S extends object>(entry: S): StoredMapDefinition<S> {
  return new StoredMapDefinition(entry);
}
