import { setDataset, toggleDataset } from "@/utils/dom/dataset";
import { Theme } from "@/types/app";
import { setCookie } from "@/utils/browser/cookie";
import { macroTask } from "@/lib/async/async";

const root = document.documentElement;
const nativeCookies: Partial<Record<Theme, string>> = {
  "native-dark": "dark",
  "native-light": "light"
};

export async function applyTheme(theme: Theme): Promise<void> {
  await macroTask();
  setDataset(root, "theme", theme);
  syncNativeThemeCookie(theme);
}

export function applySurfaceGradient(enabled: boolean): void {
  toggleDataset(root, "surfaceGradient", enabled);
}

export function setColorScheme(color: string): void {
  root.style.setProperty("--color-gallery-background", color);
}

function syncNativeThemeCookie(theme: Theme): void {
  const cookieValue = nativeCookies[theme];

  if (cookieValue !== undefined) {
    setCookie("theme", cookieValue);
  }
}
