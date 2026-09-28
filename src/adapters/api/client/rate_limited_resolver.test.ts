import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { RateLimitedResolver } from "@/adapters/api/client/rate_limited_resolver";

const RATE_LIMIT = { concurrency: 1, ratePerSecond: 100 };

describe("RateLimitedResolver", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("answers each key scheduled together from one resolve", async() => {
    const resolve = vi.fn((keys: string[]) => Promise.resolve(new Map(keys.map(key => [key, key.toUpperCase()]))));
    const resolver = new RateLimitedResolver(RATE_LIMIT, resolve);
    const answered = Promise.all([resolver.schedule("a"), resolver.schedule("b")]);

    await vi.advanceTimersByTimeAsync(10_000);
    expect(await answered).toEqual(["A", "B"]);
    expect(resolve.mock.calls).toEqual([[["a", "b"]]]);
  });

  test("rejects the whole batch when an answer leaves a key out", async() => {
    const resolver = new RateLimitedResolver(RATE_LIMIT, () => Promise.resolve(new Map([["a", 1]])));
    const answered = Promise.allSettled([resolver.schedule("a"), resolver.schedule("b")]);

    await vi.advanceTimersByTimeAsync(10_000);
    expect((await answered).map(result => result.status)).toEqual(["rejected", "rejected"]);
  });
});
