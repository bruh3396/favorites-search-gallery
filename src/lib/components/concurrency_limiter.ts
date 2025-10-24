export class ConcurrencyLimiter {
  private processCount = 0;
  private queue: (() => void)[] = [];

  constructor(private readonly maxProcesses: number) {}

  public async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.processCount >= this.maxProcesses) {
      await new Promise<void>(resolve => this.queue.push(resolve));
    }

    this.processCount += 1;
    try {
      return await fn();
    } finally {
      this.processCount -= 1;

      if (this.queue.length > 0) {
        this.queue.shift()!();
      }
    }
  }

  public async runAll<T, R>(
    items: T[],
    task: (item: T, index: number) => Promise<R>
  ): Promise<R[]> {
    const results: R[] = new Array(items.length);

    await Promise.all(items.map((item, i) => this.run(async() => {
          results[i] = await task(item, i);
        })));
    return results;
  }
}
