import { describe, expect, test, vi } from "vitest";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";
import { RateLimiter } from "@/core/utils/async/rate_limiter";
import { advanceAndSettle } from "@/testing/microtask_utilities";

describe("RateLimiter", () => {
  test("starts tasks no faster than its rate", async() => {
    const scheduler = new MemoryScheduler();
    const rateLimiter = new RateLimiter({ concurrency: 10, ratePerSecond: 10 }, scheduler);
    const task = vi.fn(() => Promise.resolve());

    [1, 2, 3].forEach(() => rateLimiter.run(task));
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
    const rateLimiter = new RateLimiter({ concurrency: 1, ratePerSecond: 1_000 }, scheduler);
    const first = Promise.withResolvers<void>();
    const second = vi.fn(() => Promise.resolve());

    rateLimiter.run(() => first.promise);
    rateLimiter.run(second);
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

  test("drops a waiting task when its signal aborts", async() => {
    const scheduler = new MemoryScheduler();
    const rateLimiter = new RateLimiter({ concurrency: 1, ratePerSecond: 1_000 }, scheduler);
    const first = Promise.withResolvers<void>();
    const controller = new AbortController();
    const dropped = vi.fn(() => Promise.resolve());
    const next = vi.fn(() => Promise.resolve());

    rateLimiter.run(() => first.promise);
    const waiting = rateLimiter.run(dropped, controller.signal);

    rateLimiter.run(next);
    controller.abort(new Error("left"));
    await expect(waiting).rejects.toThrow("left");
    first.resolve();
    await advanceAndSettle(scheduler, 100);
    expect(dropped).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledOnce();
  });

  test("rejects a task whose signal already aborted without taking a slot", async() => {
    const scheduler = new MemoryScheduler();
    const rateLimiter = new RateLimiter({ concurrency: 1, ratePerSecond: 1_000 }, scheduler);
    const task = vi.fn(() => Promise.resolve());
    const next = vi.fn(() => Promise.resolve());

    await expect(rateLimiter.run(task, AbortSignal.abort(new Error("gone")))).rejects.toThrow("gone");
    rateLimiter.run(next);
    await advanceAndSettle(scheduler, 0);
    expect(task).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledOnce();
  });

  test("skips a task whose signal aborts while it waits for its turn", async() => {
    const scheduler = new MemoryScheduler();
    const rateLimiter = new RateLimiter({ concurrency: 2, ratePerSecond: 1 }, scheduler);
    const controller = new AbortController();
    const task = vi.fn(() => Promise.resolve());

    rateLimiter.run(() => Promise.resolve());
    const waiting = rateLimiter.run(task, controller.signal);

    controller.abort(new Error("left"));
    await advanceAndSettle(scheduler, 1_000);
    await expect(waiting).rejects.toThrow("left");
    expect(task).not.toHaveBeenCalled();
  });

  test("frees the slot when a task fails", async() => {
    const scheduler = new MemoryScheduler();
    const rateLimiter = new RateLimiter({ concurrency: 1, ratePerSecond: 1_000 }, scheduler);
    const next = vi.fn(() => Promise.resolve());

    rateLimiter.run(() => Promise.reject(new Error("down"))).catch(() => { });
    rateLimiter.run(next);
    await advanceAndSettle(scheduler, 100);
    expect(next).toHaveBeenCalledOnce();
  });
});
