import { CoalescingExecutor } from "@/lib/async/coalescing_executor";
import { DeferredPromise } from "@/types/async";

export class CoalescingResolver<K, V> {
  private readonly deferred = new Map<K, DeferredPromise<V>[]>();
  private readonly executor: CoalescingExecutor<K>;

  constructor(
    maxSize: number,
    flushTimeout: number,
    private readonly resolve: (coalesced: K[]) => Promise<Map<K, V>>
  ) {
    this.executor = new CoalescingExecutor<K>(maxSize, flushTimeout, coalesced => this.flush(coalesced));
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

  private flush(coalesced: K[]): void {
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
