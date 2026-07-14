/* eslint-disable key-spacing */

import { ThemeColors } from "@/lib/ui/theme/types";

//           surface      sunken       raised       hover        border       text         muted        accent       accentText    link
export const THEMES = {
  native: {
    light: ["#aae5a4", "#f2faf0", "#89cf81", "#b6e0ad", "#7cc472", "#000000", "#000000", "#0075ff", "#ffffff", "#000099"],
    dark:  ["#303a30", "#293129", "#364036", "#44503f", "#4a564a", "#e8efe8", "#9fb09f", "#0075ff", "#ffffff", "#93b393"]
  },
  cherry: {
    light: ["#fff1f5", "#ffe4ec", "#ffe0ea", "#ffd0de", "#f6b8cc", "#4a2330", "#a06b7d", "#f06292", "#ffffff", "#c2185b"],
    dark:  ["#2a1620", "#1f0f17", "#371d29", "#472634", "#5e3343", "#fce4ec", "#c99aaa", "#f06292", "#1f0f17", "#f48fb1"]
  },
  dusk: {
    light: ["#e6e1f2", "#f1eef9", "#d6cee9", "#c5badd", "#a99cc8", "#241a33", "#5f5279", "#6d4fc4", "#ffffff", "#553fa3"],
    dark:  ["#1a1426", "#130e1c", "#261d38", "#322749", "#41355e", "#e9e3f5", "#9b8fb5", "#a78bfa", "#130e1c", "#c4b5fd"]
  },
  ember: {
    light: ["#fde0d2", "#fff0e9", "#fbcdb8", "#f7b89e", "#ec9670", "#2a1812", "#a85f3f", "#e8470f", "#ffffff", "#b8431a"],
    dark:  ["#1f1512", "#160d0a", "#2c1d18", "#3a2620", "#4d3128", "#f5e6df", "#b08a7c", "#ff6a3d", "#1f1512", "#ff9b6a"]
  },
  forest: {
    light: ["#d6ecd9", "#e8f5ea", "#bfe0c5", "#a8d4b0", "#82bd8f", "#14241a", "#4a7355", "#2f8f3c", "#ffffff", "#27692f"],
    dark:  ["#14241a", "#0e1a12", "#1c3024", "#264030", "#355040", "#e4f0e6", "#9bb6a3", "#6dbf73", "#0e1a12", "#a7e0ac"]
  },
  frost: {
    light: ["#d4ebf9", "#e6f4fd", "#bce0f5", "#a4d4f1", "#7bbce8", "#0f1b2d", "#3f6585", "#0e8cc4", "#ffffff", "#0a6aa3"],
    dark:  ["#0f1b2d", "#0a1320", "#16273f", "#1f3556", "#2c4569", "#e3edf9", "#8aa4c4", "#38bdf8", "#0a1320", "#7dd3fc"]
  },
  slate: {
    light: ["#dce8f7", "#eaf2fc", "#c7dbf2", "#b3cdec", "#8fb2e0", "#0d1117", "#3f5b80", "#1e63c4", "#ffffff", "#0a4ea3"],
    dark:  ["#0d1117", "#161b22", "#21262d", "#30363d", "#3d444d", "#e6edf3", "#7d8590", "#3b81d1", "#ffffff", "#0e53a1"]
  },
  parchment: {
    light: ["#f4ecd8", "#e8dcc0", "#fbf5e6", "#ecdfc3", "#cbb792", "#463720", "#8a7550", "#a8541f", "#fbf5e6", "#8a3a12"],
    dark:  ["#2a2418", "#1f1a10", "#37301f", "#473e29", "#5e5238", "#f4ecd8", "#b0a079", "#c8771f", "#1f1a10", "#d89a4a"]
  },
  venom: {
    light: ["#ecdcef", "#f6ecf8", "#e0c8e4", "#d3b4d9", "#bd96c6", "#2f2032", "#6e5872", "#4f9c1d", "#ffffff", "#5f6e0e"],
    dark:  ["#2f2032", "#1d141f", "#402c44", "#523857", "#5e3965", "#ede8ee", "#ad9bb0", "#8df042", "#161216", "#edde78"]
  },
  zeal: {
    light: ["#e3e5e8", "#f1f2f4", "#d4d7db", "#c5c9ce", "#aeb3ba", "#1f2123", "#5e636b", "#b08c12", "#1f2123", "#8a7a2a"],
    dark:  ["#2b2d30", "#1f2123", "#3a3d41", "#45484d", "#54585f", "#eef0f2", "#9aa0a8", "#d4af37", "#1c1f24", "#aeaeae"]
  }
} as const satisfies Record<string, ThemeDefinition>;

export type Theme = keyof typeof THEMES;
export interface ThemeDefinition {
  readonly light: ThemeColors;
  readonly dark: ThemeColors;
}
