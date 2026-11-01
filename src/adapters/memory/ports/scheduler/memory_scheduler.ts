import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

interface ScheduledTask {
  task: () => void;
  readonly dueAt: number;
}

export class MemoryScheduler implements Scheduler {
  private time: number;
  private scheduledTasks: ScheduledTask[] = [];
  private frameRequests: Array<(time: number) => void> = [];

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

  public requestFrame(onFrame: (time: number) => void): () => void {
    this.frameRequests.push(onFrame);
    return (): void => {
      this.frameRequests = this.frameRequests.filter(frameRequest => frameRequest !== onFrame);
    };
  }

  public runFrame(): void {
    const dueFrameRequests = this.frameRequests;

    this.frameRequests = [];
    dueFrameRequests.forEach(frameRequest => frameRequest(this.time));
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
        (earliestScheduledTask, scheduledTask) => {
          return earliestScheduledTask === undefined || scheduledTask.dueAt < earliestScheduledTask.dueAt ? scheduledTask : earliestScheduledTask;
        },
        undefined
      );
  }
}
