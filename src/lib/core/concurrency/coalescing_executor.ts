import { Timeout } from "../../../types/async";

export class CoalescingExecutor<V> {
  private readonly checkInterval: number;
  private lastAddTime: number = 0;
  private intervalHandle: Timeout;
  private batch: V[] = [];

  constructor(private readonly batchSize: number, private readonly flushDelay: number, private readonly onFlush: (batch: V[]) => void) {
    this.checkInterval = Math.round(Math.max(10, flushDelay / 5));
  }

  public add(item: V): void {
    this.batch.push(item);
    this.lastAddTime = performance.now();

    if (this.batch.length >= this.batchSize) {
      this.flush();
      return;
    }

    if (this.intervalHandle !== undefined) {
      return;
    }

    this.intervalHandle = setInterval(() => {
      if (performance.now() - this.lastAddTime >= this.flushDelay) {
        this.flush();
      }
    }, this.checkInterval);
  }

  private flush(): void {
    try {
      this.onFlush(this.batch);
    } finally {
      clearInterval(this.intervalHandle);
      this.intervalHandle = undefined;
      this.batch = [];
    }
  }
}
