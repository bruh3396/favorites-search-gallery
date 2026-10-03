import { RetryPolicy, retry } from "@/core/utils/async/retry";
import { describe, expect, test, vi } from "vitest";
import { MemoryRandom } from "@/adapters/memory/ports/random/random";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { advanceAndSettle } from "@/testing/async";

function createPolicy(scheduler: MemoryScheduler, isRetryable: (error: unknown) => boolean = () => true): RetryPolicy {
  return { attempts: 3, baseDelay: 100, scheduler, random: new MemoryRandom([1]), isRetryable };
}

describe("retry", () => {
  test("resolves with the first success", async() => {
    const scheduler = new MemoryScheduler();
    const task = vi.fn().mockRejectedValueOnce(new Error("flaky")).mockResolvedValueOnce("done");
    const retried = retry(task, createPolicy(scheduler));

    await advanceAndSettle(scheduler, 1_000);
    expect(await retried).toBe("done");
    expect(task).toHaveBeenCalledTimes(2);
  });

  test("rejects with the last failure once attempts run out", async() => {
    const scheduler = new MemoryScheduler();
    const task = vi.fn(() => Promise.reject(new Error("down")));
    const retried = retry(task, createPolicy(scheduler));

    retried.catch(() => { });
    await advanceAndSettle(scheduler, 1_000);
    await expect(retried).rejects.toThrow("down");
    expect(task).toHaveBeenCalledTimes(3);
  });

  test("rejects at once on a failure that isn't retryable", async() => {
    const scheduler = new MemoryScheduler();
    const task = vi.fn(() => Promise.reject(new Error("fatal")));
    const retried = retry(task, createPolicy(scheduler, () => false));

    retried.catch(() => { });
    await advanceAndSettle(scheduler, 1_000);
    await expect(retried).rejects.toThrow("fatal");
    expect(task).toHaveBeenCalledOnce();
  });

  test("waits a random share of a delay that doubles each attempt", async() => {
    const scheduler = new MemoryScheduler();
    const task = vi.fn(() => Promise.reject(new Error("down")));

    retry(task, createPolicy(scheduler)).catch(() => { });
    await advanceAndSettle(scheduler, 100);
    expect(task).toHaveBeenCalledTimes(2);
    await advanceAndSettle(scheduler, 190);
    expect(task).toHaveBeenCalledTimes(2);
    await advanceAndSettle(scheduler, 10);
    expect(task).toHaveBeenCalledTimes(3);
  });
});
