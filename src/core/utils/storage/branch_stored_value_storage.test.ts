import { describe, expect, test } from "vitest";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/memory_local_keyed_values";
import { createBranchStoredValueStorage } from "@/core/utils/storage/branch_stored_value_storage";

describe("createBranchStoredValueStorage", () => {
  test("keeps its keys as one object under its name", () => {
    const localKeyedValues = new MemoryLocalKeyedValues();
    const branchStoredValueStorage = createBranchStoredValueStorage("preferences", localKeyedValues);

    branchStoredValueStorage.set("theme", "dark");
    branchStoredValueStorage.set("columns", 5);
    expect([localKeyedValues.get("preferences"), branchStoredValueStorage.get("theme")]).toEqual([{ theme: "dark", columns: 5 }, "dark"]);
  });

  test("leaves the parent's other keys alone", () => {
    const localKeyedValues = new MemoryLocalKeyedValues();

    localKeyedValues.set("searchSnippets", ["a"]);
    createBranchStoredValueStorage("preferences", localKeyedValues).set("theme", "dark");
    expect(localKeyedValues.get("searchSnippets")).toEqual(["a"]);
  });

  test.each([undefined, null, 3, "text", [1, 2]])("treats a stored value that isn't an object as empty (%s)", stored => {
    const localKeyedValues = new MemoryLocalKeyedValues();

    localKeyedValues.set("preferences", stored);
    const branchStoredValueStorage = createBranchStoredValueStorage("preferences", localKeyedValues);

    expect(branchStoredValueStorage.get("0")).toBeUndefined();
    branchStoredValueStorage.set("theme", "dark");
    expect(localKeyedValues.get("preferences")).toEqual({ theme: "dark" });
  });

  test("never reverts what another tab wrote since it was built", () => {
    const localKeyedValues = new MemoryLocalKeyedValues();
    const branchStoredValueStorage = createBranchStoredValueStorage("preferences", createBranchStoredValueStorage("app", localKeyedValues));
    const otherTabBranchStoredValueStorage = createBranchStoredValueStorage("preferences", createBranchStoredValueStorage("app", localKeyedValues));

    branchStoredValueStorage.get("theme");
    otherTabBranchStoredValueStorage.set("columns", 5);
    branchStoredValueStorage.set("theme", "dark");
    expect(localKeyedValues.get("app")).toEqual({ preferences: { columns: 5, theme: "dark" } });
  });
});
