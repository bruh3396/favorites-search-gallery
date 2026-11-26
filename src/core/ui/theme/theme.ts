export const THEMES = ["rule34", "cherry", "cirrus", "dusk", "ember", "forest", "frost", "ink", "parchment", "slate", "venom", "zeal"] as const;
export type Theme = (typeof THEMES)[number];

export const DEFAULT_THEME: Theme = "rule34";
