import { CoalescingExecutor, CoalescingResolver } from "@/core/utils/async/coalescing";
import { describe, expect, test, vi } from "vitest";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";

function setup(maxSize = 3, flushTimeout = 100): { executor: CoalescingExecutor<number>; execute: ReturnType<typeof vi.fn>; scheduler: MemoryScheduler } {
  const scheduler = new MemoryScheduler();
  const execute = vi.fn();
  return { executor: new CoalescingExecutor<number>(maxSize, flushTimeout, execute, scheduler), execute, scheduler };
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

describe("CoalescingResolver", () => {
  test("resolves every caller of a key from one coalesced call", async() => {
    const scheduler = new MemoryScheduler();
    const resolve = vi.fn((keys: string[]) => Promise.resolve(new Map(keys.map(key => [key, key.toUpperCase()]))));
    const resolver = new CoalescingResolver<string, string>(10, 100, resolve, scheduler);

    const results = Promise.all([resolver.schedule("a"), resolver.schedule("a"), resolver.schedule("b")]);

    scheduler.advance(100);

    expect(await results).toEqual(["A", "A", "B"]);
    expect(resolve).toHaveBeenCalledExactlyOnceWith(["a", "b"]);
  });

  test("rejects every caller in the batch when resolving fails", async() => {
    const scheduler = new MemoryScheduler();
    const resolver = new CoalescingResolver<string, string>(10, 100, () => Promise.reject(new Error("down")), scheduler);

    const result = resolver.schedule("a");

    scheduler.advance(100);

    await expect(result).rejects.toThrow("down");
  });
});
