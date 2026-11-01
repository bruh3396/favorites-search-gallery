import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";

type Entries = Readonly<Record<string, unknown>>;

export interface NamespacedLocalKeyedValuesConfiguration {
  readonly namespace: string;
  readonly uncached?: boolean;
}

export class NamespacedLocalKeyedValues implements LocalKeyedValues {
  private readonly innerLocalKeyedValues: LocalKeyedValues;
  private readonly namespace: string;
  private readonly uncached: boolean;
  private entries: Entries;

  constructor(configuration: NamespacedLocalKeyedValuesConfiguration, innerLocalKeyedValues: LocalKeyedValues) {
    this.innerLocalKeyedValues = innerLocalKeyedValues;
    this.namespace = configuration.namespace;
    this.uncached = configuration.uncached ?? false;
    this.entries = this.readStored();
  }

  public get(key: string): unknown {
    return (this.uncached ? this.readStored() : this.entries)[key];
  }

  public set(key: string, value: unknown): void {
    this.save({ ...this.entries, ...this.readStored(), [key]: value });
  }

  public remove(key: string): void {
    const { [key]: _removed, ...rest } = { ...this.entries, ...this.readStored() };

    this.save(rest);
  }

  public clear(): void {
    this.innerLocalKeyedValues.remove(this.namespace);
    this.entries = {};
  }

  private save(entries: Entries): void {
    this.entries = entries;
    this.innerLocalKeyedValues.set(this.namespace, entries);
  }

  private readStored(): Entries {
    const stored = this.innerLocalKeyedValues.get(this.namespace);
    return typeof stored === "object" && stored !== null && !Array.isArray(stored) ? stored as Entries : {};
  }
}
