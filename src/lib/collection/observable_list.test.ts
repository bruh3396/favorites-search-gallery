import { beforeEach, describe, expect, test, vi } from "vitest";
import { Identifiable } from "@/types/app";
import { ObservableList } from "@/lib/collection/observable_list";

const item = (id: string): Identifiable => ({ id });
const items = (...ids: string[]): Identifiable[] => ids.map(item);
const ids = (results: Identifiable[]): string[] => results.map(r => r.id);

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
      const next = items("1", "2");

      expect(results.set(next)).toBe(next);
      expect(results.get()).toBe(next);
    });

    test("notifies the onChanged listener with the new results", () => {
      const onChanged = vi.fn();

      results.setup(onChanged);
      const next = items("1");

      results.set(next);
      expect(onChanged).toHaveBeenCalledWith(next);
    });

    test("does not throw before a listener is registered", () => {
      expect(() => results.set(items("1"))).not.toThrow();
    });
  });

  describe("invert", () => {
    test("returns items not present in the current results", () => {
      results.set(items("1", "3"));
      expect(ids(results.invert(items("1", "2", "3", "4")))).toEqual(["2", "4"]);
    });

    test("returns all items when results are empty", () => {
      expect(ids(results.invert(items("1", "2")))).toEqual(["1", "2"]);
    });

    test("does not mutate the current results", () => {
      const current = items("1");

      results.set(current);
      results.invert(items("1", "2"));
      expect(results.get()).toBe(current);
    });
  });

  describe("shuffle", () => {
    test("keeps the same set of results", () => {
      results.set(items("1", "2", "3"));
      expect(ids(results.shuffle()).sort()).toEqual(["1", "2", "3"]);
    });

    test("notifies the onChanged listener", () => {
      const onChanged = vi.fn();

      results.setup(onChanged);
      results.set(items("1"));
      onChanged.mockClear();
      results.shuffle();
      expect(onChanged).toHaveBeenCalledTimes(1);
    });
  });

  describe("append", () => {
    test("adds items to the end and returns them", () => {
      results.set(items("1", "2"));
      const added = items("3", "4");

      expect(results.append(added)).toBe(added);
      expect(ids(results.get())).toEqual(["1", "2", "3", "4"]);
    });

    test("notifies the onChanged listener with the combined results", () => {
      const onChanged = vi.fn();

      results.setup(onChanged);
      results.set(items("1"));
      results.append(items("2"));
      expect(ids(onChanged.mock.lastCall?.[0])).toEqual(["1", "2"]);
    });
  });

  describe("prepend", () => {
    test("adds items to the front and returns them", () => {
      results.set(items("3", "4"));
      const added = items("1", "2");

      expect(results.prepend(added)).toBe(added);
      expect(ids(results.get())).toEqual(["1", "2", "3", "4"]);
    });

    test("notifies the onChanged listener with the combined results", () => {
      const onChanged = vi.fn();

      results.setup(onChanged);
      results.set(items("2"));
      results.prepend(items("1"));
      expect(ids(onChanged.mock.lastCall?.[0])).toEqual(["1", "2"]);
    });
  });
});
