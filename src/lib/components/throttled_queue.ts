import { sleep } from "../../utils/misc/async";

export class ThrottledQueue {
  private queue: (() => void)[];
  private delay: number;
  private draining: boolean;
  private paused: boolean;
  private unblocked: boolean;

  constructor(delay: number, unblocked: boolean = false) {
    this.queue = [];
    this.delay = delay;
    this.draining = false;
    this.paused = false;
    this.unblocked = unblocked;
  }

  public wait(): Promise<void> {
    if (this.unblocked) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.queue.push(resolve);
      this.startDraining();
    });
  }

  public setDelay(newDelay: number): void {
    this.delay = newDelay;
  }

  public pause(): void {
    this.paused = true;
  }

  public resume(): void {
    this.paused = false;
    this.startDraining();
  }

  public reset(): void {
    this.queue = [];
    this.draining = false;
    this.paused = false;
  }

  private async startDraining(): Promise<void> {
    if (this.draining) {
      return;
    }
    this.draining = true;
    await this.drain();
    this.draining = false;
  }

  private async drain(): Promise<void> {
    while (this.queue.length > 0) {
      const resolve = this.queue.shift();

      if (resolve === undefined) {
        continue;
      }

      resolve();
      await sleep(this.delay);

      if (this.paused) {
        break;
      }
    }
  }
}
