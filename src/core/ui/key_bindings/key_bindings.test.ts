import { KeyBindings, findCommandInKeyBindings } from "@/core/ui/key_bindings/key_bindings";
import { describe, expect, test } from "vitest";

type Command = "first" | "second" | "unbound";

const keyBindings: KeyBindings<Command> = { first: ["a", "ArrowRight"], second: ["b"], unbound: [] };

describe("findCommandInKeyBindings", () => {
  test("finds the command bound to the key", () => {
    expect(findCommandInKeyBindings(keyBindings, "ArrowRight")).toBe("first");
    expect(findCommandInKeyBindings(keyBindings, "b")).toBe("second");
  });

  test("finds nothing for an unbound key", () => {
    expect(findCommandInKeyBindings(keyBindings, "x")).toBeUndefined();
  });

  test("matches only the exact key", () => {
    expect([findCommandInKeyBindings(keyBindings, "A"), findCommandInKeyBindings(keyBindings, "Ctrl+a")]).toEqual([undefined, undefined]);
  });
});
