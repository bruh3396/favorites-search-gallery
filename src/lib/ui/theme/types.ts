import { MapToString } from "@/types/app";

export const THEME_COLOR_KEYS = [
  "surface",
  "sunken",
  "raised",
  "hover",
  "border",
  "text",
  "textMuted",
  "accent",
  "accentText",
  "link"
] as const;

export type ThemeColors = MapToString<typeof THEME_COLOR_KEYS>;
