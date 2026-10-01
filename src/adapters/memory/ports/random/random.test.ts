import { describe, expect, test } from "vitest";
import { MemoryRandom } from "@/adapters/memory/ports/random/random";

describe("MemoryRandom", () => {
  test("replays its values in order, then cycles", () => {
    const random = new MemoryRandom([0.1, 0.5, 0.9]);

    expect([random.next(), random.next(), random.next(), random.next()]).toEqual([0.1, 0.5, 0.9, 0.1]);
  });

  test("returns 0 by default", () => {
    expect(new MemoryRandom().next()).toBe(0);
  });
});
