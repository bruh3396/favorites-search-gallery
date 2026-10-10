import { Debouncer, createDebouncedTask } from "@/core/utils/async/debouncer";
import { describe, expect, test, vi } from "vitest";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";

function setup(): { debouncer: Debouncer; scheduler: MemoryScheduler } {
  const scheduler = new MemoryScheduler();
  return { debouncer: new Debouncer({ delay: 200, leading: true }, scheduler), scheduler };
}

describe("createDebouncedTask", () => {
  test("waits until the delay ends when leading is false", () => {
    const scheduler = new MemoryScheduler();
    const task = vi.fn<(query: string) => void>();
    const debounced = createDebouncedTask({ delay: 200, leading: false }, scheduler, task);

    debounced("first");
    scheduler.advance(199);
    expect(task).not.toHaveBeenCalled();
    scheduler.advance(1);
    expect(task.mock.calls).toEqual([["first"]]);
  });

  test("forwards only the latest arguments after a trailing-only burst", () => {
    const scheduler = new MemoryScheduler();
    const task = vi.fn<(query: string) => void>();
    const debounced = createDebouncedTask({ delay: 200, leading: false }, scheduler, task);

    debounced("first");
    scheduler.advance(100);
    debounced("second");
    scheduler.advance(199);
    expect(task).not.toHaveBeenCalled();
    scheduler.advance(1);
    expect(task.mock.calls).toEqual([["second"]]);
  });

  test("forwards the arguments of the first call immediately", () => {
    const scheduler = new MemoryScheduler();
    const task = vi.fn<(query: string, page: number) => void>();
    const debounced = createDebouncedTask({ delay: 200, leading: true }, scheduler, task);

    debounced("first", 1);
    expect(task.mock.calls).toEqual([["first", 1]]);
    scheduler.advance(200);
    expect(task).toHaveBeenCalledOnce();
  });

  test("forwards only the latest arguments once a burst stops", () => {
    const scheduler = new MemoryScheduler();
    const task = vi.fn<(query: string, page: number) => void>();
    const debounced = createDebouncedTask({ delay: 200, leading: true }, scheduler, task);

    debounced("first", 1);
    scheduler.advance(100);
    debounced("second", 2);
    scheduler.advance(100);
    debounced("third", 3);
    scheduler.advance(199);
    expect(task.mock.calls).toEqual([["first", 1]]);
    scheduler.advance(1);
    expect(task.mock.calls).toEqual([["first", 1], ["third", 3]]);
  });

  test("accepts a task without arguments", () => {
    const scheduler = new MemoryScheduler();
    const task = vi.fn<() => void>();
    const debounced = createDebouncedTask({ delay: 200, leading: true }, scheduler, task);

    debounced();
    debounced();
    scheduler.advance(200);
    expect(task).toHaveBeenCalledTimes(2);
  });

  test("keeps separately created functions independent", () => {
    const scheduler = new MemoryScheduler();
    const task = vi.fn<(query: string) => void>();
    const first = createDebouncedTask({ delay: 200, leading: true }, scheduler, task);
    const second = createDebouncedTask({ delay: 200, leading: true }, scheduler, task);

    first("first");
    first("pending first");
    second("second");
    second("pending second");
    first.cancel();
    scheduler.advance(200);
    expect(task.mock.calls).toEqual([["first"], ["second"], ["pending second"]]);
  });

  describe("cancel", () => {
    test("drops a trailing-only call before it runs", () => {
      const scheduler = new MemoryScheduler();
      const task = vi.fn<(query: string) => void>();
      const debounced = createDebouncedTask({ delay: 200, leading: false }, scheduler, task);

      debounced("first");
      debounced.cancel();
      scheduler.advance(200);
      expect(task).not.toHaveBeenCalled();
      debounced("next");
      expect(task).not.toHaveBeenCalled();
      scheduler.advance(200);
      expect(task.mock.calls).toEqual([["next"]]);
    });

    test("drops the pending call and allows an immediate next call", () => {
      const scheduler = new MemoryScheduler();
      const task = vi.fn<(query: string) => void>();
      const debounced = createDebouncedTask({ delay: 200, leading: true }, scheduler, task);

      debounced("first");
      debounced("pending");
      debounced.cancel();
      scheduler.advance(200);
      expect(task.mock.calls).toEqual([["first"]]);
      debounced("next");
      expect(task.mock.calls).toEqual([["first"], ["next"]]);
    });
  });
});

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
