import { Scheduler } from "@/core/boundary/ports/scheduler";

interface Deferred<V> {
  resolve: (value: V) => void;
  reject: (reason: unknown) => void;
}

export class CoalescingExecutor<T> {
  private pending: T[] = [];
  private cancelFlush: (() => void) | undefined;

  constructor(
    private readonly maxSize: number,
    private readonly flushTimeout: number,
    private readonly execute: (coalesced: T[]) => void,
    private readonly scheduler: Scheduler
  ) { }

  public schedule(item: T): void {
    this.pending.push(item);
    this.cancelFlush?.();

    if (this.pending.length >= this.maxSize) {
      this.flush();
      return;
    }
    this.cancelFlush = this.scheduler.schedule(() => this.flush(), this.flushTimeout);
  }

  private flush(): void {
    const coalesced = this.pending;

    this.pending = [];
    this.cancelFlush = undefined;
    this.execute(coalesced);
  }
}

export class CoalescingResolver<K, V> {
  private readonly deferred = new Map<K, Deferred<V>[]>();
  private readonly executor: CoalescingExecutor<K>;

  constructor(
    maxSize: number,
    flushTimeout: number,
    private readonly resolve: (coalesced: K[]) => Promise<Map<K, V>>,
    scheduler: Scheduler
  ) {
    this.executor = new CoalescingExecutor<K>(maxSize, flushTimeout, coalesced => this.resolveCoalesced(coalesced), scheduler);
  }

  public schedule(key: K): Promise<V> {
    return new Promise<V>((resolve, reject) => {
      const deferred = { resolve, reject };
      const existing = this.deferred.get(key);

      if (existing === undefined) {
        this.deferred.set(key, [deferred]);
        this.executor.schedule(key);
      } else {
        existing.push(deferred);
      }
    });
  }

  private resolveCoalesced(coalesced: K[]): void {
    this.resolve(coalesced)
      .then(resolution => {
        for (const [key, value] of resolution) {
          this.deferred.get(key)?.forEach(deferred => deferred.resolve(value));
          this.deferred.delete(key);
        }
      }).catch((error: unknown) => {
        for (const key of coalesced) {
          this.deferred.get(key)?.forEach(deferred => deferred.reject(error));
          this.deferred.delete(key);
        }
      });
  }
}
