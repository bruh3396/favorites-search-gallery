import { Guard, sameKindAs } from "@/core/utils/guards/guards";
import { Emitter } from "@/lib/event/emitter";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values";
import { Signal } from "@/core/utils/reactive/signal";

export interface Preference<T> {
  readonly value: T;
  set: (value: T) => void;
  on: (listener: (value: T) => void) => () => void;
}

export interface StoredPreferenceConfiguration<T> {
  key: string;
  defaultValue: T;
}

export interface StoredPreferenceDependencies<T> {
  store: LocalKeyedValues;
  accepts?: Guard<T>;
}

export class StoredPreference<T> implements Preference<T> {
  private readonly store: LocalKeyedValues;
  private readonly key: string;
  private readonly current: Signal<T>;
  private readonly changed = new Emitter<T>();

  constructor({ key, defaultValue }: StoredPreferenceConfiguration<T>, dependencies: StoredPreferenceDependencies<T>) {
    const { store, accepts = sameKindAs(defaultValue) } = dependencies;
    const stored = store.get(key);

    this.store = store;
    this.key = key;
    this.current = new Signal(accepts(stored) ? stored : defaultValue);
    this.set = this.set.bind(this);
    this.on = this.on.bind(this);
  }

  public get value(): T {
    return this.current.value;
  }

  public set(value: T): void {
    if (Object.is(value, this.current.peek())) {
      return;
    }
    this.store.set(this.key, value);
    this.current.value = value;
    this.changed.emit(value);
  }

  public on(listener: (value: T) => void): () => void {
    return this.changed.on(listener);
  }
}

export function booleanPreference<T>(source: Preference<T>, trueValue: T, falseValue: T): Preference<boolean> {
  const read = (): boolean => source.value === trueValue;
  return {
    get value(): boolean {
      return read();
    },
    set: (value: boolean): void => source.set(value ? trueValue : falseValue),
    on: (listener: (value: boolean) => void): (() => void) => {
      let wasTrue = read();
      return source.on(() => {
        const isTrue = read();

        if (isTrue !== wasTrue) {
          wasTrue = isTrue;
          listener(isTrue);
        }
      });
    }
  };
}
