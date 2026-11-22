import { KeyBindings, findCommandInKeyBindings } from "@/core/ui/key_bindings/key_bindings";
import { describe, expect, test } from "vitest";

type Command = "first" | "second" | "unbound";

const keyBindings: KeyBindings<Command> = { first: ["a", "ArrowRight"], second: ["b"], unbound: [] };

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
