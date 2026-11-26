/* eslint-disable @stylistic/max-len */
/* eslint-disable key-spacing */
import { THEMES, Theme } from "@/core/ui/theme/theme";
import { ThemeColors } from "@/core/ui/theme/theme_colors";
import { ThemeDefinition } from "@/core/ui/theme/theme_definition";

//                  surface    sunken     text       muted      accent     onAccent
type Row = readonly [string, string, string, string, string, string];

const THEME_ROWS: Readonly<Record<Theme, { lightRow: Row; darkRow: Row }>> = {
  rule34:    { lightRow: ["#aae5a4", "#f2faf0", "#000000", "#4a4a4a", "#000099", "#ffffff"], darkRow: ["#303a30", "#222922", "#e8efe8", "#9fb09f", "#b0e0b0", "#303a30"] },
  cherry:    { lightRow: ["#ffd9e4", "#ffd8e4", "#4a2330", "#7a4a5b", "#f06292", "#ffffff"], darkRow: ["#2a1620", "#1f0f17", "#fce4ec", "#c99aaa", "#f06292", "#1f0f17"] },
  cirrus:    { lightRow: ["#dfe9fa", "#eff7fe", "#232a36", "#525c6d", "#d1603f", "#ffffff"], darkRow: ["#232a36", "#1a202a", "#eef1f6", "#98a3b5", "#f3845c", "#1a202a"] },
  dusk:      { lightRow: ["#d3c1f8", "#e7defd", "#241a33", "#4e4267", "#6d4fc4", "#ffffff"], darkRow: ["#1a1426", "#130e1c", "#e9e3f5", "#9b8fb5", "#a78bfa", "#130e1c"] },
  ember:     { lightRow: ["#ffd4c0", "#ffebe1", "#2a1812", "#7d442c", "#e8470f", "#ffffff"], darkRow: ["#1f1512", "#160d0a", "#f5e6df", "#b08a7c", "#ff6a3d", "#1f1512"] },
  forest:    { lightRow: ["#b5e2bc", "#d8f0dc", "#14241a", "#31593d", "#2f8f3c", "#ffffff"], darkRow: ["#14241a", "#0e1a12", "#e4f0e6", "#9bb6a3", "#6dbf73", "#0e1a12"] },
  frost:     { lightRow: ["#97d8fe", "#cbeafe", "#0f1b2d", "#294e6d", "#0e8cc4", "#ffffff"], darkRow: ["#0f1b2d", "#0a1320", "#e3edf9", "#8aa4c4", "#38bdf8", "#0a1320"] },
  ink:       { lightRow: ["#ffffff", "#f2f2f2", "#000000", "#5c5c5c", "#000000", "#ffffff"], darkRow: ["#121212", "#000000", "#ffffff", "#a3a3a3", "#ffffff", "#000000"] },
  parchment: { lightRow: ["#f1e3c2", "#e6d8b5", "#463720", "#6a5739", "#a8541f", "#fbf5e6"], darkRow: ["#2a2418", "#1f1a10", "#f4ecd8", "#b0a079", "#c8771f", "#1f1a10"] },
  slate:     { lightRow: ["#add2fe", "#d3e7ff", "#0d1117", "#2f4a6e", "#1e63c4", "#ffffff"], darkRow: ["#20242c", "#1b1e25", "#e3e6ec", "#a3abb9", "#7aa2f7", "#10131a"] },
  venom:     { lightRow: ["#e7c4ed", "#f3e0f7", "#2f2032", "#5a455e", "#4f9c1d", "#ffffff"], darkRow: ["#2f2032", "#1d141f", "#ede8ee", "#ad9bb0", "#8df042", "#161216"] },
  zeal:      { lightRow: ["#e3e5e8", "#f1f2f4", "#1f2123", "#545961", "#b08c12", "#1f2123"], darkRow: ["#2b2d30", "#1f2123", "#eef0f2", "#9aa0a8", "#d4af37", "#1c1f24"] }
};

export const THEME_DEFINITIONS: Readonly<Record<Theme, ThemeDefinition>> = Object.fromEntries(THEMES.map(theme => [theme, { lightColors: toColors(THEME_ROWS[theme].lightRow), darkColors: toColors(THEME_ROWS[theme].darkRow) }])) as Record<Theme, ThemeDefinition>;

function toColors([surface, sunken, text, muted, accent, onAccent]: Row): ThemeColors {
  return { surface, sunken, text, muted, accent, onAccent };
}
