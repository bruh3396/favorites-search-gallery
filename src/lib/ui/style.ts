import { setDataset, toggleDataset } from "@/utils/dom/attribute";
import { Theme } from "@/types/ui";
import { setCookie } from "@/utils/browser/cookie";
import { yieldControl } from "@/lib/async/timing";

const root = document.documentElement;
const nativeCookies: Partial<Record<Theme, string>> = {
  "native-dark": "dark",
  "native-light": "light"
};

export async function applyTheme(theme: Theme): Promise<void> {
  await yieldControl();
  setDataset(root, "theme", theme);
  syncNativeThemeCookie(theme);
}

export function applySurfaceGradient(enabled: boolean): void {
  toggleDataset(root, "surfaceGradient", enabled);
}

export function setColorScheme(color: string): void {
  root.style.setProperty("--color-gallery-background", color);
}

export function toggleGalleryMenuEnabled(value: boolean): void {
  toggleDataset(root, "galleryMenuHidden", !value);
}

function syncNativeThemeCookie(theme: Theme): void {
  const cookieValue = nativeCookies[theme];

  if (cookieValue !== undefined) {
    setCookie("theme", cookieValue);
  }
}
