import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

export interface CoalescingConfiguration {
  flushSize: number;
  flushTimeout: number;
}

export interface CoalescingExecutorDependencies<T> {
  execute: (coalesced: T[]) => void;
  scheduler: Scheduler;
}

export interface CoalescingResolverDependencies<K, V> {
  resolve: (coalesced: K[]) => Promise<Map<K, V>>;
  scheduler: Scheduler;
}

export class CoalescingExecutor<T> {
  private pending: T[] = [];
  private cancelFlush: (() => void) | undefined;

  constructor(
    private readonly configuration: CoalescingConfiguration,
    private readonly dependencies: CoalescingExecutorDependencies<T>
  ) { }

  public schedule(item: T): void {
    this.pending.push(item);
    this.cancelFlush?.();

    if (this.pending.length >= this.configuration.flushSize) {
      this.flush();
      return;
    }
    this.cancelFlush = this.dependencies.scheduler.schedule(() => this.flush(), this.configuration.flushTimeout);
  }

  private flush(): void {
    const coalesced = this.pending;

    this.pending = [];
    this.cancelFlush = undefined;
    this.dependencies.execute(coalesced);
  }
}

export class CoalescingResolver<K, V> {
  private readonly deferred = new Map<K, PromiseWithResolvers<V>[]>();
  private readonly executor: CoalescingExecutor<K>;
  private readonly resolve: (coalesced: K[]) => Promise<Map<K, V>>;

  constructor(configuration: CoalescingConfiguration, dependencies: CoalescingResolverDependencies<K, V>) {
    this.resolve = dependencies.resolve;
    this.executor = new CoalescingExecutor<K>(configuration, {
      execute: (coalesced): void => this.resolveCoalesced(coalesced),
      scheduler: dependencies.scheduler
    });
  }

  public schedule(key: K): Promise<V> {
    const deferred = Promise.withResolvers<V>();
    const existing = this.deferred.get(key);

    if (existing === undefined) {
      this.deferred.set(key, [deferred]);
      this.executor.schedule(key);
    } else {
      existing.push(deferred);
    }
    return deferred.promise;
  }

  private resolveCoalesced(coalesced: K[]): void {
    this.resolve(coalesced)
      .then(resolution => {
        for (const key of coalesced) {
          if (resolution.has(key)) {
            this.settle(key, deferred => deferred.resolve(resolution.get(key) as V));
          } else {
            this.settle(key, deferred => deferred.reject(new Error("Coalesced call left this key unresolved")));
          }
        }
      }).catch((error: unknown) => {
        for (const key of coalesced) {
          this.settle(key, deferred => deferred.reject(error));
        }
      });
  }

  private settle(key: K, outcome: (deferred: PromiseWithResolvers<V>) => void): void {
    this.deferred.get(key)?.forEach(outcome);
    this.deferred.delete(key);
  }
}
