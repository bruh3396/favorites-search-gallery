import { beforeEach, describe, expect, test, vi } from "vitest";
import { Identifiable } from "@/types/app";
import { ObservableList } from "@/lib/collection/observable_list";

const createItem = (id: string): Identifiable => ({ id });
const createItems = (...ids: string[]): Identifiable[] => ids.map(createItem);
const idsOf = (results: Identifiable[]): string[] => results.map(r => r.id);

describe("ObservableList", () => {
  let results: ObservableList<Identifiable>;

  beforeEach(() => {
    results = new ObservableList<Identifiable>();
  });

  test("starts empty", () => {
    expect(results.get()).toEqual([]);
  });

  describe("set", () => {
    test("stores and returns the given results", () => {
      const next = createItems("1", "2");

      expect(results.set(next)).toBe(next);
      expect(results.get()).toBe(next);
    });

    test("notifies the onChanged listener with the new results", () => {
      const onChanged = vi.fn();

      results = new ObservableList<Identifiable>(onChanged);
      const next = createItems("1");

      results.set(next);
      expect(onChanged).toHaveBeenCalledWith(next);
    });

    test("does not throw before a listener is registered", () => {
      expect(() => results.set(createItems("1"))).not.toThrow();
    });
  });

  describe("shuffle", () => {
    test("keeps the same set of results", () => {
      results.set(createItems("1", "2", "3"));
      expect(idsOf(results.shuffle()).sort()).toEqual(["1", "2", "3"]);
    });

    test("notifies the onChanged listener", () => {
      const onChanged = vi.fn();

      results = new ObservableList<Identifiable>(onChanged);
      results.set(createItems("1"));
      onChanged.mockClear();
      results.shuffle();
      expect(onChanged).toHaveBeenCalledTimes(1);
    });
  });

  describe("append", () => {
    test("adds items to the end and returns them", () => {
      results.set(createItems("1", "2"));
      const added = createItems("3", "4");

      expect(results.append(added)).toBe(added);
      expect(idsOf(results.get())).toEqual(["1", "2", "3", "4"]);
    });

    test("notifies the onChanged listener with the combined results", () => {
      const onChanged = vi.fn();

      results = new ObservableList<Identifiable>(onChanged);
      results.set(createItems("1"));
      results.append(createItems("2"));
      expect(idsOf(onChanged.mock.lastCall?.[0])).toEqual(["1", "2"]);
    });
  });

  describe("prepend", () => {
    test("adds items to the front and returns them", () => {
      results.set(createItems("3", "4"));
      const added = createItems("1", "2");

      expect(results.prepend(added)).toBe(added);
      expect(idsOf(results.get())).toEqual(["1", "2", "3", "4"]);
    });

    test("notifies the onChanged listener with the combined results", () => {
      const onChanged = vi.fn();

      results = new ObservableList<Identifiable>(onChanged);
      results.set(createItems("2"));
      results.prepend(createItems("1"));
      expect(idsOf(onChanged.mock.lastCall?.[0])).toEqual(["1", "2"]);
    });
  });
});
