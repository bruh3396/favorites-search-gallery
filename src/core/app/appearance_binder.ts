import { Readable, effect } from "@/core/utils/reactive/signal";
import { THEME_DEFINITIONS, Theme } from "@/core/ui/theme/theme";
import { HostPage } from "@/core/boundary/ports/host_page/host_page";
import { SharedPreferences } from "@/core/app/shared_preferences";
import { applyTheme } from "@/core/ui/theme/theme_applier";

export interface AppearanceBinderDependencies {
  sharedPreferences: Pick<SharedPreferences, "theme" | "colorScheme">;
  hostPage: Pick<HostPage, "setTheme">;
  previewedTheme?: Readable<Theme | null>;
}

export function bindAppearance(appRoot: HTMLElement, { sharedPreferences, hostPage, previewedTheme }: AppearanceBinderDependencies): void {
  effect(() => {
    appRoot.style.colorScheme = sharedPreferences.colorScheme.value;
  });
  effect(() => {
    const themeDefinition = THEME_DEFINITIONS[previewedTheme?.value ?? sharedPreferences.theme.value];

    applyTheme(appRoot, themeDefinition);
    hostPage.setTheme(themeDefinition);
  });
}
