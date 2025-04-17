export class BatchExecutor<V> {
  private limit: number;
  private timeout: number;
  private readonly executor: (batch: V[]) => void;
  private timer: number | undefined;
  private batch: V[];

  get overLimit(): boolean {
    return this.batch.length >= this.limit;
  }

  constructor(limit: number, timeout: number, executor: (batch: V[]) => void) {
    this.limit = limit;
    this.timeout = timeout;
    this.executor = executor;
    this.timer = undefined;
    this.batch = [];
  }

  public add(item: V): void {
    this.batch.push(item);
    this.tryExecuting();
  }

  public reset(): void {
    clearTimeout(this.timer);
    this.empty();
  }

  private tryExecuting(): void {
    clearTimeout(this.timer);

    if (this.overLimit) {
      this.execute();
      return;
    }
    this.executeAfterTimeout();
  }

  private executeAfterTimeout(): void {
    this.timer = setTimeout(() => {
      this.execute();
    }, this.timeout);
  }

  private execute(): void {
    this.executor(this.batch);
    this.empty();
  }

  private empty(): void {
    this.batch = [];
  }
}
