import { describe, expect, test } from "vitest";
import { StoredMapDefinition } from "@/core/utils/storage/stored_map_definition";
import { StoredValueStorage } from "@/core/utils/storage/stored_value_storage";
import { createStoredTree } from "@/core/utils/storage/stored_tree";
import { createStoredValueDefinition } from "@/core/utils/storage/stored_value_definition";
import { resetStoredTree } from "@/core/utils/storage/stored_tree_resetter";

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
  panel: { size: createStoredValueDefinition(6), isOpen: createStoredValueDefinition(false), view: { dense: createStoredValueDefinition(false) } },
  volume: createStoredValueDefinition(1)
};

describe("resetStoredTree", () => {
  test("puts every value back to its default, however deeply nested", () => {
    const storage = createStorage({ panel: { size: 4, view: { dense: true } }, volume: 0.5 });
    const { panel, volume } = createStoredTree(SCHEMA, storage, ["panel", "volume"]);

    resetStoredTree({ panel, volume });
    expect([panel.size.value, panel.view.dense.value, volume.value]).toEqual([6, false, 1]);
    expect(storage.entries).toMatchObject({ panel: { size: 6, view: { dense: false } }, volume: 1 });
  });

  test("leaves the values it is told to keep", () => {
    const { panel } = createStoredTree(SCHEMA, createStorage({ panel: { size: 4, isOpen: true } }), ["panel"]);

    resetStoredTree({ panel }, [panel.isOpen]);
    expect([panel.size.value, panel.isOpen.value]).toEqual([6, true]);
  });

  test("leaves a map's entries alone", () => {
    const { owners } = createStoredTree(
      { owners: new StoredMapDefinition({ size: createStoredValueDefinition(6) }) },
      createStorage({ owners: { a: { size: 4 } } }),
      ["owners"]
    );

    resetStoredTree({ owners });
    expect(owners.get("a").size.value).toBe(4);
  });
});
