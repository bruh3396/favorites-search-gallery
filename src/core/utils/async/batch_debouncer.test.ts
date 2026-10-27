import { describe, expect, test, vi } from "vitest";
import { BatchDebouncer } from "@/core/utils/async/batch_debouncer";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";

const DELAY = 500;

function setup(): { batchDebouncer: BatchDebouncer; scheduler: MemoryScheduler } {
  const scheduler = new MemoryScheduler();
  return { batchDebouncer: new BatchDebouncer({ delay: DELAY }, scheduler), scheduler };
}

describe("BatchDebouncer", () => {
  describe("add", () => {
    test("runs all held tasks together once none is added for the delay", () => {
      const { batchDebouncer, scheduler } = setup();
      const first = vi.fn();
      const second = vi.fn();

      batchDebouncer.add(first);
      scheduler.advance(DELAY - 1);
      batchDebouncer.add(second);
      scheduler.advance(DELAY - 1);
      expect([first.mock.calls.length, second.mock.calls.length]).toEqual([0, 0]);
      scheduler.advance(1);
      expect([first.mock.calls.length, second.mock.calls.length]).toEqual([1, 1]);
    });

    test("drops a task removed before the delay ends", () => {
      const { batchDebouncer, scheduler } = setup();
      const task = vi.fn();

      batchDebouncer.add(task)();
      scheduler.advance(DELAY);
      expect(task).not.toHaveBeenCalled();
    });
  });
});
