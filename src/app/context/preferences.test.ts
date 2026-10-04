import { Preferences, createPreferences } from "@/app/context/preferences";
import { describe, expect, test } from "vitest";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { NamespacedLocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/namespaced_local_keyed_values";
import { Preference } from "@/lib/storage/preference";
import { createEnvironment } from "@/testing/environment";
import { selectPreferenceDefaults } from "@/app/context/preference_defaults";

function createStore(): NamespacedLocalKeyedValues {
  return new NamespacedLocalKeyedValues("favorites-search-gallery", new MemoryLocalKeyedValues());
}

function listAllPreferences(preferences: Preferences): Preference<unknown>[] {
  const { reset: _reset, ...sections } = preferences;
  return Object.values(sections).flatMap(section => Object.values(section) as Preference<unknown>[]);
}

describe("createPreferences", () => {
  test("stores every preference under its own key", () => {
    const store = createStore();
    const all = listAllPreferences(createPreferences(selectPreferenceDefaults(createEnvironment()), store));

    all.forEach((preference, index) => preference.set(index));

    expect(Object.keys(store.get("preferences") as object)).toHaveLength(all.length);
  });

  test("reads what an earlier session stored", () => {
    const store = createStore();

    createPreferences(selectPreferenceDefaults(createEnvironment()), store).favorites.resultsPerPage.set(1);

    expect(createPreferences(selectPreferenceDefaults(createEnvironment()), store).favorites.resultsPerPage.value).toBe(1);
  });

  test("reads every default in the session after a reset", () => {
    const store = createStore();
    const preferences = createPreferences(selectPreferenceDefaults(createEnvironment()), store);
    const defaultValue = preferences.favorites.resultsPerPage.value;

    preferences.favorites.resultsPerPage.set(defaultValue + 1);
    preferences.reset();

    expect(createPreferences(selectPreferenceDefaults(createEnvironment()), store).favorites.resultsPerPage.value).toBe(defaultValue);
    expect(store.get("preferences")).toBeUndefined();
  });

  test("drops everything else the app keeps in the store on reset", () => {
    const inner = new MemoryLocalKeyedValues();
    const store = new NamespacedLocalKeyedValues("favorites-search-gallery", inner);

    store.set("searchHistory", ["cat"]);
    inner.set("otherScript", 1);
    createPreferences(selectPreferenceDefaults(createEnvironment()), store).reset();

    expect(inner.get("favorites-search-gallery")).toBeUndefined();
    expect(inner.get("otherScript")).toBe(1);
  });
});
