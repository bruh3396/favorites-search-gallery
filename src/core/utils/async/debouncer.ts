import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

export interface DebouncerConfiguration {
  delay: number;
}

export class Debouncer {
  private cancelTimer: (() => void) | undefined;
  private pendingTask: (() => void) | undefined;

  constructor(private readonly configuration: DebouncerConfiguration, private readonly scheduler: Pick<Scheduler, "schedule">) { }

  public debounce(task: () => void): void {
    const wasPending = this.cancelTimer !== undefined;

    this.cancelTimer?.();
    this.cancelTimer = this.scheduler.schedule(() => this.runPendingTask(), this.configuration.delay);

    if (wasPending) {
      this.pendingTask = task;
    } else {
      task();
    }
  }

  public cancel(): void {
    this.cancelTimer?.();
    this.cancelTimer = undefined;
    this.pendingTask = undefined;
  }

  private runPendingTask(): void {
    const task = this.pendingTask;

    this.cancelTimer = undefined;
    this.pendingTask = undefined;
    task?.();
  }
}
