import { describe, expect, test } from "vitest";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/memory_local_keyed_values";

describe("MemoryLocalKeyedValues", () => {
  test("reads back what it wrote", () => {
    const localKeyedValues = new MemoryLocalKeyedValues();

    localKeyedValues.set("preferences", { theme: "dark" });

    expect(localKeyedValues.get("preferences")).toEqual({ theme: "dark" });
  });

  test("returns undefined for a missing key", () => {
    expect(new MemoryLocalKeyedValues().get("missing")).toBeUndefined();
  });

  test("removes a key", () => {
    const localKeyedValues = new MemoryLocalKeyedValues();

    localKeyedValues.set("preferences", {});
    localKeyedValues.remove("preferences");

    expect(localKeyedValues.get("preferences")).toBeUndefined();
  });

  test("keeps its copy when a written or read value is mutated", () => {
    const localKeyedValues = new MemoryLocalKeyedValues();
    const written = { columns: [5] };

    localKeyedValues.set("preferences", written);
    written.columns.push(2);
    (localKeyedValues.get("preferences") as typeof written).columns.push(7);

    expect(localKeyedValues.get("preferences")).toEqual({ columns: [5] });
  });
});
