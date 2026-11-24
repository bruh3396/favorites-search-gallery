import { COLOR_SCHEMES, ColorScheme } from "@/core/boundary/environment/color_scheme";
import { LIGHTBOX_MODES, LightboxMode } from "@/core/features/lightbox/lightbox_mode";
import { THEMES, Theme } from "@/core/ui/theme/theme";
import { AppPreferences } from "@/core/app/storage/app_preferences";
import { FAVORITES_GRID_LAYOUTS } from "@/core/app/favorites/settings/favorites_grid_layouts";
import { FAVORITES_SETTING_RANGES } from "@/core/app/favorites/settings/favorites_setting_ranges";
import { GridLayout } from "@/core/ui/post_grid/layout/grid_layout";
import { Icon } from "@/core/ui/components/icon/icon";
import { SettingDescriptor } from "@/core/ui/settings/setting_descriptor";
import { SettingsLayout } from "@/core/ui/settings/settings_layout";
import { SettingsScreen } from "@/core/ui/settings/settings_screen";
import { SharedPreferences } from "@/core/app/storage/shared_preferences";
import { StepperScheduler } from "@/core/ui/components/stepper/stepper";
import { computed } from "@/core/utils/reactive/signal";
import { h } from "@/core/ui/h/h";

export interface FavoritesSettingsProps {
  favoritesPreferences: Pick<AppPreferences["favorites"], "grid" | "lightbox" | "nativeHeaderVisible" | "pagination">;
  sharedPreferences: SharedPreferences;
  onThemePreview: (theme: Theme | null) => void;
  stepperScheduler: StepperScheduler;
}

const LAYOUT: SettingsLayout = [
  { id: "general", title: "General", settings: ["lightboxMode", "postListEnabled"] },
  { id: "appearance", title: "Appearance", settings: ["theme", "colorScheme", "nativeHeaderVisible"] },
  { id: "grid", title: "Grid", settings: ["layout", "tileSize", "hdTilesEnabled"] },
  { id: "pages", title: "Pages", settings: ["pageSize", "infiniteScroll"] }
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

function createDescriptors({ favoritesPreferences, sharedPreferences, onThemePreview, stepperScheduler }: FavoritesSettingsProps): SettingDescriptor[] {
  return [
    {
      id: "postListEnabled", kind: "switch", label: "Enhanced Posts Page",
      settingPreference: sharedPreferences.postListEnabled
    },
    {
      id: "lightboxMode", kind: "choice", label: "Gallery", control: "segmented",
      settingPreference: favoritesPreferences.lightbox.mode, members: LIGHTBOX_MODES, labels: LIGHTBOX_MODE_LABELS
    },
    {
      id: "theme", kind: "choice", label: "Theme", control: "dropdown",
      settingPreference: sharedPreferences.theme, members: THEMES, labels: THEME_LABELS, onPreview: onThemePreview
    },
    {
      id: "colorScheme", kind: "choice", label: "Color Scheme", control: "segmented",
      settingPreference: sharedPreferences.colorScheme, members: COLOR_SCHEMES, labels: COLOR_SCHEME_LABELS, icons: COLOR_SCHEME_ICONS
    },
    {
      id: "nativeHeaderVisible", kind: "switch", label: "Header",
      settingPreference: favoritesPreferences.nativeHeaderVisible
    },
    {
      id: "hdTilesEnabled", kind: "switch", label: "HD",
      settingPreference: favoritesPreferences.grid.hdTilesEnabled
    },
    {
      id: "layout", kind: "choice", label: "Layout", control: "segmented",
      settingPreference: favoritesPreferences.grid.layout, members: FAVORITES_GRID_LAYOUTS, labels: LAYOUT_LABELS, icons: LAYOUT_ICONS
    },
    {
      id: "tileSize", kind: "slider", label: "Tile Size",
      settingPreference: favoritesPreferences.grid.columnCount, ...FAVORITES_SETTING_RANGES.columnCount, inverted: true,
      disabled: computed(() => favoritesPreferences.grid.layout.value === "native")
    },
    {
      id: "pageSize", kind: "number", label: "Page Size",
      settingPreference: favoritesPreferences.pagination.pageSize, ...FAVORITES_SETTING_RANGES.pageSize, stepperScheduler,
      disabled: favoritesPreferences.pagination.infiniteScroll
    },
    {
      id: "infiniteScroll", kind: "switch", label: "Infinite Scroll",
      settingPreference: favoritesPreferences.pagination.infiniteScroll
    }
  ];
}
