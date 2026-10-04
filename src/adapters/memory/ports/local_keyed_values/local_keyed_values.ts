import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";

// Copies on the way in and out, like a real store's serialization, so a caller
// mutating a value it read or wrote never changes what is stored.
export class MemoryLocalKeyedValues implements LocalKeyedValues {
  private readonly entries = new Map<string, unknown>();

  public get(key: string): unknown {
    return structuredClone(this.entries.get(key));
  }

  public set(key: string, value: unknown): void {
    this.entries.set(key, structuredClone(value));
  }

  public remove(key: string): void {
    this.entries.delete(key);
  }
}
