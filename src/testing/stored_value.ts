import { Emitter } from "@/core/utils/reactive/emitter";
import { Signal } from "@/core/utils/reactive/signal";
import { StoredValue } from "@/core/utils/storage/stored_value";

export function createStoredValue<T>(initial: T): StoredValue<T> {
  const current = new Signal(initial);
  const changed = new Emitter<T>();
  return {
    get value(): T {
      return current.value;
    },
    peek: (): T => current.peek(),
    set: (value: T): void => {
      current.value = value;
      changed.emit(value);
    },
    changed
  };
}
