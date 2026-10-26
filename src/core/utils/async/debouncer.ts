import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

export interface DebouncerConfiguration {
  readonly delay: number;
  readonly leading: boolean;
}

export class Debouncer {
  private cancelTimer: (() => void) | undefined;
  private pendingTask: (() => void) | undefined;

  constructor(private readonly configuration: DebouncerConfiguration, private readonly scheduler: Pick<Scheduler, "schedule">) { }

  public debounce(task: () => void): void {
    const isFirstCall = this.cancelTimer === undefined;

    this.cancelTimer?.();
    this.cancelTimer = this.scheduler.schedule(() => this.runPendingTask(), this.configuration.delay);

    if (isFirstCall && this.configuration.leading) {
      task();
      return;
    }

    this.pendingTask = task;
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
