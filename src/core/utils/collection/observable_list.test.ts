import { describe, expect, test, vi } from "vitest";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/random_source";
import { ObservableList } from "@/core/utils/collection/observable_list";

const createItem = (id: string): { id: string } => ({ id });
const createItems = (...ids: string[]): { id: string }[] => ids.map(createItem);
const getIds = (results: { id: string }[]): string[] => results.map(r => r.id);

describe("ObservableList", () => {
  test("starts empty", () => {
    expect(new ObservableList<{ id: string }>().get()).toEqual([]);
  });

  describe("set", () => {
    test("stores and returns the given results", () => {
      const results = new ObservableList<{ id: string }>();
      const next = createItems("1", "2");

      expect(results.set(next)).toBe(next);
      expect(results.get()).toBe(next);
    });

    test("notifies the onChanged listener with the new results", () => {
      const onChanged = vi.fn();
      const results = new ObservableList<{ id: string }>(onChanged);
      const next = createItems("1");

      results.set(next);
      expect(onChanged).toHaveBeenCalledWith(next);
    });

    test("does not throw before a listener is registered", () => {
      const results = new ObservableList<{ id: string }>();

      expect(() => results.set(createItems("1"))).not.toThrow();
    });
  });

  describe("shuffle", () => {
    test("keeps the same set of results", () => {
      const results = new ObservableList<{ id: string }>();

      results.set(createItems("1", "2", "3"));
      expect(getIds(results.shuffle(new MemoryRandomSource())).sort()).toEqual(["1", "2", "3"]);
    });

    test("notifies the onChanged listener", () => {
      const onChanged = vi.fn();
      const results = new ObservableList<{ id: string }>(onChanged);

      results.set(createItems("1"));
      onChanged.mockClear();
      results.shuffle(new MemoryRandomSource());
      expect(onChanged).toHaveBeenCalledOnce();
    });
  });

  describe("append", () => {
    test("adds items to the end and returns them", () => {
      const results = new ObservableList<{ id: string }>();
      const added = createItems("3", "4");

      results.set(createItems("1", "2"));
      expect(results.append(added)).toBe(added);
      expect(getIds(results.get())).toEqual(["1", "2", "3", "4"]);
    });

    test("notifies the onChanged listener with the combined results", () => {
      const onChanged = vi.fn();
      const results = new ObservableList<{ id: string }>(onChanged);

      results.set(createItems("1"));
      results.append(createItems("2"));
      expect(getIds(onChanged.mock.lastCall?.[0])).toEqual(["1", "2"]);
    });
  });

  describe("prepend", () => {
    test("adds items to the front and returns them", () => {
      const results = new ObservableList<{ id: string }>();
      const added = createItems("1", "2");

      results.set(createItems("3", "4"));
      expect(results.prepend(added)).toBe(added);
      expect(getIds(results.get())).toEqual(["1", "2", "3", "4"]);
    });

    test("notifies the onChanged listener with the combined results", () => {
      const onChanged = vi.fn();
      const results = new ObservableList<{ id: string }>(onChanged);

      results.set(createItems("2"));
      results.prepend(createItems("1"));
      expect(getIds(onChanged.mock.lastCall?.[0])).toEqual(["1", "2"]);
    });
  });
});
