import { Scheduler } from "@/core/boundary/ports/scheduler";

export class BrowserScheduler implements Scheduler {
  public schedule(task: () => void, delay: number): () => void {
    const handle = setTimeout(task, delay);
    return (): void => clearTimeout(handle);
  }
}
