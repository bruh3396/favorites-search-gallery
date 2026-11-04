import { describe, expect, test, vi } from "vitest";
import { BatchDebouncer } from "@/core/utils/async/batch_debouncer";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";

const DELAY = 500;
const BURST_DELAY = 50;

function setup(): { batchDebouncer: BatchDebouncer; scheduler: MemoryScheduler } {
  const scheduler = new MemoryScheduler();
  return { batchDebouncer: new BatchDebouncer({ delay: DELAY, burstDelay: BURST_DELAY }, scheduler), scheduler };
}

describe("BatchDebouncer", () => {
  describe("add", () => {
    test("runs a burst together, without waiting for the delay", () => {
      const { batchDebouncer, scheduler } = setup();
      const first = vi.fn();
      const second = vi.fn();

      batchDebouncer.add(first);
      scheduler.advance(BURST_DELAY - 1);
      batchDebouncer.add(second);
      expect([first.mock.calls.length, second.mock.calls.length]).toEqual([0, 0]);
      scheduler.advance(1);
      expect([first.mock.calls.length, second.mock.calls.length]).toEqual([1, 1]);
    });

    test("holds tasks added after a burst until none is added for the delay", () => {
      const { batchDebouncer, scheduler } = setup();
      const first = vi.fn();
      const second = vi.fn();

      batchDebouncer.add(vi.fn());
      scheduler.advance(DELAY - 1);
      batchDebouncer.add(first);
      scheduler.advance(DELAY - 1);
      batchDebouncer.add(second);
      scheduler.advance(DELAY - 1);
      expect([first.mock.calls.length, second.mock.calls.length]).toEqual([0, 0]);
      scheduler.advance(1);
      expect([first.mock.calls.length, second.mock.calls.length]).toEqual([1, 1]);
    });

    test("runs a burst without waiting again once the delay has passed", () => {
      const { batchDebouncer, scheduler } = setup();
      const task = vi.fn();

      batchDebouncer.add(vi.fn());
      scheduler.advance(DELAY);
      batchDebouncer.add(task);
      scheduler.advance(BURST_DELAY);
      expect(task).toHaveBeenCalledOnce();
    });

    test("runs a held task only once", () => {
      const { batchDebouncer, scheduler } = setup();
      const task = vi.fn();

      batchDebouncer.add(task);
      scheduler.advance(DELAY);
      expect(task).toHaveBeenCalledOnce();
    });

    test("drops a task removed before it runs", () => {
      const { batchDebouncer, scheduler } = setup();
      const task = vi.fn();

      batchDebouncer.add(task)();
      scheduler.advance(DELAY);
      expect(task).not.toHaveBeenCalled();
    });

    test("drops a held task removed before the delay ends", () => {
      const { batchDebouncer, scheduler } = setup();
      const task = vi.fn();

      batchDebouncer.add(vi.fn());
      scheduler.advance(BURST_DELAY);
      batchDebouncer.add(task)();
      scheduler.advance(DELAY);
      expect(task).not.toHaveBeenCalled();
    });
  });
});
