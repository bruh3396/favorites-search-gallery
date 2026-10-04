import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";

export class BrowserLocalKeyedValues implements LocalKeyedValues {
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
