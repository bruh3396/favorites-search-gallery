import { describe, expect, test } from "vitest";
import { IdentifiedList } from "@/core/utils/collection/identified_list";

const createItem = (id: string): { id: string } => ({ id });
const createItems = (...ids: string[]): { id: string }[] => ids.map(createItem);
const getIds = (results: { id: string }[]): string[] => results.map(r => r.id);

describe("IdentifiedList", () => {
  test("starts empty", () => {
    const list = new IdentifiedList<{ id: string }>();

    expect(list.getAll()).toEqual([]);
    expect(list.getAllIds()).toEqual(new Set());
  });

  describe("setAll", () => {
    test("stores the given items", () => {
      const list = new IdentifiedList<{ id: string }>();

      list.setAll(createItems("1", "2"));
      expect(getIds(list.getAll())).toEqual(["1", "2"]);
    });

    test("replaces any existing items", () => {
      const list = new IdentifiedList<{ id: string }>();

      list.setAll(createItems("1", "2"));
      list.setAll(createItems("3"));
      expect(getIds(list.getAll())).toEqual(["3"]);
    });

    test("drops replaced items from lookup by id", () => {
      const list = new IdentifiedList<{ id: string }>();

      list.setAll(createItems("1", "2"));
      list.setAll(createItems("3"));
      expect(list.get("1")).toBeUndefined();
      expect(list.get("2")).toBeUndefined();
    });

    test("indexes the items for lookup by id", () => {
      const list = new IdentifiedList<{ id: string }>();
      const two = createItem("2");

      list.setAll([createItem("1"), two]);
      expect(list.get("2")).toBe(two);
    });
  });

  describe("append", () => {
    test("adds items to the end", () => {
      const list = new IdentifiedList<{ id: string }>();

      list.setAll(createItems("1", "2"));
      list.append(createItems("3", "4"));
      expect(getIds(list.getAll())).toEqual(["1", "2", "3", "4"]);
    });

    test("makes appended items findable by id", () => {
      const list = new IdentifiedList<{ id: string }>();
      const three = createItem("3");

      list.setAll(createItems("1"));
      list.append([three]);
      expect(list.get("3")).toBe(three);
    });
  });

  describe("prepend", () => {
    test("adds items to the front", () => {
      const list = new IdentifiedList<{ id: string }>();

      list.setAll(createItems("3", "4"));
      list.prepend(createItems("1", "2"));
      expect(getIds(list.getAll())).toEqual(["1", "2", "3", "4"]);
    });

    test("moves an item whose id it already holds to the front", () => {
      const list = new IdentifiedList<{ id: string }>();

      list.setAll(createItems("1", "2", "3"));
      list.prepend(createItems("2"));
      expect(getIds(list.getAll())).toEqual(["2", "1", "3"]);
    });

    test("makes prepended items findable by id", () => {
      const list = new IdentifiedList<{ id: string }>();
      const zero = createItem("0");

      list.setAll(createItems("1"));
      list.prepend([zero]);
      expect(list.get("0")).toBe(zero);
    });
  });

  describe("get", () => {
    test("returns undefined for an unknown id", () => {
      const list = new IdentifiedList<{ id: string }>();

      list.setAll(createItems("1"));
      expect(list.get("999")).toBeUndefined();
    });

    test("returns the most recently indexed item for a duplicate id", () => {
      const list = new IdentifiedList<{ id: string }>();
      const first = createItem("1");
      const second = createItem("1");

      list.setAll([first]);
      list.append([second]);
      expect(list.get("1")).toBe(second);
    });
  });

  describe("getAll", () => {
    test("returns a copy that does not mutate internal state", () => {
      const list = new IdentifiedList<{ id: string }>();

      list.setAll(createItems("1", "2"));
      list.getAll().push(createItem("3"));
      expect(getIds(list.getAll())).toEqual(["1", "2"]);
    });
  });

  describe("size", () => {
    test("counts the items", () => {
      const list = new IdentifiedList<{ id: string }>();

      list.setAll(createItems("1", "2"));
      list.append(createItems("3"));
      expect(list.size).toBe(3);
    });
  });

  describe("slice", () => {
    test("returns the items in the given range", () => {
      const list = new IdentifiedList<{ id: string }>();

      list.setAll(createItems("1", "2", "3", "4"));
      expect(getIds(list.slice(1, 3))).toEqual(["2", "3"]);
    });

    test("returns a copy that does not mutate internal state", () => {
      const list = new IdentifiedList<{ id: string }>();

      list.setAll(createItems("1", "2"));
      list.slice(0, 2).push(createItem("3"));
      expect(getIds(list.getAll())).toEqual(["1", "2"]);
    });
  });

  describe("getAllIds", () => {
    test("returns the ids of all items", () => {
      const list = new IdentifiedList<{ id: string }>();

      list.setAll(createItems("1", "2", "3"));
      expect(list.getAllIds()).toEqual(new Set(["1", "2", "3"]));
    });
  });
});
