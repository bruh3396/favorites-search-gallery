import { describe, expect, test } from "vitest";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/memory_random_source";
import { createExponentialBackoff } from "@/core/utils/async/exponential_backoff";

describe("createExponentialBackoff", () => {
  test("doubles the delay each failure up to the maximum", () => {
    const computeDelay = createExponentialBackoff({ baseDelay: 100, maxDelay: 300 }, new MemoryRandomSource([1]));

    expect([1, 2, 3, 4].map(computeDelay)).toEqual([100, 200, 300, 300]);
  });

  test("keeps doubling without a maximum", () => {
    const computeDelay = createExponentialBackoff({ baseDelay: 100 }, new MemoryRandomSource([1]));

    expect([1, 2, 3, 4].map(computeDelay)).toEqual([100, 200, 400, 800]);
  });

  test("waits a random share of the delay", () => {
    const computeDelay = createExponentialBackoff({ baseDelay: 100 }, new MemoryRandomSource([0.5]));

    expect(computeDelay(2)).toBe(100);
  });
});
