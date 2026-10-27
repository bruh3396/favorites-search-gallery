import { describe, expect, test, vi } from "vitest";
import { CoalescingExecutor } from "@/core/utils/async/coalescing_executor";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";

const EXECUTOR_COALESCING = { flushSize: 3, flushTimeout: 100 };

function setup(): {
  executor: CoalescingExecutor<number>;
  execute: ReturnType<typeof vi.fn>;
  scheduler: MemoryScheduler;
} {
  const scheduler = new MemoryScheduler();
  const execute = vi.fn();
  return { executor: new CoalescingExecutor<number>(EXECUTOR_COALESCING, { execute, scheduler }), execute, scheduler };
}

describe("CoalescingExecutor", () => {
  test("executes everything pending once the timeout passes without a new item", () => {
    const { executor, execute, scheduler } = setup();

    executor.schedule(1);
    scheduler.advance(50);
    executor.schedule(2);
    scheduler.advance(99);
    expect(execute).not.toHaveBeenCalled();
    scheduler.advance(1);
    expect(execute).toHaveBeenCalledExactlyOnceWith([1, 2]);
  });

  test("executes at once when the batch is full", () => {
    const { executor, execute, scheduler } = setup();

    executor.schedule(1);
    executor.schedule(2);
    executor.schedule(3);
    expect(execute).toHaveBeenCalledExactlyOnceWith([1, 2, 3]);
    scheduler.advance(100);
    expect(execute).toHaveBeenCalledOnce();
  });

  test("starts a fresh batch after executing", () => {
    const { executor, execute, scheduler } = setup();

    executor.schedule(1);
    scheduler.advance(100);
    executor.schedule(2);
    scheduler.advance(100);

    expect(execute.mock.calls).toEqual([[[1]], [[2]]]);
  });
});
