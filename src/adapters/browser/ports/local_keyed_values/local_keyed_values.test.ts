import { afterEach, describe, expect, test } from "vitest";
import { BrowserLocalKeyedValues } from "@/adapters/browser/ports/local_keyed_values/local_keyed_values";

describe("BrowserLocalKeyedValues", () => {
  afterEach(() => {
    localStorage.clear();
  });

  test("reads back what it wrote, as a copy", () => {
    const store = new BrowserLocalKeyedValues();
    const value = { theme: "dark", columns: [5, 2] };

    store.set("preferences", value);

    expect(store.get("preferences")).toEqual(value);
    expect(store.get("preferences")).not.toBe(value);
  });

  test("keeps values in localStorage as JSON", () => {
    new BrowserLocalKeyedValues().set("count", 3);

    expect(localStorage.getItem("count")).toBe("3");
  });

  test("returns undefined for a missing key", () => {
    expect(new BrowserLocalKeyedValues().get("missing")).toBeUndefined();
  });

  test("returns undefined for a value that isn't JSON", () => {
    localStorage.setItem("broken", "{not json");

    expect(new BrowserLocalKeyedValues().get("broken")).toBeUndefined();
  });

  test("removes a key", () => {
    const store = new BrowserLocalKeyedValues();

    store.set("preferences", {});
    store.remove("preferences");

    expect(store.get("preferences")).toBeUndefined();
  });
});
