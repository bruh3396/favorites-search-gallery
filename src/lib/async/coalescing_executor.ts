import { Timeout } from "@/types/async";

export class CoalescingExecutor<V> {
  private readonly pollInterval: number;
  private pollHandle: Timeout;
  private lastScheduleTime: number = 0;
  private pending: V[] = [];

  constructor(
    private readonly maxSize: number,
    private readonly flushTimeout: number,
    private readonly execute: (batch: V[]) => void
  ) {
    this.pollInterval = Math.round(Math.max(10, flushTimeout / 5));
  }

  public schedule(item: V): void {
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
