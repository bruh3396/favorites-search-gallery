import { describe, expect, test } from "vitest";
import { BoundedCache } from "@/lib/collection/bounded_cache";

describe("BoundedCache", () => {
  test("stores and retrieves values", () => {
    const cache = new BoundedCache<string, number>(3);

    cache.set("a", 1);
    expect(cache.get("a")).toBe(1);
    expect(cache.has("a")).toBe(true);
  });

  test("reports a miss without a sentinel", () => {
    const cache = new BoundedCache<string, number>(3);

    expect(cache.has("a")).toBe(false);
    expect(cache.get("a")).toBeUndefined();
  });

  test("distinguishes a stored undefined from a miss", () => {
    const cache = new BoundedCache<string, number | undefined>(3);

    cache.set("a", undefined);
    expect(cache.has("a")).toBe(true);
    expect(cache.get("a")).toBeUndefined();
  });

  test("re-setting a key updates its value without growing", () => {
    const cache = new BoundedCache<string, number>(3);

    cache.set("a", 1);
    cache.set("a", 2);
    expect(cache.get("a")).toBe(2);
    expect(cache.size).toBe(1);
  });

  test("evicts the least-recently-used entry when over capacity", () => {
    const cache = new BoundedCache<string, number>(2);

    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);
    expect(cache.has("a")).toBe(false);
    expect(cache.has("b")).toBe(true);
    expect(cache.has("c")).toBe(true);
    expect(cache.size).toBe(2);
  });

  test("reading a key promotes it, sparing it from eviction", () => {
    const cache = new BoundedCache<string, number>(2);

    cache.set("a", 1);
    cache.set("b", 2);
    cache.get("a");
    cache.set("c", 3);
    expect(cache.has("a")).toBe(true);
    expect(cache.has("b")).toBe(false);
  });

  test("re-setting a key promotes it, sparing it from eviction", () => {
    const cache = new BoundedCache<string, number>(2);

    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("a", 10);
    cache.set("c", 3);
    expect(cache.has("a")).toBe(true);
    expect(cache.has("b")).toBe(false);
  });

  test("clear empties the cache", () => {
    const cache = new BoundedCache<string, number>(3);

    cache.set("a", 1);
    cache.set("b", 2);
    cache.clear();
    expect(cache.size).toBe(0);
    expect(cache.has("a")).toBe(false);
  });
});
