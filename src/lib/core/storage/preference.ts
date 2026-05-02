import { Storage } from "./storage_instance";

const LOCAL_STORAGE_KEY = "preferences";
const cache: Record<string, unknown> = Storage.get<Record<string, unknown>>(LOCAL_STORAGE_KEY) ?? {};

export class Preference<T> {
  private readonly key: string;
  private readonly defaultValue: T;

  constructor(key: string, defaultValue: T) {
    this.key = key;
    this.defaultValue = defaultValue;
  }

  public get value(): T {
    return (cache[this.key] as T) ?? this.defaultValue;
  }

  public set(value: T): void {
    cache[this.key] = value;
    Storage.set(LOCAL_STORAGE_KEY, cache);
  }
}
