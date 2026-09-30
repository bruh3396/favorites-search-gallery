import { Scheduler } from "@/core/boundary/ports/scheduler";

interface ScheduledTask {
  task: () => void;
  dueAt: number;
}

// Time moves only when a test calls advance.
export class MemoryScheduler implements Scheduler {
  private now = 0;
  private scheduled: ScheduledTask[] = [];

  public schedule(task: () => void, delay: number): () => void {
    const entry = { task, dueAt: this.now + delay };

    this.scheduled.push(entry);
    return (): void => {
      this.scheduled = this.scheduled.filter(scheduled => scheduled !== entry);
    };
  }

  public advance(duration: number): void {
    const end = this.now + duration;

    for (let next = this.nextDue(end); next !== undefined; next = this.nextDue(end)) {
      this.scheduled = this.scheduled.filter(scheduled => scheduled !== next);
      this.now = next.dueAt;
      next.task();
    }
    this.now = end;
  }

  private nextDue(end: number): ScheduledTask | undefined {
    return this.scheduled
      .filter(scheduled => scheduled.dueAt <= end)
      .reduce<ScheduledTask | undefined>((earliest, scheduled) => (earliest === undefined || scheduled.dueAt < earliest.dueAt ? scheduled : earliest), undefined);
  }
}
