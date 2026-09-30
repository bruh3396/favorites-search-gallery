import { setDataset, toggleDataset } from "@/utils/browser/dataset";
import { ColorScheme } from "@/core/boundary/environment";
import { Theme } from "@/lib/ui/theme/themes";
import { macroTask } from "@/lib/async/scheduling";

export async function applyTheme(theme: Theme, colorScheme: ColorScheme): Promise<void> {
  await macroTask();
  setDataset(document.documentElement, "theme", colorScheme === "dark" ? `${theme}-dark` : theme);
}

export function toggleGradient(enabled: boolean): void {
  toggleDataset(document.documentElement, "gradient", enabled);
}
