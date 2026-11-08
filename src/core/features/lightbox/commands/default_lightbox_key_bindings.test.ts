import { describe, expect, test } from "vitest";
import { DEFAULT_LIGHTBOX_KEY_BINDINGS } from "@/core/features/lightbox/commands/default_lightbox_key_bindings";
import { findCommandInKeyBindings } from "@/core/ui/key_bindings/key_bindings";

describe("DEFAULT_LIGHTBOX_KEY_BINDINGS", () => {
  test.each([
    ["ArrowRight", "showNext"],
    ["d", "showNext"],
    ["ArrowLeft", "showPrevious"],
    ["a", "showPrevious"],
    ["Escape", "dismiss"],
    ["Backspace", "close"],
    ["Delete", "close"]
  ])("binds %j to %s", (key, lightboxCommand) => {
    expect(findCommandInKeyBindings(DEFAULT_LIGHTBOX_KEY_BINDINGS, key)).toBe(lightboxCommand);
  });

  test("binds no key to two commands", () => {
    const keys = Object.values(DEFAULT_LIGHTBOX_KEY_BINDINGS).flat();

    expect(new Set(keys).size).toBe(keys.length);
  });
});
