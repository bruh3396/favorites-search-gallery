import { onCleanup } from "@/core/utils/reactive/scope";

export interface Readable<T> {
  readonly value: T;
  peek: () => T;
}

interface Reader {
  invalidate: (pending: Set<Effect>) => void;
}

interface Source {
  subscribe: (reader: Reader) => void;
  unsubscribe: (reader: Reader) => void;
}

interface Tracker {
  track: (source: Source) => void;
}

// eslint-disable-next-line functional/no-let
let running: Tracker | null = null;

export class Signal<T> implements Readable<T>, Source {
  private readonly readers = new Set<Reader>();

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
    const pending = new Set<Effect>();

    for (const reader of [...this.readers]) {
      reader.invalidate(pending);
    }

    for (const pendingEffect of pending) {
      pendingEffect.run();
    }
  }

  public peek(): T {
    return this.current;
  }

  public subscribe(reader: Reader): void {
    this.readers.add(reader);
  }

  public unsubscribe(reader: Reader): void {
    this.readers.delete(reader);
  }
}

class Computed<T> implements Readable<T>, Source, Reader, Tracker {
  private readonly readers = new Set<Reader>();
  private readonly sources = new Set<Source>();
  private cache: { value: T } | null = null;

  constructor(private readonly fn: () => T) { }

  public get value(): T {
    running?.track(this);
    return this.peek();
  }

  public peek(): T {
    const cache = this.cache ?? { value: this.compute() };

    this.cache = cache;
    return cache.value;
  }

  public invalidate(pending: Set<Effect>): void {
    if (this.cache === null) {
      return;
    }
    this.cache = null;

    if (this.readers.size === 0) {
      this.untrack();
    }

    for (const reader of [...this.readers]) {
      reader.invalidate(pending);
    }
  }

  public track(source: Source): void {
    source.subscribe(this);
    this.sources.add(source);
  }

  public subscribe(reader: Reader): void {
    this.readers.add(reader);
  }

  public unsubscribe(reader: Reader): void {
    this.readers.delete(reader);

    if (this.readers.size === 0) {
      this.cache = null;
      this.untrack();
    }
  }

  private compute(): T {
    this.untrack();
    const previous = running;

    // eslint-disable-next-line consistent-this, @typescript-eslint/no-this-alias
    running = this;

    try {
      return this.fn();
    } finally {
      running = previous;
    }
  }

  private untrack(): void {
    for (const source of this.sources) {
      source.unsubscribe(this);
    }
    this.sources.clear();
  }
}

class Effect implements Reader, Tracker {
  private readonly sources = new Set<Source>();
  private active = true;
  private executing = false;

  constructor(private readonly fn: () => void) { }

  public track(source: Source): void {
    source.subscribe(this);
    this.sources.add(source);
  }

  public invalidate(pending: Set<Effect>): void {
    pending.add(this);
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
  const detach = onCleanup(() => created.dispose());

  created.run();
  return () => {
    detach();
    created.dispose();
  };
}

export function untracked<T>(fn: () => T): T {
  const previous = running;

  running = null;

  try {
    return fn();
  } finally {
    running = previous;
  }
}

export function computed<T>(fn: () => T): Readable<T> {
  return new Computed(fn);
}
