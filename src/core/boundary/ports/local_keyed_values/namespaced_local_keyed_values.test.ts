import { describe, expect, test } from "vitest";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { NamespacedLocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/namespaced_local_keyed_values";

function setup(): { store: MemoryLocalKeyedValues; namespaced: NamespacedLocalKeyedValues } {
  const store = new MemoryLocalKeyedValues();
  return { store, namespaced: new NamespacedLocalKeyedValues("preferences", store) };
}

describe("NamespacedLocalKeyedValues", () => {
  test("keeps its keys as one object under the namespace key", () => {
    const { store, namespaced } = setup();

    namespaced.set("theme", "dark");
    namespaced.set("columns", 5);

    expect(store.get("preferences")).toEqual({ theme: "dark", columns: 5 });
    expect(namespaced.get("theme")).toBe("dark");
  });

  test("loads what was already stored", () => {
    const store = new MemoryLocalKeyedValues();

    store.set("preferences", { theme: "dark" });

    expect(new NamespacedLocalKeyedValues("preferences", store).get("theme")).toBe("dark");
  });

  test.each([null, 3, "text", [1, 2]])("treats a stored value that isn't an object as empty (%s)", (stored) => {
    const store = new MemoryLocalKeyedValues();

    store.set("preferences", stored);

    expect(new NamespacedLocalKeyedValues("preferences", store).get("0")).toBeUndefined();
  });

  test("returns undefined for a missing key", () => {
    expect(setup().namespaced.get("missing")).toBeUndefined();
  });

  test("removes a key and leaves the rest", () => {
    const { store, namespaced } = setup();

    namespaced.set("theme", "dark");
    namespaced.set("columns", 5);
    namespaced.remove("theme");

    expect(namespaced.get("theme")).toBeUndefined();
    expect(store.get("preferences")).toEqual({ columns: 5 });
  });

  test("clears the whole namespace", () => {
    const { store, namespaced } = setup();

    namespaced.set("theme", "dark");
    namespaced.clear();

    expect(namespaced.get("theme")).toBeUndefined();
    expect(store.get("preferences")).toBeUndefined();
  });

  test("leaves other keys of the wrapped store alone", () => {
    const { store, namespaced } = setup();

    store.set("searchSnippets", ["a"]);
    namespaced.set("theme", "dark");
    namespaced.clear();

    expect(store.get("searchSnippets")).toEqual(["a"]);
  });

  test("never reverts what another tab wrote since it loaded", () => {
    const store = new MemoryLocalKeyedValues();
    const tab = new NamespacedLocalKeyedValues("preferences", store);
    const otherTab = new NamespacedLocalKeyedValues("preferences", store);

    otherTab.set("columns", 5);
    tab.set("theme", "dark");

    expect(store.get("preferences")).toEqual({ columns: 5, theme: "dark" });
  });
});
