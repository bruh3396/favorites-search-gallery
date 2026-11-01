import { describe, expect, test } from "vitest";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/memory_local_keyed_values";
import { NamespacedLocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/namespaced_local_keyed_values";

function setup(): { innerLocalKeyedValues: MemoryLocalKeyedValues; namespacedLocalKeyedValues: NamespacedLocalKeyedValues } {
  const innerLocalKeyedValues = new MemoryLocalKeyedValues();
  return { innerLocalKeyedValues, namespacedLocalKeyedValues: new NamespacedLocalKeyedValues({ namespace: "preferences" }, innerLocalKeyedValues) };
}

describe("NamespacedLocalKeyedValues", () => {
  test("keeps its keys as one object under the namespace key", () => {
    const { innerLocalKeyedValues, namespacedLocalKeyedValues } = setup();

    namespacedLocalKeyedValues.set("theme", "dark");
    namespacedLocalKeyedValues.set("columns", 5);

    expect(innerLocalKeyedValues.get("preferences")).toEqual({ theme: "dark", columns: 5 });
    expect(namespacedLocalKeyedValues.get("theme")).toBe("dark");
  });

  test("loads what was already stored", () => {
    const innerLocalKeyedValues = new MemoryLocalKeyedValues();

    innerLocalKeyedValues.set("preferences", { theme: "dark" });

    expect(new NamespacedLocalKeyedValues({ namespace: "preferences" }, innerLocalKeyedValues).get("theme")).toBe("dark");
  });

  test.each([null, 3, "text", [1, 2]])("treats a stored value that isn't an object as empty (%s)", stored => {
    const innerLocalKeyedValues = new MemoryLocalKeyedValues();

    innerLocalKeyedValues.set("preferences", stored);

    expect(new NamespacedLocalKeyedValues({ namespace: "preferences" }, innerLocalKeyedValues).get("0")).toBeUndefined();
  });

  test("returns undefined for a missing key", () => {
    expect(setup().namespacedLocalKeyedValues.get("missing")).toBeUndefined();
  });

  test("removes a key and leaves the rest", () => {
    const { innerLocalKeyedValues, namespacedLocalKeyedValues } = setup();

    namespacedLocalKeyedValues.set("theme", "dark");
    namespacedLocalKeyedValues.set("columns", 5);
    namespacedLocalKeyedValues.remove("theme");

    expect(namespacedLocalKeyedValues.get("theme")).toBeUndefined();
    expect(innerLocalKeyedValues.get("preferences")).toEqual({ columns: 5 });
  });

  test("clears the whole namespace", () => {
    const { innerLocalKeyedValues, namespacedLocalKeyedValues } = setup();

    namespacedLocalKeyedValues.set("theme", "dark");
    namespacedLocalKeyedValues.clear();

    expect(namespacedLocalKeyedValues.get("theme")).toBeUndefined();
    expect(innerLocalKeyedValues.get("preferences")).toBeUndefined();
  });

  test("leaves other keys of the wrapped store alone", () => {
    const { innerLocalKeyedValues, namespacedLocalKeyedValues } = setup();

    innerLocalKeyedValues.set("searchSnippets", ["a"]);
    namespacedLocalKeyedValues.set("theme", "dark");
    namespacedLocalKeyedValues.clear();

    expect(innerLocalKeyedValues.get("searchSnippets")).toEqual(["a"]);
  });

  test("never reverts what another tab wrote since it loaded", () => {
    const innerLocalKeyedValues = new MemoryLocalKeyedValues();
    const tabLocalKeyedValues = new NamespacedLocalKeyedValues({ namespace: "preferences" }, innerLocalKeyedValues);
    const otherTabLocalKeyedValues = new NamespacedLocalKeyedValues({ namespace: "preferences" }, innerLocalKeyedValues);

    otherTabLocalKeyedValues.set("columns", 5);
    tabLocalKeyedValues.set("theme", "dark");

    expect(innerLocalKeyedValues.get("preferences")).toEqual({ columns: 5, theme: "dark" });
  });

  test("never reverts what another tab wrote when nested in an uncached namespace", () => {
    const innerLocalKeyedValues = new MemoryLocalKeyedValues();
    const tabLocalKeyedValues = new NamespacedLocalKeyedValues(
      { namespace: "preferences" },
      new NamespacedLocalKeyedValues({ namespace: "app", uncached: true }, innerLocalKeyedValues)
    );
    const otherTabLocalKeyedValues = new NamespacedLocalKeyedValues(
      { namespace: "preferences" },
      new NamespacedLocalKeyedValues({ namespace: "app", uncached: true }, innerLocalKeyedValues)
    );

    otherTabLocalKeyedValues.set("columns", 5);
    tabLocalKeyedValues.set("theme", "dark");

    expect(innerLocalKeyedValues.get("app")).toEqual({ preferences: { columns: 5, theme: "dark" } });
  });
});
