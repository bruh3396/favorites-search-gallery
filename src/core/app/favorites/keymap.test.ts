import { describe, expect, test } from "vitest";
import { DEFAULT_FAVORITES_KEYMAP } from "@/core/app/favorites/keymap";

describe("DEFAULT_FAVORITES_KEYMAP", () => {
  test("binds both cases of every letter key to the same command", () => {
    const letters = Object.keys(DEFAULT_FAVORITES_KEYMAP).filter(key => (/^[a-z]$/i).test(key));

    for (const letter of letters) {
      expect(DEFAULT_FAVORITES_KEYMAP[letter.toLowerCase()]).toBe(DEFAULT_FAVORITES_KEYMAP[letter.toUpperCase()]);
    }
  });

  test("toggles zen on Z", () => {
    expect(DEFAULT_FAVORITES_KEYMAP.z).toBe("toggleZen");
  });

  test("exits zen on Escape", () => {
    expect(DEFAULT_FAVORITES_KEYMAP.Escape).toBe("exitZen");
  });
});
