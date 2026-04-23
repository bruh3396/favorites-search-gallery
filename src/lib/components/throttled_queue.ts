import { sleep } from "../../utils/misc/async";

type Waiter = {
  id: string | null;
  resolve: (waited: boolean) => void;
};

export class ThrottledQueue {
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

      if (this.queue.length > 0) {
        this.queue.shift()!.resolve(true);
      }
      await sleep(this.delay);
    }
  }
}
