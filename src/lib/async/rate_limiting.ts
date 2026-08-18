import { RateLimiterConfig, Timeout } from "@/types/async";
import { sleep } from "@/lib/async/scheduling";

type Waiter = {
  id: string | null;
  resolve: (waited: boolean) => void;
};

export class ConcurrencyLimiter {
  private activeCount = 0;
  private deferred: (() => void)[] = [];

  constructor(private readonly limit: number) { }

  public async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.activeCount >= this.limit) {
      await new Promise<void>(resolve => this.deferred.push(resolve));
    }
    this.activeCount += 1;
    try {
      return await fn();
    } finally {
      this.activeCount -= 1;
      const waiter = this.deferred.shift();

      if (waiter !== undefined) {
        waiter();
      }
    }
  }

  public async runAll<T, R>(items: T[], task: (item: T, index: number) => Promise<R>): Promise<R[]> {
    const results: R[] = new Array(items.length);

    await Promise.all(items.map((item, i) => this.run(async() => {
      results[i] = await task(item, i);
    })));
    return results;
  }
}

export class ThrottleQueue {
  private queue: Waiter[];
  private delay: number;
  private drainPromise: Promise<void> | null;

  constructor(delay: number) {
    this.queue = [];
    this.delay = delay;
    this.drainPromise = null;
  }

  public wait(id: string | null = null): Promise<boolean> {
    if (id !== null && this.queue.some((w) => w.id === id)) {
      throw new Error(`ThrottledQueue: duplicate id "${id}"`);
    }
    return new Promise((resolve) => {
      this.queue.push({ id, resolve });

      if (this.drainPromise === null) {
        this.drainPromise = this.drain().finally(() => {
          this.drainPromise = null;
        });
      }
    });
  }

  public cancel(id: string): void {
    const index = this.queue.findIndex((w) => w.id === id);

    if (index === -1) {
      return;
    }
    const [waiter] = this.queue.splice(index, 1);

    waiter.resolve(false);
  }

  public reset(): void {
    this.queue.forEach((w) => w.resolve(false));
    this.queue = [];
  }

  private async drain(): Promise<void> {
    while (this.queue.length > 0) {
      this.queue.shift()!.resolve(true);
      await sleep(this.delay);
    }
  }
}

export class RateLimiter {
  private readonly limiter: ConcurrencyLimiter;
  private readonly throttle: ThrottleQueue;

  constructor({ concurrency, ratePerSecond }: RateLimiterConfig) {
    this.limiter = new ConcurrencyLimiter(concurrency);
    this.throttle = new ThrottleQueue(Math.round(1000 / ratePerSecond));
  }

  public run<T>(fn: () => Promise<T>): Promise<T> {
    return this.limiter.run(async(): Promise<T> => {
      await this.throttle.wait();
      return fn();
    });
  }
}

export function throttle<V>(fn: (...args: V[]) => void, delay: number): (...args: V[]) => void {
  let isThrottling = false;
  return (...args) => {
    if (!isThrottling) {
      fn(...args);
      isThrottling = true;
      setTimeout(() => {
        isThrottling = false;
      }, delay);
    }
  };
}

export function debounceLeading<V>(this: unknown, fn: (...args: V[]) => void, delay: number): (...args: V[]) => void {
  let timeoutId: Timeout;
  let isFirstCall = true;
  let wasCalledDuringDebounce = false;
  return (...args: V[]): void => {
    if (isFirstCall) {

      Reflect.apply(fn, this, args);
      isFirstCall = false;
    } else {
      wasCalledDuringDebounce = true;
    }

    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      if (wasCalledDuringDebounce) {

        Reflect.apply(fn, this, args);
        wasCalledDuringDebounce = false;
      }
      isFirstCall = true;
    }, delay) as Timeout;
  };
}

export function debounceTrailing<V>(this: unknown, fn: (...args: V[]) => void, delay: number): (...args: V[]) => void {
  let timeoutId: Timeout;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      Reflect.apply(fn, this, args);
    }, delay);
  };
}
