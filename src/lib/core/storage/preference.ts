import { Storage } from ".";

const LOCAL_STORAGE_KEY = "preferences";
const CACHE: Record<string, unknown> = Storage.get<Record<string, unknown>>(LOCAL_STORAGE_KEY) ?? {};

export class Preference<T> {
  private readonly key: string;
  private readonly defaultValue: T;

  constructor(key: string, defaultValue: T) {
    this.key = key;
    this.defaultValue = defaultValue;
  }

  public get value(): T {
    return (CACHE[this.key] as T) ?? this.defaultValue;
  }

  public set(value: T): void {
    CACHE[this.key] = value;
    Storage.set(LOCAL_STORAGE_KEY, CACHE);
  }
}
