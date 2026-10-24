import { Debouncer } from "@/core/utils/async/debouncer";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

export interface BatchDebouncerConfiguration {
  readonly delay: number;
}

export class BatchDebouncer {
  private readonly heldTasks: Set<() => void>;
  private readonly debouncer: Debouncer;

  constructor(configuration: BatchDebouncerConfiguration, scheduler: Pick<Scheduler, "schedule">) {
    this.heldTasks = new Set();
    this.debouncer = new Debouncer({ delay: configuration.delay, leading: false }, scheduler);
  }

  public add(task: () => void): () => void {
    this.heldTasks.add(task);
    this.debouncer.debounce(() => this.runHeldTasks());
    return () => {
      this.heldTasks.delete(task);
    };
  }

  private runHeldTasks(): void {
    const tasks = [...this.heldTasks];

    this.heldTasks.clear();
    tasks.forEach(task => task());
  }
}
