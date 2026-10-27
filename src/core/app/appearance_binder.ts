import { Readable, effect } from "@/core/utils/reactive/signal";
import { THEME_DEFINITIONS, Theme } from "@/core/ui/theme/theme";
import { SharedPreferences } from "@/core/app/shared_preferences";
import { applyTheme } from "@/core/ui/theme/theme_applier";

export function bindAppearance(
  appRoot: HTMLElement, sharedPreferences: Pick<SharedPreferences, "theme" | "colorScheme">, previewedTheme?: Readable<Theme | null>
): void {
  effect(() => {
    appRoot.style.colorScheme = sharedPreferences.colorScheme.value;
  });
  effect(() => applyTheme(appRoot, THEME_DEFINITIONS[previewedTheme?.value ?? sharedPreferences.theme.value]));
}
