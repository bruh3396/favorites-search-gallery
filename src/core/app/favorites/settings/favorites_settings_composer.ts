import { FavoritesSettings, FavoritesSettingsProps } from "@/core/app/favorites/settings/favorites_settings";
import { FAVORITES_SETTINGS_TOOL } from "@/core/app/favorites/settings/favorites_settings_tool";
import { ViewPane } from "@/core/ui/components/view_pane/view_pane";
import { h } from "@/core/ui/h/h";

export interface FavoritesSettingsDependencies {
  favoritesPreferences: FavoritesSettingsProps["favoritesPreferences"];
  sharedPreferences: FavoritesSettingsProps["sharedPreferences"];
  stepperScheduler: FavoritesSettingsProps["stepperScheduler"];
  onThemePreview: FavoritesSettingsProps["onThemePreview"];
  resetSettings: () => void;
}

export function composeFavoritesSettings(dependencies: FavoritesSettingsDependencies): HTMLElement {
  const { favoritesPreferences, sharedPreferences, stepperScheduler, onThemePreview, resetSettings } = dependencies;
  return h(
    ViewPane,
    { title: FAVORITES_SETTINGS_TOOL.label, actions: [{ label: "Reset Settings", icon: "reset", onClick: resetSettings }] },
    h(FavoritesSettings, { favoritesPreferences, sharedPreferences, stepperScheduler, onThemePreview })
  );
}
