/* eslint-disable functional/no-let */
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
  getVersion: () => number;
}

interface Tracker {
  track: (source: Source) => void;
}

let running: Tracker | null = null;
let batchDepth = 0;
const batchedEffects = new Set<Effect>();

function runEffects(effects: Iterable<Effect>): void {
  for (const pendingEffect of effects) {
    pendingEffect.run();
  }
}

export class Signal<T> implements Readable<T>, Source {
  private readonly readers = new Set<Reader>();
  private version = 0;

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
    this.version += 1;
    const pending = batchDepth > 0 ? batchedEffects : new Set<Effect>();

    for (const reader of [...this.readers]) {
      reader.invalidate(pending);
    }

    if (batchDepth === 0) {
      runEffects(pending);
    }
  }

  public peek(): T {
    return this.current;
  }

  public getVersion(): number {
    return this.version;
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
  private sources = new Set<Source>();
  private cache: { value: T } | null = null;
  private stale = false;
  private version = 0;

  constructor(private readonly fn: () => T, private readonly equals: (previous: T, next: T) => boolean) { }

  public get value(): T {
    running?.track(this);
    return this.peek();
  }

  public peek(): T {
    if (this.cache === null || this.stale) {
      this.refresh(this.compute());
    }
    return this.cache!.value;
  }

  public getVersion(): number {
    this.peek();
    return this.version;
  }

  public invalidate(pending: Set<Effect>): void {
    if (this.cache === null || this.stale) {
      return;
    }
    this.stale = true;

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

  private refresh(next: T): void {
    if (this.cache === null || !this.equals(this.cache.value, next)) {
      this.cache = { value: next };
      this.version += 1;
    }
    this.stale = false;
  }

  private compute(): T {
    const previousSources = this.sources;
    const previous = running;

    this.sources = new Set();
    // eslint-disable-next-line consistent-this, @typescript-eslint/no-this-alias
    running = this;

    try {
      return this.fn();
    } finally {
      running = previous;
      this.release(previousSources);
    }
  }

  private release(previousSources: Set<Source>): void {
    for (const source of previousSources) {
      if (!this.sources.has(source)) {
        source.unsubscribe(this);
      }
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
  /** Each source this effect read, with the version its last run saw (-1 until the run finishes). */
  private sources = new Map<Source, number>();
  private active = true;
  private executing = false;
  private hasRun = false;

  constructor(private readonly fn: () => void) { }

  public track(source: Source): void {
    source.subscribe(this);
    this.sources.set(source, -1);
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

    if (this.hasRun && !this.hasChangedSource()) {
      return;
    }
    const previousSources = this.sources;
    const previous = running;

    this.sources = new Map();
    // eslint-disable-next-line consistent-this, @typescript-eslint/no-this-alias
    running = this;
    this.executing = true;
    this.hasRun = true;

    try {
      this.fn();
      this.recordVersions();
    } finally {
      running = previous;
      this.executing = false;
      this.release(previousSources);
    }
  }

  public dispose(): void {
    this.active = false;
    this.untrack();
  }

  private hasChangedSource(): boolean {
    for (const [source, version] of this.sources) {
      if (source.getVersion() !== version) {
        return true;
      }
    }
    return false;
  }

  private recordVersions(): void {
    for (const source of this.sources.keys()) {
      this.sources.set(source, source.getVersion());
    }
  }

  private release(previousSources: Map<Source, number>): void {
    for (const source of previousSources.keys()) {
      if (!this.sources.has(source)) {
        source.unsubscribe(this);
      }
    }
  }

  private untrack(): void {
    for (const source of this.sources.keys()) {
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

export function batch<T>(fn: () => T): T {
  batchDepth += 1;

  try {
    return fn();
  } finally {
    batchDepth -= 1;

    if (batchDepth === 0) {
      const effects = [...batchedEffects];

      batchedEffects.clear();
      runEffects(effects);
    }
  }
}

export interface ComputedOptions<T> {
  equals?: (previous: T, next: T) => boolean;
}

export function computed<T>(fn: () => T, { equals = Object.is }: ComputedOptions<T> = {}): Readable<T> {
  return new Computed(fn, equals);
}
