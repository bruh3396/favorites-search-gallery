import { beforeEach, describe, expect, test } from "vitest";
import { Identifiable } from "@/types/app";
import { IdentifiedList } from "@/lib/collections/identified_list";

const item = (id: string): Identifiable => ({ id });
const items = (...ids: string[]): Identifiable[] => ids.map(item);
const ids = (results: Identifiable[]): string[] => results.map(r => r.id);

describe("IdentifiedList", () => {
  let list: IdentifiedList<Identifiable>;

  beforeEach(() => {
    list = new IdentifiedList<Identifiable>();
  });

  test("starts empty", () => {
    expect(list.getAll()).toEqual([]);
    expect(list.getAllIds()).toEqual(new Set());
  });

  describe("setAll", () => {
    test("stores the given items", () => {
      list.setAll(items("1", "2"));
      expect(ids(list.getAll())).toEqual(["1", "2"]);
    });

    test("replaces any existing items", () => {
      list.setAll(items("1", "2"));
      list.setAll(items("3"));
      expect(ids(list.getAll())).toEqual(["3"]);
    });

    test("indexes the items for lookup by id", () => {
      const two = item("2");

      list.setAll([item("1"), two]);
      expect(list.get("2")).toBe(two);
    });
  });

  describe("append", () => {
    test("adds items to the end", () => {
      list.setAll(items("1", "2"));
      list.append(items("3", "4"));
      expect(ids(list.getAll())).toEqual(["1", "2", "3", "4"]);
    });

    test("makes appended items findable by id", () => {
      const three = item("3");

      list.setAll(items("1"));
      list.append([three]);
      expect(list.get("3")).toBe(three);
    });
  });

  describe("prepend", () => {
    test("adds items to the front", () => {
      list.setAll(items("3", "4"));
      list.prepend(items("1", "2"));
      expect(ids(list.getAll())).toEqual(["1", "2", "3", "4"]);
    });

    test("makes prepended items findable by id", () => {
      const zero = item("0");

      list.setAll(items("1"));
      list.prepend([zero]);
      expect(list.get("0")).toBe(zero);
    });
  });

  describe("get", () => {
    test("returns undefined for an unknown id", () => {
      list.setAll(items("1"));
      expect(list.get("999")).toBeUndefined();
    });

    test("returns the most recently indexed item for a duplicate id", () => {
      const first = item("1");
      const second = item("1");

      list.setAll([first]);
      list.append([second]);
      expect(list.get("1")).toBe(second);
    });
  });

  describe("getAll", () => {
    test("returns a copy that does not mutate internal state", () => {
      list.setAll(items("1", "2"));
      list.getAll().push(item("3"));
      expect(ids(list.getAll())).toEqual(["1", "2"]);
    });
  });

  describe("getAllIds", () => {
    test("returns the ids of all items", () => {
      list.setAll(items("1", "2", "3"));
      expect(list.getAllIds()).toEqual(new Set(["1", "2", "3"]));
    });
  });
});
