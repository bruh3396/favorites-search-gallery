import { describe, expect, test } from "vitest";
import { PreferenceStorage } from "@/core/utils/preference/preference_storage";
import { createPreferenceSet } from "@/core/utils/preference/preference_set";
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

describe("createPreferenceSet", () => {
  test("stores each preference under its name in the schema", () => {
    const storage = createStorage({ size: 4 });
    const { size, isOpen } = createPreferenceSet({ size: definePreference(6), isOpen: definePreference(false) }, storage);

    isOpen.set(true);
    expect(size.value).toBe(4);
    expect(storage.entries).toEqual({ size: 4, isOpen: true });
  });
});
