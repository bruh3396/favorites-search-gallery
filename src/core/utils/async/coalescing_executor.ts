import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

export interface CoalescingExecutorConfiguration {
  readonly flushSize: number;
  readonly flushTimeout: number;
}

export interface CoalescingExecutorDependencies<T> {
  execute: (coalesced: T[]) => void;
  scheduler: Scheduler;
}
export class CoalescingExecutor<T> {
  private pending: T[] = [];
  private cancelFlush: (() => void) | undefined;

  constructor(
    private readonly configuration: CoalescingExecutorConfiguration,
    private readonly dependencies: CoalescingExecutorDependencies<T>
  ) { }

  public schedule(item: T): void {
    this.pending.push(item);
    this.cancelFlush?.();

    if (this.pending.length >= this.configuration.flushSize) {
      this.flush();
      return;
    }
    this.cancelFlush = this.dependencies.scheduler.schedule(() => this.flush(), this.configuration.flushTimeout);
  }

  private flush(): void {
    const coalesced = this.pending;

    this.pending = [];
    this.cancelFlush = undefined;
    this.dependencies.execute(coalesced);
  }
}
