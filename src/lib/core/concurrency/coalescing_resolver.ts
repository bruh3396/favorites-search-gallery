import { CoalescingExecutor } from "./coalescing_executor";

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
    private readonly resolveBatch: (keys: string[]) => Promise<Record<string, V>>
  ) {
    this.executor = new CoalescingExecutor<string>(batchSize, flushDelay, keys => this.flush(keys));
  }

  public resolve(key: string): Promise<V> {
    return new Promise<V>((resolve, reject) => {
      const promises = this.pending.get(key);
      const promise = { resolve, reject };

      if (promises === undefined) {
        this.pending.set(key, [promise]);
        this.executor.add(key);
      } else {
        promises.push(promise);
      }
    });
  }

  private flush(keys: string[]): void {
    this.resolveBatch(keys).then(data => {
      this.resolveAll(data);
    }).catch((error: unknown) => {
      this.rejectAll(keys, error);
    });
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
