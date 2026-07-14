import { THEMES, Theme } from "@/lib/ui/theme/themes";
import { THEME_COLOR_KEYS, ThemeColors } from "@/lib/ui/theme/types";
import { capitalize, toKebabCase } from "@/utils/string/format";

export function themeStyles(): string {
  return Object.entries(THEMES)
    .flatMap(([theme, { light, dark }]) => [
      toThemeBlock(theme, light),
      toThemeBlock(`${theme}-dark`, dark)
    ])
    .join("\n\n");
}

export function themeOptions(): Map<Theme, string> {
  const options = new Map<Theme, string>();

  for (const theme of Object.keys(THEMES)) {
    options.set(theme as Theme, capitalize(theme));
  }
  return options;
}

function toThemeBlock(selector: string, colors: ThemeColors): string {
  const properties = THEME_COLOR_KEYS
    .map((key, index) => `  --theme-${toKebabCase(key)}: ${colors[index]};`)
    .join("\n");
  return `[data-theme="${selector}"] {\n${properties}\n}`;
}
