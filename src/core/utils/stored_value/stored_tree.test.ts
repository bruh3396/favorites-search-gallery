import { describe, expect, test } from "vitest";
import { StoredValueStorage } from "@/core/utils/stored_value/stored_value_storage";
import { createStoredTree } from "@/core/utils/stored_value/stored_tree";
import { defineStoredMap } from "@/core/utils/stored_value/stored_map_definition";
import { defineStoredValue } from "@/core/utils/stored_value/stored_value_definition";

function createStorage(entries: Record<string, unknown> = {}): StoredValueStorage & { entries: Record<string, unknown> } {
  return {
    entries,
    get: (key): unknown => entries[key],
    set: (key, value): void => {
      entries[key] = value;
    }
  };
}

const SCHEMA = {
  panel: { size: defineStoredValue(6), isOpen: defineStoredValue(false), view: { dense: defineStoredValue(false) } },
  other: { size: defineStoredValue(1) },
  volume: defineStoredValue(1)
};

describe("createStoredTree", () => {
  test("stores each preference under its name, inside one section per nested schema", () => {
    const storage = createStorage({ panel: { size: 4 } });
    const { panel, volume } = createStoredTree(SCHEMA, storage, ["panel", "volume"]);

    panel.isOpen.set(true);
    panel.view.dense.set(true);
    volume.set(0.5);
    expect(panel.size.value).toBe(4);
    expect(storage.entries).toEqual({ panel: { size: 4, isOpen: true, view: { dense: true } }, volume: 0.5 });
  });

  test("builds only the branches it is asked for", () => {
    expect(Object.keys(createStoredTree(SCHEMA, createStorage(), ["other"]))).toEqual(["other"]);
  });

  test("keeps sibling sections' stored values when one section writes", () => {
    const storage = createStorage({ other: { size: 3 } });

    createStoredTree(SCHEMA, storage, ["panel"]).panel.size.set(2);
    expect(storage.entries).toEqual({ other: { size: 3 }, panel: { size: 2 } });
  });

  describe("a map", () => {
    const MAP_SCHEMA = { owners: defineStoredMap({ size: defineStoredValue(6), view: { dense: defineStoredValue(false) } }) };

    test("stores each key's entry in its own section", () => {
      const storage = createStorage({ owners: { a: { size: 4 } } });
      const { owners } = createStoredTree(MAP_SCHEMA, storage, ["owners"]);

      owners.get("b").view.dense.set(true);
      expect([owners.get("a").size.value, owners.get("b").size.value]).toEqual([4, 6]);
      expect(storage.entries).toEqual({ owners: { a: { size: 4 }, b: { view: { dense: true } } } });
    });

    test("hands out one entry per key, so its values never disagree", () => {
      const { owners } = createStoredTree(MAP_SCHEMA, createStorage(), ["owners"]);

      expect(owners.get("a")).toBe(owners.get("a"));
    });
  });
});
