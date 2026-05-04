import { CoalescingExecutor } from "./coalescing_executor";
import { ConcurrencyLimiter } from "./concurrency_limiter";

type PromiseCallback<V> = {
  resolve: (value: V) => void;
  reject: (reason: unknown) => void
};

export class CoalescingResolver<V> {
  private readonly pending = new Map<string, PromiseCallback<V>[]>();
  private readonly executor: CoalescingExecutor<string>;

  constructor(
    batchSize: number,
    flushDelay: number,
    private readonly limiter: ConcurrencyLimiter,
    private readonly resolveBatch: (keys: string[]) => Promise<Record<string, V>>
  ) {
    this.executor = new CoalescingExecutor<string>(batchSize, flushDelay, keys => this.flush(keys));
  }

  public resolve(key: string): Promise<V> {
    return new Promise<V>((resolve, reject) => {
      if (this.pending.has(key)) {
        this.join(key, { resolve, reject });
      } else {
        this.register(key, { resolve, reject });
      }
    });
  }

  private flush(keys: string[]): void {
    this.limiter.run(async() => {
      this.resolveAll(await this.resolveBatch(keys));
    }).catch((error: unknown) => {
      this.rejectAll(keys, error);
    });
  }

  private register(key: string, resolver: PromiseCallback<V>): void {
    this.pending.set(key, [resolver]);
    this.executor.add(key);
  }

  private join(key: string, resolver: PromiseCallback<V>): void {
    this.pending.get(key)!.push(resolver);
  }

  private resolveAll(data: Record<string, V>): void {
    for (const [key, value] of Object.entries(data)) {
      this.pending.get(key)?.forEach(r => r.resolve(value));
      this.pending.delete(key);
    }
  }

  private rejectAll(keys: string[], error: unknown): void {
    for (const key of keys) {
      this.pending.get(key)?.forEach(r => r.reject(error));
      this.pending.delete(key);
    }
  }
}
