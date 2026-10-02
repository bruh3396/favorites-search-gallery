import { Scheduler } from "@/core/boundary/ports/scheduler";

interface ScheduledTask {
  task: () => void;
  dueAt: number;
}

export class MemoryScheduler implements Scheduler {
  private time: number;
  private scheduled: ScheduledTask[] = [];

  constructor(startAt = 0) {
    this.time = startAt;
  }

  public now(): number {
    return this.time;
  }

  public schedule(task: () => void, delay: number): () => void {
    const entry = { task, dueAt: this.time + delay };

    this.scheduled.push(entry);
    return (): void => {
      this.scheduled = this.scheduled.filter(scheduled => scheduled !== entry);
    };
  }

  public advance(duration: number): void {
    const end = this.time + duration;

    for (let next = this.nextDue(end); next !== undefined; next = this.nextDue(end)) {
      this.scheduled = this.scheduled.filter(scheduled => scheduled !== next);
      this.time = next.dueAt;
      next.task();
    }
    this.time = end;
  }

  private nextDue(end: number): ScheduledTask | undefined {
    return this.scheduled
      .filter(scheduled => scheduled.dueAt <= end)
      .reduce<ScheduledTask | undefined>((earliest, scheduled) => (earliest === undefined || scheduled.dueAt < earliest.dueAt ? scheduled : earliest), undefined);
  }
}
