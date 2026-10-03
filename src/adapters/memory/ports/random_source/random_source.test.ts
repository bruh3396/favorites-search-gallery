import { describe, expect, test } from "vitest";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/random_source";

describe("MemoryRandomSource", () => {
  test("replays its values in order, then cycles", () => {
    const randomSource = new MemoryRandomSource([0.1, 0.5, 0.9]);

    expect([randomSource.next(), randomSource.next(), randomSource.next(), randomSource.next()]).toEqual([0.1, 0.5, 0.9, 0.1]);
  });

  test("returns 0 by default", () => {
    expect(new MemoryRandomSource().next()).toBe(0);
  });
});
