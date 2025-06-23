import { Timeout } from "../../types/primitives/primitives";

export class BatchExecutor<V> {
  private readonly limit: number;
  private readonly timeout: number;
  private readonly executor: (batch: V[]) => void;
  private readonly pollingInterval: number;
  private lastAddTime: number = 0;
  private poller: Timeout = undefined;
  private batch: V[] = [];

  constructor(limit: number, timeout: number, executor: (batch: V[]) => void) {
    this.limit = limit;
    this.timeout = timeout;
    this.executor = executor;
    this.pollingInterval = this.getPollingInterval();
  }

  private get overLimit(): boolean {
    return this.batch.length >= this.limit;
  }

  private get timeSinceLastAdd(): number {
    return performance.now() - this.lastAddTime;
  }

  private get overTimeout(): boolean {
    return this.timeSinceLastAdd >= this.timeout;
  }

  public add(item: V): void {
    this.batch.push(item);
    this.lastAddTime = performance.now();

    if (this.overLimit) {
      this.execute();
      return;
    }

    if (this.poller !== undefined) {
      return;
    }

    this.poller = setInterval(() => {
      if (this.overTimeout) {
        this.execute();
      }
    }, this.pollingInterval);

  }

  public reset(): void {
    clearInterval(this.poller);
    this.poller = undefined;
    this.batch = [];
  }

  private execute(): void {
    this.executor(this.batch);
    this.reset();
  }

  private getPollingInterval(): number {
    return Math.round(Math.max(10, this.timeout / 5));
  }
}
