import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

export interface RateLimiterConfiguration {
  concurrency: number;
  ratePerSecond: number;
}

export class RateLimiter {
  private readonly interval: number;
  private readonly waiting: (() => void)[] = [];
  private active = 0;
  private nextStartAt = 0;

  constructor(private readonly configuration: RateLimiterConfiguration, private readonly scheduler: Scheduler) {
    this.interval = 1_000 / configuration.ratePerSecond;
  }

  public async run<T>(task: () => Promise<T>): Promise<T> {
    await this.acquireSlot();

    try {
      await this.waitForTurn();
      return await task();
    } finally {
      this.releaseSlot();
    }
  }

  private acquireSlot(): Promise<void> {
    if (this.active < this.configuration.concurrency) {
      this.active += 1;
      return Promise.resolve();
    }
    return new Promise(resolve => this.waiting.push(resolve));
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
    return this.scheduler.sleep(startAt - now);
  }
}
