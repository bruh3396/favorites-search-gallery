import { setDataset, toggleDataset } from "@/utils/browser/dataset";
import { Theme } from "@/lib/ui/theme/themes";
import { macroTask } from "@/lib/async/scheduling";
import { writeCookie } from "@/utils/browser/cookie";

const root = document.documentElement;

export async function applyTheme(theme: Theme, dark: boolean): Promise<void> {
  await macroTask();
  setDataset(root, "theme", dark ? `${theme}-dark` : theme);
  syncNativeThemeCookie(theme, dark);
}

export function toggleGradient(enabled: boolean): void {
  toggleDataset(root, "gradient", enabled);
}

function syncNativeThemeCookie(theme: Theme, dark: boolean): void {
  if (theme === "native") {
    writeCookie("theme", dark ? "dark" : "light");
  }
}
