import { setDataset, toggleDataset } from "@/utils/browser/dataset";
import { Theme } from "@/lib/ui/theme/themes";
import { macroTask } from "@/lib/async/scheduling";
import { writeCookie } from "@/utils/browser/cookie";

export async function applyTheme(theme: Theme, dark: boolean): Promise<void> {
  await macroTask();
  setDataset(document.documentElement, "theme", dark ? `${theme}-dark` : theme);
  writeCookie("theme", dark ? "dark" : "light");
}

export function swapNativeStylesheet(dark: boolean): void {
  const link = document.querySelector<HTMLLinkElement>("link[rel=\"stylesheet\"][title=\"default\"]");
  const stylesheet = dark ? "desktop-dark.css" : "desktop.css";

  link?.setAttribute("href", `https://rule34.xxx//css/${stylesheet}`);
}

export function toggleGradient(enabled: boolean): void {
  toggleDataset(document.documentElement, "gradient", enabled);
}
