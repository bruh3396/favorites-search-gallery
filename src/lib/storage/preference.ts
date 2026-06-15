import { Emitter } from "@/lib/communication/emitter";
import { Storage } from "@/lib/storage/local_storage";

const LOCAL_STORAGE_KEY = "preferences";
const cache: Record<string, unknown> = Storage.get<Record<string, unknown>>(LOCAL_STORAGE_KEY) ?? {};

export class Preference<T> {
  private readonly key: string;
  private readonly defaultValue: T;
  private readonly emitter: Emitter<T> = new Emitter<T>();

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
    this.emitter.emit(value);
  }

  public on(listener: (value: T) => void): void {
    this.emitter.on(listener);
  }
}
