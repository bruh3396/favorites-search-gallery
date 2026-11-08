import { COLOR_SCHEMES, ColorScheme } from "@/core/boundary/color_scheme";
import { LIGHTBOX_MODES, LightboxMode } from "@/core/features/lightbox/lightbox_mode";
import { THEMES, Theme } from "@/core/ui/theme/theme";
import { AppPreferences } from "@/core/app/app_preferences";
import { FAVORITES_GRID_LAYOUTS } from "@/core/app/favorites/settings/favorites_grid_layouts";
import { FAVORITES_SETTING_RANGES } from "@/core/app/favorites/settings/favorites_setting_ranges";
import { GridLayout } from "@/core/ui/post_grid/layout/grid_layout";
import { Icon } from "@/core/ui/components/icon/icon";
import { SettingDescriptor } from "@/core/ui/settings/setting_descriptor";
import { SettingsLayout } from "@/core/ui/settings/settings_layout";
import { SettingsScreen } from "@/core/ui/settings/settings_screen";
import { SharedPreferences } from "@/core/app/shared_preferences";
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
      id: "postListEnabled", kind: "switch", label: "Enhance Search Pages", keywords: ["post list", "search"],
      settingPreference: sharedPreferences.postListEnabled
    },
    {
      id: "lightboxMode", kind: "choice", label: "Gallery", keywords: ["lightbox", "viewer", "click", "simple", "zoom"], control: "segmented",
      settingPreference: favoritesPreferences.lightbox.mode, members: LIGHTBOX_MODES, labels: LIGHTBOX_MODE_LABELS
    },
    {
      id: "theme", kind: "choice", label: "Theme", keywords: ["colors", "palette", "accent"], control: "dropdown",
      settingPreference: sharedPreferences.theme, members: THEMES, labels: THEME_LABELS, onPreview: onThemePreview
    },
    {
      id: "colorScheme", kind: "choice", label: "Color Scheme", keywords: ["color", "theme", "dark", "light"], control: "segmented",
      settingPreference: sharedPreferences.colorScheme, members: COLOR_SCHEMES, labels: COLOR_SCHEME_LABELS, icons: COLOR_SCHEME_ICONS
    },
    {
      id: "nativeHeaderVisible", kind: "switch", label: "Header", keywords: ["site header", "native header", "navigation"],
      settingPreference: favoritesPreferences.nativeHeaderVisible
    },
    {
      id: "hdTilesEnabled", kind: "switch", label: "HD", keywords: ["hd tiles", "thumbnails", "quality", "resolution", "full size"],
      settingPreference: favoritesPreferences.grid.hdTilesEnabled
    },
    {
      id: "layout", kind: "choice", label: "Layout", keywords: ["grid", "arrangement"], control: "segmented",
      settingPreference: favoritesPreferences.grid.layout, members: FAVORITES_GRID_LAYOUTS, labels: LAYOUT_LABELS, icons: LAYOUT_ICONS
    },
    {
      id: "tileSize", kind: "slider", label: "Size", keywords: ["tile size", "tiles per row", "columns", "zoom", "grid"],
      settingPreference: favoritesPreferences.grid.columnCount, ...FAVORITES_SETTING_RANGES.columnCount, inverted: true,
      disabled: computed(() => favoritesPreferences.grid.layout.value === "native")
    },
    {
      id: "pageSize", kind: "number", label: "Size", keywords: ["results per page", "count", "pagination"],
      settingPreference: favoritesPreferences.pagination.pageSize, ...FAVORITES_SETTING_RANGES.pageSize, stepperScheduler,
      disabled: favoritesPreferences.pagination.infiniteScroll
    },
    {
      id: "infiniteScroll", kind: "switch", label: "Infinite Scroll", keywords: ["pagination", "scroll"],
      settingPreference: favoritesPreferences.pagination.infiniteScroll
    }
  ];
}
