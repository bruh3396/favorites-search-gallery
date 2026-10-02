import { describe, expect, test, vi } from "vitest";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";

describe("MemoryScheduler", () => {
  test("runs a task only once time reaches its delay", () => {
    const scheduler = new MemoryScheduler();
    const task = vi.fn();

    scheduler.schedule(task, 100);
    scheduler.advance(99);
    expect(task).not.toHaveBeenCalled();
    scheduler.advance(1);
    expect(task).toHaveBeenCalledOnce();
  });

  test("runs due tasks in the order they fall due", () => {
    const scheduler = new MemoryScheduler();
    const order: string[] = [];

    scheduler.schedule(() => order.push("late"), 200);
    scheduler.schedule(() => order.push("early"), 100);
    scheduler.advance(200);

    expect(order).toEqual(["early", "late"]);
  });

  test("runs a task scheduled by another task when it falls due in the same advance", () => {
    const scheduler = new MemoryScheduler();
    const task = vi.fn();

    scheduler.schedule(() => scheduler.schedule(task, 50), 100);
    scheduler.advance(150);

    expect(task).toHaveBeenCalledOnce();
  });

  test("reads the time it was started at", () => {
    expect(new MemoryScheduler(1000).now()).toBe(1000);
  });

  test("moves now forward with each advance", () => {
    const scheduler = new MemoryScheduler(1000);

    scheduler.advance(250);

    expect(scheduler.now()).toBe(1250);
  });

  test("reads the due time inside a task it runs", () => {
    const scheduler = new MemoryScheduler();
    let seen: number | undefined;

    scheduler.schedule(() => {
      seen = scheduler.now();
    }, 100);
    scheduler.advance(300);

    expect(seen).toBe(100);
  });

  test("never runs a cancelled task", () => {
    const scheduler = new MemoryScheduler();
    const task = vi.fn();

    scheduler.schedule(task, 100)();
    scheduler.advance(100);

    expect(task).not.toHaveBeenCalled();
  });
});
