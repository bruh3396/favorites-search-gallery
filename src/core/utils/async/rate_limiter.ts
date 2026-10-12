import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

export interface RateLimiterConfiguration {
  readonly concurrency: number;
  readonly ratePerSecond: number;
}

export class RateLimiter {
  private readonly interval: number;
  private readonly waiting: (() => void)[] = [];
  private active = 0;
  private nextStartAt = 0;

  constructor(private readonly configuration: RateLimiterConfiguration, private readonly scheduler: Scheduler) {
    this.interval = 1_000 / configuration.ratePerSecond;
  }

  public async run<T>(task: () => Promise<T>, signal?: AbortSignal): Promise<T> {
    await this.acquireSlot(signal);

    try {
      await this.waitForTurn();
      signal?.throwIfAborted();
      return await task();
    } finally {
      this.releaseSlot();
    }
  }

  private acquireSlot(signal?: AbortSignal): Promise<void> {
    if (signal?.aborted === true) {
      return Promise.reject(signal.reason);
    }

    if (this.active < this.configuration.concurrency) {
      this.active += 1;
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const grant = (): void => {
        signal?.removeEventListener("abort", leave);
        resolve();
      };
      const leave = (): void => {
        this.waiting.splice(this.waiting.indexOf(grant), 1);
        reject(signal?.reason);
      };

      this.waiting.push(grant);
      signal?.addEventListener("abort", leave, { once: true });
    });
  }

  private releaseSlot(): void {
    const next = this.waiting.shift();

    if (next === undefined) {
      this.active -= 1;
      return;
    }
    next();
  }

  private waitForTurn(): Promise<void> {
    const now = this.scheduler.now();
    const startAt = Math.max(now, this.nextStartAt);

    this.nextStartAt = startAt + this.interval;
    return startAt === now ? Promise.resolve() : this.scheduler.sleep(startAt - now);
  }
}
