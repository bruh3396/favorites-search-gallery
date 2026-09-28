import { KeyValueStore } from "@/core/boundary/ports/key_value_store";

export class BrowserKeyValueStore implements KeyValueStore {
  public get(key: string): unknown {
    const item = localStorage.getItem(key);

    if (item === null) {
      return undefined;
    }
    try {
      return JSON.parse(item);
    } catch {
      return undefined;
    }
  }

  public set(key: string, value: unknown): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  public remove(key: string): void {
    localStorage.removeItem(key);
  }
}
