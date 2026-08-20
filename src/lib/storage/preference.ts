import { Emitter } from "@/lib/events/emitter";
import { Storage } from "@/lib/storage/local_storage";

const LOCAL_STORAGE_KEY = "preferences";
const cache: Record<string, unknown> = readStored();

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

export function booleanPreference<T>(source: Preference<T>, trueValue: T, falseValue: T): Preference<boolean> {
  return {
    get value(): boolean {
      return source.value === trueValue;
    },
    set(value: boolean): void {
      source.set(value ? trueValue : falseValue);
    },
    on(listener: (value: boolean) => void): void {
      source.on((next) => listener(next === trueValue));
    }
  } as Preference<boolean>;
}

function readStored(): Record<string, unknown> {
  return Storage.get<Record<string, unknown>>(LOCAL_STORAGE_KEY) ?? {};
}
