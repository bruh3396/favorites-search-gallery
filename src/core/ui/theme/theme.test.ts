import { DEFAULT_THEME, THEMES, THEME_DEFINITIONS } from "@/core/ui/theme/theme";
import { describe, expect, test } from "vitest";

describe("THEME_DEFINITIONS", () => {
  test("defines every theme", () => {
    expect(Object.keys(THEME_DEFINITIONS)).toEqual([...THEMES]);
  });

  test("names each color of a theme's row in column order", () => {
    expect(THEME_DEFINITIONS.ink).toEqual({
      lightColors: { surface: "#ffffff", sunken: "#f2f2f2", text: "#000000", muted: "#5c5c5c", accent: "#000000", onAccent: "#ffffff" },
      darkColors: { surface: "#121212", sunken: "#000000", text: "#ffffff", muted: "#a3a3a3", accent: "#ffffff", onAccent: "#000000" }
    });
  });

  test("gives every color of every theme a hex value", () => {
    const colors = Object.values(THEME_DEFINITIONS).flatMap(({ lightColors: lightThemeColors, darkColors: darkThemeColors }) => [
      ...Object.values(lightThemeColors),
      ...Object.values(darkThemeColors)
    ]);

    expect(colors.filter(color => !(/^#[0-9a-f]{6}$/).test(color))).toEqual([]);
  });

  test("defaults to a defined theme", () => {
    expect(THEMES).toContain(DEFAULT_THEME);
  });
});
