type Listener<V> = (value: V) => void;

export class Emitter<V> {
  private readonly listeners = new Set<Listener<V>>();

  constructor() {
    this.emit = this.emit.bind(this);
    this.on = this.on.bind(this);
  }

  public on(listener: Listener<V>): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public once(listener: Listener<V>): () => void {
    const off = this.on((value) => {
      off();
      listener(value);
    });
    return off;
  }

  public emit(value: V): void {
    for (const listener of [...this.listeners]) {
      listener(value);
    }
  }
}
