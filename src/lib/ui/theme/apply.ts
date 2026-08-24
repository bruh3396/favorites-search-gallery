import { setDataset, toggleDataset } from "@/utils/browser/dataset";
import { ON_DESKTOP_DEVICE } from "@/lib/environment";
import { Theme } from "@/lib/ui/theme/themes";
import { macroTask } from "@/lib/async/scheduling";
import { writeCookie } from "@/utils/browser/cookie";

export async function applyTheme(theme: Theme, dark: boolean): Promise<void> {
  await macroTask();
  setDataset(document.documentElement, "theme", dark ? `${theme}-dark` : theme);
  writeCookie("theme", dark ? "dark" : "light");
}

export function swapNativeStylesheet(dark: boolean): void {
  document.querySelector<HTMLLinkElement>("link[rel=\"stylesheet\"][title=\"default\"]")?.setAttribute("href", nativeStylesheetURL(dark));
}

export function toggleGradient(enabled: boolean): void {
  toggleDataset(document.documentElement, "gradient", enabled);
}

function nativeStylesheetURL(dark: boolean): string {
  const platform = ON_DESKTOP_DEVICE ? "desktop" : "mobile";
  const mode = dark ? "-dark" : "";
  return `https://rule34.xxx//css/${platform}${mode}.css?46`;
}
