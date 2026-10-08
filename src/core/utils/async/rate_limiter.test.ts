import { describe, expect, test, vi } from "vitest";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { RateLimiter } from "@/core/utils/async/rate_limiter";
import { advanceAndSettle } from "@/testing/async";

describe("RateLimiter", () => {
  test("starts tasks no faster than its rate", async() => {
    const scheduler = new MemoryScheduler();
    const limiter = new RateLimiter({ concurrency: 10, ratePerSecond: 10 }, scheduler);
    const task = vi.fn(() => Promise.resolve());

    [1, 2, 3].forEach(() => limiter.run(task));
    await advanceAndSettle(scheduler, 0);
    expect(task).toHaveBeenCalledOnce();
    await advanceAndSettle(scheduler, 100);
    expect(task).toHaveBeenCalledTimes(2);
    await advanceAndSettle(scheduler, 100);
    expect(task).toHaveBeenCalledTimes(3);
  });

  test("starts a task without waiting when its turn has come", async() => {
    const task = vi.fn(() => Promise.resolve());

    await new RateLimiter({ concurrency: 1, ratePerSecond: 1 }, new MemoryScheduler()).run(task);
    expect(task).toHaveBeenCalledOnce();
  });

  test("runs no more tasks at once than its concurrency", async() => {
    const scheduler = new MemoryScheduler();
    const limiter = new RateLimiter({ concurrency: 1, ratePerSecond: 1_000 }, scheduler);
    const first = Promise.withResolvers<void>();
    const second = vi.fn(() => Promise.resolve());

    limiter.run(() => first.promise);
    limiter.run(second);
    await advanceAndSettle(scheduler, 100);
    expect(second).not.toHaveBeenCalled();
    first.resolve();
    await advanceAndSettle(scheduler, 100);
    expect(second).toHaveBeenCalledOnce();
  });

  test("resolves with the task's result", async() => {
    const scheduler = new MemoryScheduler();
    const ran = new RateLimiter({ concurrency: 1, ratePerSecond: 1 }, scheduler).run(() => Promise.resolve("done"));

    await advanceAndSettle(scheduler, 0);
    expect(await ran).toBe("done");
  });

  test("frees the slot when a task fails", async() => {
    const scheduler = new MemoryScheduler();
    const limiter = new RateLimiter({ concurrency: 1, ratePerSecond: 1_000 }, scheduler);
    const next = vi.fn(() => Promise.resolve());

    limiter.run(() => Promise.reject(new Error("down"))).catch(() => { });
    limiter.run(next);
    await advanceAndSettle(scheduler, 100);
    expect(next).toHaveBeenCalledOnce();
  });
});
