import { KeyValueStore } from "@/core/boundary/ports/key_value_store";

type Entries = Record<string, unknown>;

export class NamespacedStore implements KeyValueStore {
  private readonly store: KeyValueStore;
  private readonly namespace: string;
  private entries: Entries;

  constructor(store: KeyValueStore, namespace: string) {
    this.store = store;
    this.namespace = namespace;
    this.entries = this.readStored();
  }

  public get(key: string): unknown {
    return this.entries[key];
  }

  public set(key: string, value: unknown): void {
    this.save({ ...this.entries, ...this.readStored(), [key]: value });
  }

  public remove(key: string): void {
    const { [key]: _removed, ...rest } = { ...this.entries, ...this.readStored() };

    this.save(rest);
  }

  public clear(): void {
    this.store.remove(this.namespace);
    this.entries = {};
  }

  private save(entries: Entries): void {
    this.entries = entries;
    this.store.set(this.namespace, entries);
  }

  private readStored(): Entries {
    const stored = this.store.get(this.namespace);
    return typeof stored === "object" && stored !== null && !Array.isArray(stored) ? stored as Entries : {};
  }
}
