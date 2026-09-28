import { afterEach, describe, expect, test } from "vitest";
import { BrowserKeyValueStore } from "@/adapters/browser/ports/key_value_store/key_value_store";

describe("BrowserKeyValueStore", () => {
  afterEach(() => {
    localStorage.clear();
  });

  test("reads back what it wrote, as a copy", () => {
    const store = new BrowserKeyValueStore();
    const value = { theme: "dark", columns: [5, 2] };

    store.set("preferences", value);

    expect(store.get("preferences")).toEqual(value);
    expect(store.get("preferences")).not.toBe(value);
  });

  test("keeps values in localStorage as JSON", () => {
    new BrowserKeyValueStore().set("count", 3);

    expect(localStorage.getItem("count")).toBe("3");
  });

  test("returns undefined for a missing key", () => {
    expect(new BrowserKeyValueStore().get("missing")).toBeUndefined();
  });

  test("returns undefined for a value that isn't JSON", () => {
    localStorage.setItem("broken", "{not json");

    expect(new BrowserKeyValueStore().get("broken")).toBeUndefined();
  });

  test("removes a key", () => {
    const store = new BrowserKeyValueStore();

    store.set("preferences", {});
    store.remove("preferences");

    expect(store.get("preferences")).toBeUndefined();
  });
});
