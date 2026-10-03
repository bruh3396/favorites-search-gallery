import { Scheduler } from "@/core/boundary/ports/scheduler";

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
}
