import { Preferences, createPreferences } from "@/app/context/preferences";
import { describe, expect, test } from "vitest";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { Preference } from "@/lib/storage/preference";
import { createEnvironment } from "@/testing/environment";
import { selectPreferenceDefaults } from "@/app/context/preference_defaults";

function listAllPreferences(preferences: Preferences): Preference<unknown>[] {
  const { reset: _reset, ...sections } = preferences;
  return Object.values(sections).flatMap(section => Object.values(section) as Preference<unknown>[]);
}

describe("createPreferences", () => {
  test("stores every preference under its own key", () => {
    const store = new MemoryLocalKeyedValues();
    const all = listAllPreferences(createPreferences(selectPreferenceDefaults(createEnvironment()), store));

    all.forEach((preference, index) => preference.set(index));

    expect(Object.keys(store.get("preferences") as object)).toHaveLength(all.length);
  });

  test("reads what an earlier session stored", () => {
    const store = new MemoryLocalKeyedValues();

    createPreferences(selectPreferenceDefaults(createEnvironment()), store).favorites.resultsPerPage.set(1);

    expect(createPreferences(selectPreferenceDefaults(createEnvironment()), store).favorites.resultsPerPage.value).toBe(1);
  });

  test("after a reset, the next session reads every default", () => {
    const store = new MemoryLocalKeyedValues();
    const preferences = createPreferences(selectPreferenceDefaults(createEnvironment()), store);
    const defaultValue = preferences.favorites.resultsPerPage.value;

    preferences.favorites.resultsPerPage.set(defaultValue + 1);
    preferences.reset();

    expect(createPreferences(selectPreferenceDefaults(createEnvironment()), store).favorites.resultsPerPage.value).toBe(defaultValue);
    expect(store.get("preferences")).toBeUndefined();
  });
});
