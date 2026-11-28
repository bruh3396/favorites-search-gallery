import { COLOR_SCHEMES, ColorScheme } from "@/core/boundary/environment/color_scheme";
import { LIGHTBOX_MODES, LightboxMode } from "@/core/features/lightbox/lightbox_mode";
import { SettingsScreen, SettingsScreenProps } from "@/core/ui/settings/settings_screen";
import { THEMES, Theme } from "@/core/ui/theme/theme";
import { AppPreferences } from "@/core/app/storage/app_preferences";
import { FAVORITES_GRID_LAYOUTS } from "@/core/app/favorites/settings/favorites_grid_layouts";
import { FAVORITES_SETTING_RANGES } from "@/core/app/favorites/settings/favorites_setting_ranges";
import { GridLayout } from "@/core/ui/post_grid/layout/grid_layout";
import { Icon } from "@/core/ui/components/icon/icon";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { SettingDescriptor } from "@/core/ui/settings/setting_descriptor";
import { SharedPreferences } from "@/core/app/storage/shared_preferences";
import { computed } from "@/core/utils/reactive/signal";
import { h } from "@/core/ui/h/h";

export interface FavoritesSettingsProps {
  favoritesPreferences: Pick<AppPreferences["favorites"], "grid" | "lightbox" | "nativeHeaderVisible" | "pagination">;
  sharedPreferences: SharedPreferences;
  onThemePreview: (theme: Theme | null) => void;
  scheduler: Pick<Scheduler, "schedule">;
}

type FavoritesSetting =
  | "postListEnabled" | "lightboxMode" | "theme" | "colorScheme" | "nativeHeaderVisible"
  | "hdTilesEnabled" | "layout" | "tileSize" | "pageSize" | "infiniteScroll";

const LAYOUT: SettingsScreenProps<FavoritesSetting>["settingsLayout"] = [
  { title: "General", settingIds: ["lightboxMode", "postListEnabled"] },
  { title: "Appearance", settingIds: ["theme", "colorScheme", "nativeHeaderVisible"] },
  { title: "Grid", settingIds: ["layout", "tileSize", "hdTilesEnabled"] },
  { title: "Pages", settingIds: ["pageSize", "infiniteScroll"] }
];

const COLOR_SCHEME_LABELS: Readonly<Record<ColorScheme, string>> = { light: "Light", dark: "Dark" };
const COLOR_SCHEME_ICONS: Readonly<Record<ColorScheme, Icon>> = { light: "sun", dark: "moon" };
const THEME_LABELS: Readonly<Record<Theme, string>> = {
  rule34: "Rule34", cherry: "Cherry", cirrus: "Cirrus", dusk: "Dusk", ember: "Ember", forest: "Forest",
  frost: "Frost", ink: "Ink", parchment: "Parchment", slate: "Slate", venom: "Venom", zeal: "Zeal"
};
const LIGHTBOX_MODE_LABELS: Readonly<Record<LightboxMode, string>> = { off: "Off", simple: "Reduced", full: "Full" };
const LAYOUT_LABELS: Readonly<Record<GridLayout, string>> = { row: "Row", square: "Square", grid: "Grid", column: "Column", native: "Native" };
const LAYOUT_ICONS: Readonly<Record<GridLayout, Icon>> = {
  row: "layoutRow", square: "layoutSquare", grid: "layoutGrid", column: "layoutColumn", native: "layoutNative"
};

export function FavoritesSettings(props: FavoritesSettingsProps): HTMLElement {
  return <SettingsScreen settingsLayout={LAYOUT} settingDescriptors={createDescriptors(props)} controlSize="small" />;
}

function createDescriptors({
  favoritesPreferences, sharedPreferences, onThemePreview, scheduler
}: FavoritesSettingsProps): Record<FavoritesSetting, SettingDescriptor> {
  return {
    postListEnabled: {
      kind: "switch", label: "Enhanced Posts Page",
      settingPreference: sharedPreferences.postListEnabled
    },
    lightboxMode: {
      kind: "choice", label: "Gallery", control: "segmented",
      settingPreference: favoritesPreferences.lightbox.mode, members: LIGHTBOX_MODES, labels: LIGHTBOX_MODE_LABELS
    },
    theme: {
      kind: "choice", label: "Theme", control: "dropdown",
      settingPreference: sharedPreferences.theme, members: THEMES, labels: THEME_LABELS, onPreview: onThemePreview
    },
    colorScheme: {
      kind: "choice", label: "Color Scheme", control: "segmented",
      settingPreference: sharedPreferences.colorScheme, members: COLOR_SCHEMES, labels: COLOR_SCHEME_LABELS, icons: COLOR_SCHEME_ICONS
    },
    nativeHeaderVisible: {
      kind: "switch", label: "Header",
      settingPreference: favoritesPreferences.nativeHeaderVisible
    },
    hdTilesEnabled: {
      kind: "switch", label: "HD",
      settingPreference: favoritesPreferences.grid.hdTilesEnabled
    },
    layout: {
      kind: "choice", label: "Layout", control: "segmented",
      settingPreference: favoritesPreferences.grid.layout, members: FAVORITES_GRID_LAYOUTS, labels: LAYOUT_LABELS, icons: LAYOUT_ICONS
    },
    tileSize: {
      kind: "slider", label: "Tile Size",
      settingPreference: favoritesPreferences.grid.columnCount, ...FAVORITES_SETTING_RANGES.columnCount, inverted: true,
      disabled: computed(() => favoritesPreferences.grid.layout.value === "native")
    },
    pageSize: {
      kind: "number", label: "Page Size",
      settingPreference: favoritesPreferences.pagination.pageSize, ...FAVORITES_SETTING_RANGES.pageSize, scheduler,
      disabled: favoritesPreferences.pagination.infiniteScroll
    },
    infiniteScroll: {
      kind: "switch", label: "Infinite Scroll",
      settingPreference: favoritesPreferences.pagination.infiniteScroll
    }
  };
}
