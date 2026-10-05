type Listener<V> = (value: V) => void;

export interface Occurrence<V> {
  on: (listener: Listener<V>) => () => void;
  once: (listener: Listener<V>) => () => void;
}

export class Emitter<V> implements Occurrence<V> {
  private readonly listeners = new Set<Listener<V>>();

  public readonly on = (listener: Listener<V>): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  public readonly once = (listener: Listener<V>): (() => void) => {
    const off = this.on(value => {
      off();
      listener(value);
    });
    return off;
  };

  public readonly emit = (value: V): void => {
    for (const listener of [...this.listeners]) {
      listener(value);
    }
  };
}
