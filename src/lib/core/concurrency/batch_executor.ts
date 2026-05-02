import { Timeout } from "../../../types/async";

export class BatchExecutor<V> {
  private readonly maxBatchSize: number;
  private readonly flushDelay: number;
  private readonly onFlush: (batch: V[]) => void;
  private readonly pollingInterval: number;
  private lastAddTime: number = 0;
  private pollerHandle: Timeout = undefined;
  private batch: V[] = [];

  constructor(maxBatchSize: number, flushDelay: number, onFlush: (batch: V[]) => void) {
    this.maxBatchSize = maxBatchSize;
    this.flushDelay = flushDelay;
    this.onFlush = onFlush;
    this.pollingInterval = Math.round(Math.max(10, flushDelay / 5));
  }

  private get isBatchFull(): boolean {
    return this.batch.length >= this.maxBatchSize;
  }

  private get timeSinceLastAdd(): number {
    return performance.now() - this.lastAddTime;
  }

  private get isTimedOut(): boolean {
    return this.timeSinceLastAdd >= this.flushDelay;
  }

  public add(item: V): void {
    this.batch.push(item);
    this.lastAddTime = performance.now();

    if (this.isBatchFull) {
      this.execute();
      return;
    }

    if (this.pollerHandle !== undefined) {
      return;
    }

    this.pollerHandle = setInterval(() => {
      if (this.isTimedOut) {
        this.execute();
      }
    }, this.pollingInterval);
  }

  public reset(): void {
    clearInterval(this.pollerHandle);
    this.pollerHandle = undefined;
    this.batch = [];
  }

  private execute(): void {
    this.onFlush(this.batch);
    this.reset();
  }
}
