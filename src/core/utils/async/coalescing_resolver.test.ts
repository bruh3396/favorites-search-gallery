import { describe, expect, test, vi } from "vitest";
import { CoalescingResolver } from "@/core/utils/async/coalescing_resolver";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/memory_scheduler";

const RESOLVER_COALESCING = { flushSize: 10, flushTimeout: 100 };

describe("CoalescingResolver", () => {
  test("resolves every caller of a key from one coalesced call", async() => {
    const scheduler = new MemoryScheduler();
    const resolve = vi.fn((keys: string[]) => Promise.resolve(new Map(keys.map(key => [key, key.toUpperCase()]))));
    const resolver = new CoalescingResolver<string, string>(RESOLVER_COALESCING, { resolve, scheduler });

    const results = Promise.all([resolver.schedule("a"), resolver.schedule("a"), resolver.schedule("b")]);

    scheduler.advance(100);

    expect(await results).toEqual(["A", "A", "B"]);
    expect(resolve).toHaveBeenCalledExactlyOnceWith(["a", "b"]);
  });

  test("rejects every caller in the batch when resolving fails", async() => {
    const scheduler = new MemoryScheduler();
    const resolver = new CoalescingResolver<string, string>(RESOLVER_COALESCING, {
      resolve: (): Promise<Map<string, string>> => Promise.reject(new Error("down")),
      scheduler
    });

    const result = resolver.schedule("a");

    scheduler.advance(100);

    await expect(result).rejects.toThrow("down");
  });

  test("rejects only the callers of keys the coalesced call left unresolved", async() => {
    const scheduler = new MemoryScheduler();
    const resolver = new CoalescingResolver<string, string>(RESOLVER_COALESCING, {
      resolve: (): Promise<Map<string, string>> => Promise.resolve(new Map([["a", "A"]])),
      scheduler
    });

    const resolved = resolver.schedule("a");
    const unresolved = resolver.schedule("b");

    scheduler.advance(100);

    expect(await resolved).toBe("A");
    await expect(unresolved).rejects.toThrow();
  });
});
