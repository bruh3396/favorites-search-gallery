import { describe, expect, test } from "vitest";
import { Carousel } from "@/lib/collection/carousel";
import { Identifiable } from "@/types/app";

const FORWARD = 1;
const BACKWARD = -1;

const items = (...ids: string[]): Identifiable[] => ids.map(id => ({ id }));

const cursorOver = (...ids: string[]): Carousel<Identifiable> => {
  const cursor = new Carousel<Identifiable>();

  cursor.indexItems(items(...ids));
  return cursor;
};

describe("Cursor", () => {
  test("starts on the first item", () => {
    expect(cursorOver("a", "b", "c").currentItem().id).toBe("a");
  });

  test("moves forward and backward", () => {
    const cursor = cursorOver("a", "b", "c");

    cursor.move(FORWARD);
    expect(cursor.currentItem().id).toBe("b");
    cursor.move(FORWARD);
    expect(cursor.currentItem().id).toBe("c");
    cursor.move(BACKWARD);
    expect(cursor.currentItem().id).toBe("b");
  });

  test("jumps to the last and first item", () => {
    const cursor = cursorOver("a", "b", "c");

    cursor.jumpToLast();
    expect(cursor.currentItem().id).toBe("c");
    cursor.jumpToFirst();
    expect(cursor.currentItem().id).toBe("a");
  });

  test("keeps each cursor independent", () => {
    const one = cursorOver("a", "b", "c");
    const two = cursorOver("a", "b", "c");

    one.move(FORWARD);

    expect(one.currentItem().id).toBe("b");
    expect(two.currentItem().id).toBe("a");
  });
});

describe("Cursor boundaries", () => {
  test("reports no boundary while moving inside the items", () => {
    expect(cursorOver("a", "b", "c").move(FORWARD)).toBe("none");
  });

  test("reports the start when moving back from the first item", () => {
    expect(cursorOver("a", "b", "c").move(BACKWARD)).toBe("start");
  });

  test("reports the end when moving past the last item", () => {
    const cursor = cursorOver("a", "b", "c");

    cursor.jumpToLast();
    expect(cursor.move(FORWARD)).toBe("end");
  });

  test("clamps to the first item when moving back from the start", () => {
    const cursor = cursorOver("a", "b", "c");

    cursor.move(BACKWARD);
    expect(cursor.currentItem().id).toBe("a");
  });

  test("clamps to the last item when moving past the end", () => {
    const cursor = cursorOver("a", "b", "c");

    cursor.jumpToLast();
    cursor.move(FORWARD);
    expect(cursor.currentItem().id).toBe("c");
  });

  test("reports the boundary on every move held against an edge", () => {
    const cursor = cursorOver("a", "b", "c");

    expect(cursor.move(BACKWARD)).toBe("start");
    expect(cursor.move(BACKWARD)).toBe("start");
    expect(cursor.currentItem().id).toBe("a");
  });

  test("reports a boundary when a lone item is moved off either side", () => {
    const cursor = cursorOver("only");

    expect(cursor.move(BACKWARD)).toBe("start");
    expect(cursor.move(FORWARD)).toBe("end");
    expect(cursor.currentItem().id).toBe("only");
  });
});

describe("Cursor pointTo", () => {
  test("points at the item with the given id", () => {
    const cursor = cursorOver("a", "b", "c");

    cursor.pointTo(items("c")[0]);
    expect(cursor.currentItem().id).toBe("c");
  });

  test("moves relative to the item pointed at", () => {
    const cursor = cursorOver("a", "b", "c");

    cursor.pointTo(items("c")[0]);
    cursor.move(BACKWARD);
    expect(cursor.currentItem().id).toBe("b");
  });

  test("throws for an id that is not indexed", () => {
    const cursor = cursorOver("a", "b", "c");

    expect(() => cursor.pointTo(items("missing")[0])).toThrow("Could not find item with id: missing");
  });

  test("throws for an item that was skipped for having no id", () => {
    const cursor = cursorOver("a", "", "c");

    expect(() => cursor.pointTo(items("")[0])).toThrow("Could not find item with id: ");
  });
});

describe("Cursor indexItems", () => {
  test("throws when navigating before any items are indexed", () => {
    const cursor = new Carousel<Identifiable>();

    expect(() => cursor.currentItem()).toThrow("Tried to navigate without items");
    expect(() => cursor.move(FORWARD)).toThrow("Tried to navigate without items");
    expect(() => cursor.jumpToFirst()).toThrow("Tried to navigate without items");
    expect(() => cursor.jumpToLast()).toThrow("Tried to navigate without items");
  });

  test("throws when navigating after the items are emptied", () => {
    const cursor = cursorOver("a", "b", "c");

    cursor.indexItems([]);
    expect(() => cursor.currentItem()).toThrow("Tried to navigate without items");
  });

  test("throws on a duplicate id", () => {
    expect(() => cursorOver("a", "b", "a")).toThrow("Duplicate item id: a");
  });

  test("indexes items without an id by position but not by lookup", () => {
    const cursor = cursorOver("a", "", "c");

    cursor.pointTo(items("c")[0]);
    cursor.move(BACKWARD);
    expect(cursor.currentItem().id).toBe("");
  });

  test("allows more than one item without an id", () => {
    const cursor = cursorOver("", "", "c");

    cursor.pointTo(items("c")[0]);
    expect(cursor.currentItem().id).toBe("c");
  });

  test("keeps the current position when re-indexing a longer list", () => {
    const cursor = cursorOver("a", "b", "c");

    cursor.jumpToLast();
    cursor.indexItems(items("a", "b", "c", "d"));
    expect(cursor.currentItem().id).toBe("c");
  });

  test("resets to the first item when re-indexing drops the current position", () => {
    const cursor = cursorOver("a", "b", "c", "d", "e");

    cursor.jumpToLast();
    cursor.indexItems(items("a", "b"));
    expect(cursor.currentItem().id).toBe("a");
  });

  test("keeps the last position when re-indexing to exactly that length", () => {
    const cursor = cursorOver("a", "b", "c");

    cursor.move(FORWARD);
    cursor.indexItems(items("x", "y"));
    expect(cursor.currentItem().id).toBe("y");
  });

  test("points at the replaced item when re-indexing keeps the position", () => {
    const cursor = cursorOver("a", "b", "c");

    cursor.jumpToLast();
    cursor.indexItems(items("x", "y", "z"));
    expect(cursor.currentItem().id).toBe("z");
  });

  test("forgets ids that are no longer indexed", () => {
    const cursor = cursorOver("a", "b", "c");

    cursor.indexItems(items("x", "y"));
    expect(() => cursor.pointTo(items("a")[0])).toThrow("Could not find item with id: a");
  });

  test("recovers after the items are emptied and indexed again", () => {
    const cursor = cursorOver("a", "b", "c");

    cursor.jumpToLast();
    cursor.indexItems([]);
    cursor.indexItems(items("a", "b", "c"));
    expect(cursor.currentItem().id).toBe("a");
  });
});
