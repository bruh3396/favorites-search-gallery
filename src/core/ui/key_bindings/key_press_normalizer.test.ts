import { describe, expect, test } from "vitest";
import { normalizeKeyPress } from "@/core/ui/key_bindings/key_press_normalizer";

type KeyPress = Parameters<typeof normalizeKeyPress>[0];

function createKeyPress(key: string, partialKeyPress: Partial<Omit<KeyPress, "key">> = {}): KeyPress {
  return { key, code: "", ctrlKey: false, altKey: false, metaKey: false, ...partialKeyPress };
}

describe("normalizeKeyPress", () => {
  test("lowercases a character", () => {
    expect(normalizeKeyPress(createKeyPress("K"))).toBe("k");
  });

  test("keeps the case of a named key", () => {
    expect(normalizeKeyPress(createKeyPress("ArrowRight"))).toBe("ArrowRight");
  });

  test("leads with held modifiers in a fixed order", () => {
    expect(normalizeKeyPress(createKeyPress("K", { metaKey: true, altKey: true, ctrlKey: true }))).toBe("Ctrl+Alt+Meta+k");
  });

  test("ignores Shift, which already shapes the key", () => {
    expect(normalizeKeyPress({ ...createKeyPress("?"), shiftKey: true } as KeyPress)).toBe("?");
  });

  test("names the physical key when Alt turns a letter or digit into a symbol", () => {
    expect([
      normalizeKeyPress(createKeyPress("Ω", { code: "KeyZ", altKey: true })),
      normalizeKeyPress(createKeyPress("¡", { code: "Digit1", altKey: true }))
    ]).toEqual(["Alt+z", "Alt+1"]);
  });

  test("keeps the typed letter under Alt, for layouts whose physical key differs", () => {
    expect(normalizeKeyPress(createKeyPress("a", { code: "KeyQ", altKey: true }))).toBe("Alt+a");
  });

  test("keeps a symbol without Alt", () => {
    expect(normalizeKeyPress(createKeyPress("/", { code: "Slash" }))).toBe("/");
  });
});
