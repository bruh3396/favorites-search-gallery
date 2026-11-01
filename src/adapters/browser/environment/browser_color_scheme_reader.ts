import { ColorScheme } from "@/core/boundary/color_scheme";

export function readBrowserColorScheme(): ColorScheme {
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
