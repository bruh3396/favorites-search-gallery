import { Mock, describe, expect, test, vi } from "vitest";
import { KeyedList } from "@/core/ui/post_grid/keyed_list";

interface Item {
  id: string;
}

function createItems(...ids: string[]): Item[] {
  return ids.map(id => ({ id }));
}

function setup(): { list: KeyedList<Item>; create: Mock<(item: Item) => HTMLElement> } {
  const create = vi.fn((item: Item): HTMLElement => {
    const element = document.createElement("div");

    element.textContent = item.id;
    return element;
  });
  return { list: new KeyedList({ getKey: item => item.id, create }), create };
}

function readTexts(elements: HTMLElement[]): string[] {
  return elements.map(element => element.textContent);
}

describe("KeyedList", () => {
  describe("reconcile", () => {
    test("returns one element per item in order", () => {
      const { list } = setup();

      expect(readTexts(list.reconcile(createItems("1", "2", "3")))).toEqual(["1", "2", "3"]);
    });

    test("keeps the same element for a key that is still present", () => {
      const { list } = setup();
      const [, second] = list.reconcile(createItems("1", "2"));

      expect(list.reconcile(createItems("2", "3"))[0]).toBe(second);
    });

    test("drops the elements whose keys are gone", () => {
      const { list } = setup();

      list.reconcile(createItems("1", "2", "3"));
      expect(readTexts(list.reconcile(createItems("2")))).toEqual(["2"]);
    });

    test("orders the elements to match the items", () => {
      const { list } = setup();
      const elements = list.reconcile(createItems("1", "2", "3"));

      expect(list.reconcile(createItems("3", "1", "2"))).toEqual([elements[2], elements[0], elements[1]]);
    });

    test("creates nothing when the list is unchanged", () => {
      const { list, create } = setup();

      list.reconcile(createItems("1", "2"));
      list.reconcile(createItems("1", "2"));
      expect(create).toHaveBeenCalledTimes(2);
    });

    test("creates a removed key's element again when it returns", () => {
      const { list, create } = setup();

      list.reconcile(createItems("1"));
      list.reconcile([]);
      list.reconcile(createItems("1"));
      expect(create).toHaveBeenCalledTimes(2);
    });
  });

  describe("recreate", () => {
    test("swaps a new element in where the old one stands", () => {
      const { list } = setup();
      const parent = document.createElement("div");
      const [first, second] = list.reconcile(createItems("1", "2"));

      parent.append(first, second);
      list.recreate({ id: "1" });
      expect(parent.children).toHaveLength(2);
      expect(parent.children[0]).not.toBe(first);
      expect(parent.children[1]).toBe(second);
    });

    test("keeps the new element on the next reconcile", () => {
      const { list, create } = setup();

      list.reconcile(createItems("1"));
      list.recreate({ id: "1" });
      const [element] = list.reconcile(createItems("1"));

      expect(element).toBe(create.mock.results[1].value);
    });

    test("ignores an item it does not list", () => {
      const { list, create } = setup();

      list.reconcile(createItems("1"));
      list.recreate({ id: "2" });
      expect(create).toHaveBeenCalledOnce();
    });
  });
});
