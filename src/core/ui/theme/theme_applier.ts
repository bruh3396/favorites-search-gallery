import { ThemeColors, ThemeDefinition } from "@/core/ui/theme/theme";

const THEME_PROPERTIES: Readonly<Record<keyof ThemeColors, string>> = {
  surface: "--fsg-theme-surface",
  sunken: "--fsg-theme-sunken",
  text: "--fsg-theme-text",
  muted: "--fsg-theme-muted",
  accent: "--fsg-theme-accent",
  onAccent: "--fsg-theme-on-accent"
};

export function applyTheme(root: HTMLElement, { light, dark }: ThemeDefinition): void {
  for (const [color, property] of Object.entries(THEME_PROPERTIES) as [keyof ThemeColors, string][]) {
    root.style.setProperty(property, `light-dark(${light[color]}, ${dark[color]})`);
  }
}
