import { describe, expect, test } from "vitest";
import { findLightboxShortcut } from "@/core/features/lightbox/input/lightbox_shortcut_finder";

describe("findLightboxShortcut", () => {
  test.each([
    [" ", { text: "Space", ariaName: "Space" }],
    ["ArrowRight", { text: "→", ariaName: "ArrowRight" }],
    ["Escape", { text: "Esc", ariaName: "Escape" }],
    ["z", { text: "Z", ariaName: "z" }],
    ["Backspace", { text: "Backspace", ariaName: "Backspace" }]
  ])("describes %j for display and for assistive technology", (key, shortcut) => {
    expect(findLightboxShortcut({ [key]: "toggleZoom" }, "toggleZoom")).toEqual(shortcut);
  });

  test("returns the first key bound to the command", () => {
    expect(findLightboxShortcut({ ArrowRight: "showNext", d: "showNext" }, "showNext")?.text).toBe("→");
  });

  test("returns undefined for a command with no key", () => {
    expect(findLightboxShortcut({ z: "toggleZoom" }, "download")).toBeUndefined();
  });
});
