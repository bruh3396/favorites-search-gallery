import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";

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
