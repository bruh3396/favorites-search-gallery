import { describe, expect, test } from "vitest";
import { PreferenceStorage } from "@/core/utils/preference/preference_storage";
import { createPreferenceTree } from "@/core/utils/preference/preference_tree";
import { definePreference } from "@/core/utils/preference/preference_definition";

function createStorage(entries: Record<string, unknown> = {}): PreferenceStorage & { entries: Record<string, unknown> } {
  return {
    entries,
    get: (key): unknown => entries[key],
    set: (key, value): void => {
      entries[key] = value;
    }
  };
}

const SCHEMA = {
  panel: { size: definePreference(6), isOpen: definePreference(false), view: { dense: definePreference(false) } },
  other: { size: definePreference(1) },
  volume: definePreference(1)
};

describe("createPreferenceTree", () => {
  test("stores each preference under its name, inside one section per nested schema", () => {
    const storage = createStorage({ panel: { size: 4 } });
    const { panel, volume } = createPreferenceTree(SCHEMA, storage, ["panel", "volume"]);

    panel.isOpen.set(true);
    panel.view.dense.set(true);
    volume.set(0.5);
    expect(panel.size.value).toBe(4);
    expect(storage.entries).toEqual({ panel: { size: 4, isOpen: true, view: { dense: true } }, volume: 0.5 });
  });

  test("builds only the branches it is asked for", () => {
    expect(Object.keys(createPreferenceTree(SCHEMA, createStorage(), ["other"]))).toEqual(["other"]);
  });

  test("keeps sibling sections' stored values when one section writes", () => {
    const storage = createStorage({ other: { size: 3 } });

    createPreferenceTree(SCHEMA, storage, ["panel"]).panel.size.set(2);
    expect(storage.entries).toEqual({ other: { size: 3 }, panel: { size: 2 } });
  });
});
