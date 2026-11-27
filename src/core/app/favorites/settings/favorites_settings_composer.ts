import { FavoritesSettings, FavoritesSettingsProps } from "@/core/app/favorites/settings/favorites_settings";
import { FAVORITES_TOOL_DEFINITIONS } from "@/core/app/favorites/favorites_tool";
import { ViewPane } from "@/core/ui/components/view_pane/view_pane";
import { h } from "@/core/ui/h/h";

export interface FavoritesSettingsDependencies {
  favoritesPreferences: FavoritesSettingsProps["favoritesPreferences"];
  sharedPreferences: FavoritesSettingsProps["sharedPreferences"];
  scheduler: FavoritesSettingsProps["scheduler"];
  onThemePreview: FavoritesSettingsProps["onThemePreview"];
  resetSettings: () => void;
}

export function composeFavoritesSettings(dependencies: FavoritesSettingsDependencies): HTMLElement {
  const { favoritesPreferences, sharedPreferences, scheduler, onThemePreview, resetSettings } = dependencies;
  return h(
    ViewPane,
    { title: FAVORITES_TOOL_DEFINITIONS.settings.label, actions: [{ label: "Reset Settings", icon: "rotateCcw", onClick: resetSettings }] },
    h(FavoritesSettings, { favoritesPreferences, sharedPreferences, scheduler, onThemePreview })
  );
}
