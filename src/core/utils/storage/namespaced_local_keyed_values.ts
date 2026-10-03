import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values";

type Entries = Record<string, unknown>;

export class NamespacedLocalKeyedValues implements LocalKeyedValues {
  private readonly inner: LocalKeyedValues;
  private readonly namespace: string;
  private entries: Entries;

  constructor(namespace: string, inner: LocalKeyedValues) {
    this.inner = inner;
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
    this.inner.remove(this.namespace);
    this.entries = {};
  }

  private save(entries: Entries): void {
    this.entries = entries;
    this.inner.set(this.namespace, entries);
  }

  private readStored(): Entries {
    const stored = this.inner.get(this.namespace);
    return typeof stored === "object" && stored !== null && !Array.isArray(stored) ? stored as Entries : {};
  }
}
