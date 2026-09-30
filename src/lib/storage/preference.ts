import { Emitter } from "@/lib/event/emitter";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values";

export class Preference<T> {
  private readonly store: LocalKeyedValues;
  private readonly key: string;
  private readonly defaultValue: T;
  private readonly emitter: Emitter<T> = new Emitter<T>();

  constructor(store: LocalKeyedValues, key: string, defaultValue: T) {
    this.store = store;
    this.key = key;
    this.defaultValue = defaultValue;
    this.set = this.set.bind(this);
    this.on = this.on.bind(this);
  }

  public get value(): T {
    return (this.store.get(this.key) as T | undefined) ?? this.defaultValue;
  }

  public set(value: T): void {
    this.store.set(this.key, value);
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
