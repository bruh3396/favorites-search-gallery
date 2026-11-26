import { ThemeColors } from "@/core/ui/theme/theme_colors";
import { ThemeDefinition } from "@/core/ui/theme/theme_definition";

const THEME_PROPERTIES: Readonly<Record<keyof ThemeColors, string>> = {
  surface: "--fsg-theme-surface",
  sunken: "--fsg-theme-sunken",
  text: "--fsg-theme-text",
  muted: "--fsg-theme-muted",
  accent: "--fsg-theme-accent",
  onAccent: "--fsg-theme-on-accent"
};

export function applyTheme(root: HTMLElement, { lightColors: lightThemeColors, darkColors: darkThemeColors }: ThemeDefinition): void {
  for (const [color, property] of Object.entries(THEME_PROPERTIES) as [keyof ThemeColors, string][]) {
    root.style.setProperty(property, `light-dark(${lightThemeColors[color]}, ${darkThemeColors[color]})`);
  }
}
