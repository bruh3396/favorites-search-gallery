export const COLOR_SCHEMES = ["light", "dark"] as const;
export type ColorScheme = (typeof COLOR_SCHEMES)[number];
