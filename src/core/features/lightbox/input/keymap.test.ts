import { describe, expect, test } from "vitest";
import { DEFAULT_LIGHTBOX_KEYMAP } from "@/core/features/lightbox/input/keymap";

describe("DEFAULT_LIGHTBOX_KEYMAP", () => {
  test("binds both cases of every letter key to the same command", () => {
    const letters = Object.keys(DEFAULT_LIGHTBOX_KEYMAP).filter(key => (/^[a-z]$/i).test(key));

    for (const letter of letters) {
      expect(DEFAULT_LIGHTBOX_KEYMAP[letter.toLowerCase()]).toBe(DEFAULT_LIGHTBOX_KEYMAP[letter.toUpperCase()]);
    }
  });

  test("navigates with the arrow keys", () => {
    expect(DEFAULT_LIGHTBOX_KEYMAP.ArrowRight).toBe("showNext");
    expect(DEFAULT_LIGHTBOX_KEYMAP.ArrowLeft).toBe("showPrevious");
  });

  test("dismisses on Escape", () => {
    expect(DEFAULT_LIGHTBOX_KEYMAP.Escape).toBe("dismiss");
  });
});
