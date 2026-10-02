// eslint-disable-next-line functional/no-let
let running: Effect | null = null;

export class Signal<T> {
  private readonly readers = new Set<Effect>();

  constructor(private current: T) { }

  public get value(): T {
    running?.track(this);
    return this.current;
  }

  public set value(next: T) {
    if (Object.is(next, this.current)) {
      return;
    }
    this.current = next;

    for (const reader of [...this.readers]) {
      reader.run();
    }
  }

  public peek(): T {
    return this.current;
  }

  public subscribe(reader: Effect): void {
    this.readers.add(reader);
  }

  public unsubscribe(reader: Effect): void {
    this.readers.delete(reader);
  }
}

class Effect {
  private readonly sources = new Set<Signal<unknown>>();
  private active = true;
  private executing = false;

  constructor(private readonly fn: () => void) { }

  public track(source: Signal<unknown>): void {
    source.subscribe(this);
    this.sources.add(source);
  }

  public run(): void {
    if (!this.active) {
      return;
    }

    if (this.executing) {
      throw new Error("An effect changed a signal it reads");
    }
    this.untrack();
    const previous = running;

    // eslint-disable-next-line consistent-this, @typescript-eslint/no-this-alias
    running = this;
    this.executing = true;

    try {
      this.fn();
    } finally {
      running = previous;
      this.executing = false;
    }
  }

  public dispose(): void {
    this.active = false;
    this.untrack();
  }

  private untrack(): void {
    for (const source of this.sources) {
      source.unsubscribe(this);
    }
    this.sources.clear();
  }
}

export function effect(fn: () => void): () => void {
  const created = new Effect(fn);

  created.run();
  return () => created.dispose();
}
