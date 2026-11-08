import { KeyBindings, findCommandInKeyBindings, isKeyBindings, mergeKeyBindings } from "@/core/ui/key_bindings/key_bindings";
import { describe, expect, test } from "vitest";

type Command = "first" | "second" | "unbound";

const keyBindings: KeyBindings<Command> = { first: ["a", "ArrowRight"], second: ["b"], unbound: [] };

describe("isKeyBindings", () => {
  test("accepts commands bound to lists of keys, empty ones included", () => {
    expect(isKeyBindings({})).toBe(true);
    expect(isKeyBindings({ first: ["a", "ArrowRight"], unbound: [] })).toBe(true);
  });

  test.each([null, [], "a", { first: "a" }, { first: [1] }, { first: null }])("rejects %j", raw => {
    expect(isKeyBindings(raw)).toBe(false);
  });
});

describe("mergeKeyBindings", () => {
  test("keeps the default keys of commands left unchanged", () => {
    expect(mergeKeyBindings<Command>(keyBindings, {})).toEqual(keyBindings);
  });

  test("replaces the keys of changed commands, unbinding with an empty list", () => {
    expect(mergeKeyBindings<Command>(keyBindings, { first: ["x"], second: [] })).toEqual({ first: ["x"], second: [], unbound: [] });
  });

  test("drops commands that have no default", () => {
    expect(mergeKeyBindings<Command>(keyBindings, { removed: ["r"] } as KeyBindings<Command>)).toEqual(keyBindings);
  });
});

describe("findCommandInKeyBindings", () => {
  test("finds the command bound to the key", () => {
    expect(findCommandInKeyBindings(keyBindings, "ArrowRight")).toBe("first");
    expect(findCommandInKeyBindings(keyBindings, "b")).toBe("second");
  });

  test("matches a letter whatever its case", () => {
    expect(findCommandInKeyBindings(keyBindings, "A")).toBe("first");
  });

  test("finds nothing for an unbound key", () => {
    expect(findCommandInKeyBindings(keyBindings, "x")).toBeUndefined();
  });

  test("keeps the case of named keys", () => {
    expect(findCommandInKeyBindings(keyBindings, "arrowright")).toBeUndefined();
  });
});
