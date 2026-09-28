import { describe, expect, test } from "vitest";
import { MemoryKeyValueStore } from "@/adapters/memory/ports/key_value_store/key_value_store";

describe("MemoryKeyValueStore", () => {
  test("reads back what it wrote", () => {
    const store = new MemoryKeyValueStore();

    store.set("preferences", { theme: "dark" });

    expect(store.get("preferences")).toEqual({ theme: "dark" });
  });

  test("returns undefined for a missing key", () => {
    expect(new MemoryKeyValueStore().get("missing")).toBeUndefined();
  });

  test("removes a key", () => {
    const store = new MemoryKeyValueStore();

    store.set("preferences", {});
    store.remove("preferences");

    expect(store.get("preferences")).toBeUndefined();
  });

  test("is unaffected by mutating a value after writing or reading it", () => {
    const store = new MemoryKeyValueStore();
    const written = { columns: [5] };

    store.set("preferences", written);
    written.columns.push(2);
    (store.get("preferences") as typeof written).columns.push(7);

    expect(store.get("preferences")).toEqual({ columns: [5] });
  });
});
