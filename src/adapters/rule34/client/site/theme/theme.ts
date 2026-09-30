import { ColorScheme } from "@/core/boundary/environment";

const COOKIE_LIFETIME_SECONDS = 365 * 24 * 60 * 60;

export function setTheme(colorScheme: ColorScheme): void {
  document.cookie = `theme=${colorScheme}; max-age=${COOKIE_LIFETIME_SECONDS}; path=/`;
}
