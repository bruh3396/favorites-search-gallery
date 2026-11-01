import { doNothing } from "@/core/utils/function/function_utilities";

export type Cleanup = () => void;

export interface Scoped<T> {
  readonly result: T;
  readonly dispose: Cleanup;
}

class Scope {
  private readonly cleanups = new Set<Cleanup>();
  private readonly values = new Map<ScopeContext<unknown>, unknown>();

  constructor(private readonly parentScope: Scope | null) { }

  public add(cleanup: Cleanup): Cleanup {
    this.cleanups.add(cleanup);
    return () => this.cleanups.delete(cleanup);
  }

  public provide<T>(context: ScopeContext<T>, value: T): void {
    this.values.set(context, value);
  }

  public find<T>(context: ScopeContext<T>): T | undefined {
    return this.values.has(context) ? this.values.get(context) as T : this.parentScope?.find(context);
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
let currentScope: Scope | null = null;

export class ScopeContext<T> {
  constructor(private readonly name: string) { }

  public provide(value: T): void {
    if (currentScope === null) {
      throw new Error(`${this.name} can only be provided inside a scope`);
    }
    currentScope.provide(this, value);
  }

  public read(): T {
    const value = currentScope?.find(this);

    if (value === undefined) {
      throw new Error(`No ${this.name} was provided to this scope`);
    }
    return value;
  }
}

export function createScope<T>(build: () => T): Scoped<T> {
  return createScopeIn(currentScope, build);
}

export function captureScope(): <T>(build: () => T) => Scoped<T> {
  const ownerScope = currentScope;
  return build => createScopeIn(ownerScope, build);
}

export function onCleanup(cleanup: Cleanup): Cleanup {
  return currentScope?.add(cleanup) ?? doNothing;
}

function createScopeIn<T>(parentScope: Scope | null, build: () => T): Scoped<T> {
  const scope = new Scope(parentScope);
  const detach = parentScope?.add(() => scope.dispose()) ?? doNothing;
  const dispose = (): void => {
    detach();
    scope.dispose();
  };
  const previousScope = currentScope;

  currentScope = scope;

  try {
    return { result: build(), dispose };
  } catch (error) {
    dispose();
    throw error;
  } finally {
    currentScope = previousScope;
  }
}
