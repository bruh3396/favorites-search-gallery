import { doNothing } from "@/core/utils/function/function";

export type Cleanup = () => void;

export interface Scoped<T> {
  readonly result: T;
  dispose: Cleanup;
}

class Scope {
  private readonly cleanups = new Set<Cleanup>();
  private readonly values = new Map<Context<unknown>, unknown>();

  constructor(private readonly parent: Scope | null) { }

  public add(cleanup: Cleanup): Cleanup {
    this.cleanups.add(cleanup);
    return () => this.cleanups.delete(cleanup);
  }

  public provide<T>(context: Context<T>, value: T): void {
    this.values.set(context, value);
  }

  public find<T>(context: Context<T>): T | undefined {
    return this.values.has(context) ? this.values.get(context) as T : this.parent?.find(context);
  }

  public dispose(): void {
    const cleanups = [...this.cleanups].reverse();

    this.cleanups.clear();

    for (const cleanup of cleanups) {
      cleanup();
    }
  }
}

// eslint-disable-next-line functional/no-let
let current: Scope | null = null;

export class Context<T> {
  constructor(private readonly name: string) { }

  public provide(value: T): void {
    if (current === null) {
      throw new Error(`${this.name} can only be provided inside a scope`);
    }
    current.provide(this, value);
  }

  public read(): T {
    const value = current?.find(this);

    if (value === undefined) {
      throw new Error(`No ${this.name} was provided to this scope`);
    }
    return value;
  }
}

export function createScope<T>(build: () => T): Scoped<T> {
  return createScopeIn(current, build);
}

export function captureScope(): <T>(build: () => T) => Scoped<T> {
  const owner = current;
  return build => createScopeIn(owner, build);
}

export function onCleanup(cleanup: Cleanup): Cleanup {
  return current?.add(cleanup) ?? doNothing;
}

function createScopeIn<T>(parent: Scope | null, build: () => T): Scoped<T> {
  const scope = new Scope(parent);
  const detach = parent?.add(() => scope.dispose()) ?? doNothing;
  const dispose = (): void => {
    detach();
    scope.dispose();
  };
  const previous = current;

  current = scope;

  try {
    return { result: build(), dispose };
  } catch (error) {
    dispose();
    throw error;
  } finally {
    current = previous;
  }
}
