import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

export class BrowserScheduler implements Scheduler {
  public now(): number {
    return Date.now();
  }

  public schedule(task: () => void, delay: number): () => void {
    const handle = setTimeout(task, delay);
    return (): void => clearTimeout(handle);
  }

  public sleep(duration: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, duration));
  }

  public waitForPaint(): Promise<void> {
    return new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve)));
  }

  public requestFrame(onFrame: (time: number) => void): () => void {
    const handle = requestAnimationFrame(onFrame);
    return (): void => cancelAnimationFrame(handle);
  }
}
