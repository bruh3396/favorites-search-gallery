import { describe, expect, test } from "vitest";
import { DEFAULT_FAVORITES_KEY_BINDINGS } from "@/core/app/favorites/commands/default_favorites_key_bindings";
import { findCommandInKeyBindings } from "@/core/ui/key_bindings/key_bindings";

describe("DEFAULT_FAVORITES_KEY_BINDINGS", () => {
  test.each([
    ["/", "focusSearch"],
    ["ArrowRight", "goToNextPage"],
    ["ArrowLeft", "goToPreviousPage"],
    ["z", "toggleZen"],
    ["Z", "toggleZen"],
    ["Escape", "exitZen"],
    ["Enter", "openGallery"]
  ])("binds %j to %s", (key, favoritesCommand) => {
    expect(findCommandInKeyBindings(DEFAULT_FAVORITES_KEY_BINDINGS, key)).toBe(favoritesCommand);
  });

  test("binds no key to two commands", () => {
    const keys = Object.values(DEFAULT_FAVORITES_KEY_BINDINGS).flat();

    expect(new Set(keys).size).toBe(keys.length);
  });
});
