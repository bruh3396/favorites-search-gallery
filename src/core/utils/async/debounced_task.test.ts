import { describe, expect, test, vi } from "vitest";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { createDebouncedTask } from "@/core/utils/async/debounced_task";

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
