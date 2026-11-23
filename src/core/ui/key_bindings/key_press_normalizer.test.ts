import { KeyPress, normalizeKeyPress } from "@/core/ui/key_bindings/key_press_normalizer";
import { describe, expect, test } from "vitest";

function createKeyPress(key: string, partialKeyPress: Partial<Omit<KeyPress, "key">> = {}): KeyPress {
  return { key, ctrlKey: false, altKey: false, metaKey: false, ...partialKeyPress };
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
});
