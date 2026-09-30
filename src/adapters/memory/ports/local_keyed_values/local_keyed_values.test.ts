import { describe, expect, test } from "vitest";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";

describe("MemoryLocalKeyedValues", () => {
  test("reads back what it wrote", () => {
    const store = new MemoryLocalKeyedValues();

    store.set("preferences", { theme: "dark" });

    expect(store.get("preferences")).toEqual({ theme: "dark" });
  });

  test("returns undefined for a missing key", () => {
    expect(new MemoryLocalKeyedValues().get("missing")).toBeUndefined();
  });

  test("removes a key", () => {
    const store = new MemoryLocalKeyedValues();

    store.set("preferences", {});
    store.remove("preferences");

    expect(store.get("preferences")).toBeUndefined();
  });

  test("is unaffected by mutating a value after writing or reading it", () => {
    const store = new MemoryLocalKeyedValues();
    const written = { columns: [5] };

    store.set("preferences", written);
    written.columns.push(2);
    (store.get("preferences") as typeof written).columns.push(7);

    expect(store.get("preferences")).toEqual({ columns: [5] });
  });
});
