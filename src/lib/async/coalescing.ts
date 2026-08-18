import { DeferredPromise, Timeout } from "@/types/async";

export class CoalescingExecutor<T> {
  private readonly pollInterval: number;
  private pollHandle: Timeout;
  private lastScheduleTime: number = 0;
  private pending: T[] = [];

  constructor(
    private readonly maxSize: number,
    private readonly flushTimeout: number,
    private readonly execute: (coalesced: T[]) => void
  ) {
    this.pollInterval = Math.round(Math.max(10, flushTimeout / 5));
  }

  public schedule(item: T): void {
    this.pending.push(item);
    this.lastScheduleTime = performance.now();

    if (this.pending.length >= this.maxSize) {
      this.flush();
      return;
    }

    if (this.pollHandle !== undefined) {
      return;
    }

    this.pollHandle = setInterval(() => {
      if (performance.now() - this.lastScheduleTime >= this.flushTimeout) {
        this.flush();
      }
    }, this.pollInterval);
  }

  private flush(): void {
    try {
      this.execute(this.pending);
    } finally {
      clearInterval(this.pollHandle);
      this.pollHandle = undefined;
      this.pending = [];
    }
  }
}

export class CoalescingResolver<K, V> {
  private readonly deferred = new Map<K, DeferredPromise<V>[]>();
  private readonly executor: CoalescingExecutor<K>;

  constructor(
    maxSize: number,
    flushTimeout: number,
    private readonly resolve: (coalesced: K[]) => Promise<Map<K, V>>
  ) {
    this.executor = new CoalescingExecutor<K>(maxSize, flushTimeout, coalesced => this.resolveCoalesced(coalesced));
  }

  public schedule(key: K): Promise<V> {
    return new Promise<V>((resolve, reject) => {
      const promise = { resolve, reject };
      const existing = this.deferred.get(key);

      if (existing === undefined) {
        this.deferred.set(key, [promise]);
        this.executor.schedule(key);
      } else {
        existing.push(promise);
      }
    });
  }

  private resolveCoalesced(coalesced: K[]): void {
    this.resolve(coalesced)
      .then(resolution => {
        for (const [key, value] of resolution) {
          this.deferred.get(key)?.forEach(promise => promise.resolve(value));
          this.deferred.delete(key);
        }
      }).catch((error: unknown) => {
        for (const key of coalesced) {
          this.deferred.get(key)?.forEach(promise => promise.reject(error));
          this.deferred.delete(key);
        }
      });
  }
}
