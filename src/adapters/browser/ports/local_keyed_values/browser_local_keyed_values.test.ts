import { afterEach, describe, expect, test } from "vitest";
import { BrowserLocalKeyedValues } from "@/adapters/browser/ports/local_keyed_values/browser_local_keyed_values";

describe("BrowserLocalKeyedValues", () => {
  afterEach(() => {
    localStorage.clear();
  });

  test("reads back what it wrote, as a copy", () => {
    const localKeyedValues = new BrowserLocalKeyedValues();
    const value = { theme: "dark", columns: [5, 2] };

    localKeyedValues.set("preferences", value);

    expect(localKeyedValues.get("preferences")).toEqual(value);
    expect(localKeyedValues.get("preferences")).not.toBe(value);
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
    const localKeyedValues = new BrowserLocalKeyedValues();

    localKeyedValues.set("preferences", {});
    localKeyedValues.remove("preferences");

    expect(localKeyedValues.get("preferences")).toBeUndefined();
  });
});
