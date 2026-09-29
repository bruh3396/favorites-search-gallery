import { Preferences, createPreferences } from "@/app/context/preferences";
import { describe, expect, test } from "vitest";
import { MemoryKeyValueStore } from "@/adapters/memory/ports/key_value_store/key_value_store";
import { Preference } from "@/lib/storage/preference";
import { createEnvironment } from "@/testing/environment";

function allPreferencesOf(preferences: Preferences): Preference<unknown>[] {
  const { reset: _reset, ...sections } = preferences;
  return Object.values(sections).flatMap(section => Object.values(section) as Preference<unknown>[]);
}

describe("createPreferences", () => {
  test("stores every preference under its own key", () => {
    const store = new MemoryKeyValueStore();
    const all = allPreferencesOf(createPreferences(createEnvironment(), store));

    all.forEach((preference, index) => preference.set(index));

    expect(Object.keys(store.get("preferences") as object)).toHaveLength(all.length);
  });

  test("reads what an earlier session stored", () => {
    const store = new MemoryKeyValueStore();

    createPreferences(createEnvironment(), store).favorites.resultsPerPage.set(1);

    expect(createPreferences(createEnvironment(), store).favorites.resultsPerPage.value).toBe(1);
  });

  test("reset brings every preference back to its default", () => {
    const store = new MemoryKeyValueStore();
    const preferences = createPreferences(createEnvironment(), store);
    const defaultValue = preferences.favorites.resultsPerPage.value;

    preferences.favorites.resultsPerPage.set(defaultValue + 1);
    preferences.reset();

    expect(preferences.favorites.resultsPerPage.value).toBe(defaultValue);
    expect(store.get("preferences")).toBeUndefined();
  });
});
