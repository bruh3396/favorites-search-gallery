import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

interface ScheduledTask {
  task: () => void;
  readonly dueAt: number;
}

export class MemoryScheduler implements Scheduler {
  private time: number;
  private scheduledTasks: ScheduledTask[] = [];

  constructor(startAt = 0) {
    this.time = startAt;
  }

  public now(): number {
    return this.time;
  }

  public schedule(task: () => void, delay: number): () => void {
    const entry = { task, dueAt: this.time + delay };

    this.scheduledTasks.push(entry);
    return (): void => {
      this.scheduledTasks = this.scheduledTasks.filter(scheduledTask => scheduledTask !== entry);
    };
  }

  public sleep(duration: number): Promise<void> {
    return new Promise(resolve => this.schedule(resolve, duration));
  }

  public waitForPaint(): Promise<void> {
    return Promise.resolve();
  }

  public advance(duration: number): void {
    const end = this.time + duration;

    for (let nextScheduledTask = this.nextDue(end); nextScheduledTask !== undefined; nextScheduledTask = this.nextDue(end)) {
      this.scheduledTasks = this.scheduledTasks.filter(scheduledTask => scheduledTask !== nextScheduledTask);
      this.time = nextScheduledTask.dueAt;
      nextScheduledTask.task();
    }
    this.time = end;
  }

  private nextDue(end: number): ScheduledTask | undefined {
    return this.scheduledTasks
      .filter(scheduledTask => scheduledTask.dueAt <= end)
      .reduce<ScheduledTask | undefined>(
        (earliestScheduledTask, scheduledTask) => (earliestScheduledTask === undefined || scheduledTask.dueAt < earliestScheduledTask.dueAt ? scheduledTask : earliestScheduledTask),
        undefined
      );
  }
}
