export class ConcurrencyLimiter {
  public activeCount = 0;
  private queue: (() => void)[] = [];

  constructor(private readonly limit: number) {}

  public async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.activeCount >= this.limit) {
      await new Promise<void>(resolve => this.queue.push(resolve));
    }

    this.activeCount += 1;
    try {
      return await fn();
    } finally {
      this.activeCount -= 1;

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
