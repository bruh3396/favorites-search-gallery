import { KeyBindingOverrides, applyKeyBindingOverrides, isKeyBindingOverrides } from "@/core/ui/key_bindings/key_binding_overrides";
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
