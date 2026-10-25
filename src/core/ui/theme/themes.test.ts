import { describe, expect, test } from "vitest";
import { ThemeColors, applyTheme } from "@/core/ui/theme/themes";

function createColors(base: string): ThemeColors {
  return { surface: `${base}1`, sunken: `${base}2`, text: `${base}3`, muted: `${base}4`, accent: `${base}5`, onAccent: `${base}6` };
}

describe("applyTheme", () => {
  test("writes each theme color on the root as its light and dark pair", () => {
    const root = document.createElement("div");

    applyTheme(root, { light: createColors("#aaaaa"), dark: createColors("#bbbbb") });
    expect([
      root.style.getPropertyValue("--fsg-theme-surface"),
      root.style.getPropertyValue("--fsg-theme-on-accent")
    ]).toEqual(["light-dark(#aaaaa1, #bbbbb1)", "light-dark(#aaaaa6, #bbbbb6)"]);
  });

  test("replaces the colors of the theme applied before", () => {
    const root = document.createElement("div");

    applyTheme(root, { light: createColors("#aaaaa"), dark: createColors("#bbbbb") });
    applyTheme(root, { light: createColors("#ccccc"), dark: createColors("#ddddd") });
    expect(root.style.getPropertyValue("--fsg-theme-accent")).toBe("light-dark(#ccccc5, #ddddd5)");
  });
});
