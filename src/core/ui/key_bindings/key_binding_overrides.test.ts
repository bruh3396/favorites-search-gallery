import { KeyBindingOverrides, applyKeyBindingOverrides, isKeyBindingOverrides, removeKeyFromKeyBindingOverrides, replaceKeyInKeyBindingOverrides } from "@/core/ui/key_bindings/key_binding_overrides";
import { describe, expect, test } from "vitest";
import { KeyBindings } from "@/core/ui/key_bindings/key_bindings";

type Command = "first" | "second" | "unbound";

const defaultKeyBindings: KeyBindings<Command> = { first: ["a", "ArrowRight"], second: ["b"], unbound: [] };

describe("isKeyBindingOverrides", () => {
  test("accepts commands bound to lists of keys, empty ones included", () => {
    expect(isKeyBindingOverrides({})).toBe(true);
    expect(isKeyBindingOverrides({ first: ["a", "ArrowRight"], unbound: [] })).toBe(true);
  });

  test.each([null, [], "a", { first: "a" }, { first: [1] }, { first: null }])("rejects %j", raw => {
    expect(isKeyBindingOverrides(raw)).toBe(false);
  });
});

describe("applyKeyBindingOverrides", () => {
  test("keeps the default keys of commands left unchanged", () => {
    expect(applyKeyBindingOverrides<Command>(defaultKeyBindings, {})).toEqual(defaultKeyBindings);
  });

  test("replaces the keys of changed commands, unbinding with an empty list", () => {
    expect(applyKeyBindingOverrides<Command>(defaultKeyBindings, { first: ["x"], second: [] })).toEqual({ first: ["x"], second: [], unbound: [] });
  });

  test("drops commands that have no default", () => {
    expect(applyKeyBindingOverrides<Command>(defaultKeyBindings, { removed: ["r"] } as KeyBindingOverrides<Command>)).toEqual(defaultKeyBindings);
  });
});

describe("replaceKeyInKeyBindingOverrides", () => {
  test("replaces the key at its index, keeping the command's other keys and other overrides", () => {
    expect(replaceKeyInKeyBindingOverrides<Command>({ second: [] }, defaultKeyBindings, { command: "first", keyIndex: 1, key: "x" }))
      .toEqual({ second: [], first: ["a", "x"] });
  });

  test("changes nothing when the command already has the key", () => {
    const keyBindingOverrides: KeyBindingOverrides<Command> = { second: ["b"] };

    expect(replaceKeyInKeyBindingOverrides<Command>(keyBindingOverrides, defaultKeyBindings, { command: "first", keyIndex: 0, key: "ArrowRight" }))
      .toBe(keyBindingOverrides);
  });

  test("adds the key after the last one at the index past it", () => {
    expect(replaceKeyInKeyBindingOverrides<Command>({}, defaultKeyBindings, { command: "unbound", keyIndex: 0, key: "u" })).toEqual({ unbound: ["u"] });
  });

  test("takes the key from the command that had it", () => {
    expect(replaceKeyInKeyBindingOverrides<Command>({}, defaultKeyBindings, { command: "second", keyIndex: 0, key: "ArrowRight" }))
      .toEqual({ first: ["a"], second: ["ArrowRight"] });
  });
});

describe("removeKeyFromKeyBindingOverrides", () => {
  test("removes the key at its index, keeping other overrides", () => {
    expect(removeKeyFromKeyBindingOverrides<Command>({ second: [] }, defaultKeyBindings, { command: "first", keyIndex: 0 }))
      .toEqual({ second: [], first: ["ArrowRight"] });
  });

  test("leaves the command unbound once its last key is removed", () => {
    expect(removeKeyFromKeyBindingOverrides<Command>({}, defaultKeyBindings, { command: "second", keyIndex: 0 })).toEqual({ second: [] });
  });
});
