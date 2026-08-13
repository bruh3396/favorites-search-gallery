import { Emitter } from "@/lib/communication/emitter";
import { Storage } from "@/lib/storage/local_storage";

const LOCAL_STORAGE_KEY = "preferences";
const cache: Record<string, unknown> = readStored();

function readStored(): Record<string, unknown> {
  return Storage.get<Record<string, unknown>>(LOCAL_STORAGE_KEY) ?? {};
}

export class Preference<T> {
  private readonly key: string;
  private readonly defaultValue: T;
  private readonly emitter: Emitter<T> = new Emitter<T>();

  constructor(key: string, defaultValue: T) {
    this.key = key;
    this.defaultValue = defaultValue;
    this.set = this.set.bind(this);
    this.on = this.on.bind(this);
  }

  public get value(): T {
    return (cache[this.key] as T) ?? this.defaultValue;
  }

  public static resetAll(): void {
    Storage.remove(LOCAL_STORAGE_KEY);

    for (const key of Object.keys(cache)) {
      delete cache[key];
    }
  }

  public set(value: T): void {
    Object.assign(cache, readStored());
    cache[this.key] = value;
    Storage.set(LOCAL_STORAGE_KEY, cache);
    this.emitter.emit(value);
  }

  public on(listener: (value: T) => void): void {
    this.emitter.on(listener);
  }
}
