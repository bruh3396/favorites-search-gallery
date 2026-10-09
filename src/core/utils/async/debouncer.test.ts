import { describe, expect, test, vi } from "vitest";
import { Debouncer } from "@/core/utils/async/debouncer";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";

function setup(): { debouncer: Debouncer; scheduler: MemoryScheduler } {
  const scheduler = new MemoryScheduler();
  return { debouncer: new Debouncer({ delay: 200 }, scheduler), scheduler };
}

describe("Debouncer", () => {
  describe("debounce", () => {
    test("runs a task at once after a quiet spell", () => {
      const { debouncer } = setup();
      const task = vi.fn();

      debouncer.debounce(task);
      expect(task).toHaveBeenCalledOnce();
    });

    test("runs a lone task only once", () => {
      const { debouncer, scheduler } = setup();
      const task = vi.fn();

      debouncer.debounce(task);
      scheduler.advance(200);
      expect(task).toHaveBeenCalledOnce();
    });

    test("runs only the last of a burst, once the burst stops", () => {
      const { debouncer, scheduler } = setup();
      const tasks = [vi.fn(), vi.fn(), vi.fn()];

      tasks.forEach(task => {
        debouncer.debounce(task);
        scheduler.advance(100);
      });
      expect(tasks.map(task => task.mock.calls.length)).toEqual([1, 0, 0]);
      scheduler.advance(100);
      expect(tasks.map(task => task.mock.calls.length)).toEqual([1, 0, 1]);
    });

    test("runs a task at once again after the burst settles", () => {
      const { debouncer, scheduler } = setup();
      const task = vi.fn();

      debouncer.debounce(vi.fn());
      debouncer.debounce(vi.fn());
      scheduler.advance(200);
      debouncer.debounce(task);
      expect(task).toHaveBeenCalledOnce();
    });
  });

  describe("cancel", () => {
    test("drops the pending task", () => {
      const { debouncer, scheduler } = setup();
      const task = vi.fn();

      debouncer.debounce(vi.fn());
      debouncer.debounce(task);
      debouncer.cancel();
      scheduler.advance(200);
      expect(task).not.toHaveBeenCalled();
    });
  });
});
