import { Emitter } from "@/lib/event/emitter";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values";
import { Signal } from "@/core/utils/reactive/signal";

export interface Preference<T> {
  readonly value: T;
  set: (value: T) => void;
  on: (listener: (value: T) => void) => () => void;
}

export type Guard<T> = (raw: unknown) => raw is T;

export class StoredPreference<T> implements Preference<T> {
  private readonly current: Signal<T>;
  private readonly changed = new Emitter<T>();

  constructor(
    private readonly store: LocalKeyedValues,
    private readonly key: string,
    defaultValue: T,
    accepts: Guard<T> = sameKindAs(defaultValue)
  ) {
    const stored = store.get(key);

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

export function oneOf<T>(values: readonly T[]): Guard<T> {
  return (raw): raw is T => values.includes(raw as T);
}

export function booleanPreference<T>(source: Preference<T>, trueValue: T, falseValue: T): Preference<boolean> {
  const read = (): boolean => source.value === trueValue;
  return {
    get value(): boolean {
      return read();
    },
    set: (value: boolean): void => source.set(value ? trueValue : falseValue),
    on: (listener: (value: boolean) => void): (() => void) => {
      let last = read();
      return source.on(() => {
        const next = read();

        if (next !== last) {
          last = next;
          listener(next);
        }
      });
    }
  };
}

function sameKindAs<T>(defaultValue: T): Guard<T> {
  return (raw): raw is T => kindOf(raw) === kindOf(defaultValue);
}

function kindOf(value: unknown): string {
  if (value === null) {
    return "null";
  }
  return Array.isArray(value) ? "array" : typeof value;
}
