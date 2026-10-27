import { AppPreferences } from "@/core/app/app_storage_schema";
import { COLOR_SCHEMES, ColorScheme } from "@/core/boundary/environment";
import { SharedPreferences } from "@/core/app/shared_preferences";
import { LIGHTBOX_MODES, LightboxMode } from "@/core/features/lightbox/lightbox_mode";
import { SettingsLayout } from "@/core/ui/settings/settings_layout";
import { SettingsScreen } from "@/core/ui/settings/settings_screen";
import { THEMES, Theme } from "@/core/ui/theme/theme";
import { GridLayout } from "@/core/ui/post_grid/grid_layout";
import { Icon } from "@/core/ui/components/icon/icon";
import { SettingDescriptor } from "@/core/ui/settings/setting_descriptor";
import { StepperScheduler } from "@/core/ui/components/stepper/stepper";
import { computed } from "@/core/utils/reactive/signal";
import { h } from "@/core/ui/h/h";

export interface FavoritesSettingsProps {
  favoritesPreferences: Pick<AppPreferences["favorites"], "grid" | "lightbox" | "nativeHeaderVisible" | "pagination">;
  sharedPreferences: SharedPreferences;
  onThemePreview: (theme: Theme | null) => void;
  scheduler: StepperScheduler;
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
const LIGHTBOX_MODE_LABELS: Readonly<Record<LightboxMode, string>> = { off: "Off", simple: "Simple", full: "Full" };
const LAYOUTS: readonly GridLayout[] = ["column", "row", "square", "native"];
const LAYOUT_LABELS: Readonly<Record<GridLayout, string>> = { row: "Row", square: "Square", grid: "Grid", column: "Column", native: "Native" };
const LAYOUT_ICONS: Readonly<Record<GridLayout, Icon>> = {
  row: "layoutRow", square: "layoutSquare", grid: "layoutGrid", column: "layoutColumn", native: "layoutNative"
};

export function FavoritesSettings({ scheduler, ...props }: FavoritesSettingsProps): HTMLElement {
  return <SettingsScreen layout={LAYOUT} descriptors={createDescriptors(props)} size="small" scheduler={scheduler} />;
}

function createDescriptors({
  favoritesPreferences, sharedPreferences, onThemePreview
}: Omit<FavoritesSettingsProps, "scheduler">): SettingDescriptor[] {
  return [
    {
      id: "postListEnabled", kind: "switch", label: "Enhance search pages", keywords: ["post list", "search"],
      preference: sharedPreferences.postListEnabled
    },
    {
      id: "lightboxMode", kind: "choice", label: "Gallery", keywords: ["lightbox", "viewer", "click", "simple", "zoom"], control: "segmented",
      preference: favoritesPreferences.lightbox.mode, members: LIGHTBOX_MODES, labels: LIGHTBOX_MODE_LABELS
    },
    {
      id: "theme", kind: "choice", label: "Theme", keywords: ["colors", "palette", "accent"], control: "dropdown",
      preference: sharedPreferences.theme, members: THEMES, labels: THEME_LABELS, onPreview: onThemePreview
    },
    {
      id: "colorScheme", kind: "choice", label: "Color", keywords: ["color scheme", "theme", "dark", "light"], control: "segmented",
      preference: sharedPreferences.colorScheme, members: COLOR_SCHEMES, labels: COLOR_SCHEME_LABELS, icons: COLOR_SCHEME_ICONS
    },
    {
      id: "nativeHeaderVisible", kind: "switch", label: "Header", keywords: ["site header", "native header", "navigation"],
      preference: favoritesPreferences.nativeHeaderVisible
    },
    {
      id: "hdTilesEnabled", kind: "switch", label: "HD", keywords: ["hd tiles", "thumbnails", "quality", "resolution", "full size"],
      preference: favoritesPreferences.grid.hdTilesEnabled
    },
    {
      id: "layout", kind: "choice", label: "Layout", keywords: ["grid", "arrangement"], control: "segmented",
      preference: favoritesPreferences.grid.layout, members: LAYOUTS, labels: LAYOUT_LABELS, icons: LAYOUT_ICONS
    },
    {
      id: "tileSize", kind: "slider", label: "Size", keywords: ["tile size", "tiles per row", "columns", "zoom", "grid"],
      preference: favoritesPreferences.grid.columnCount, min: 1, max: 16, step: 1, inverted: true,
      disabled: computed(() => favoritesPreferences.grid.layout.value === "native")
    },
    {
      id: "pageSize", kind: "number", label: "Size", keywords: ["results per page", "count", "pagination"],
      preference: favoritesPreferences.pagination.pageSize, min: 1, max: 5_000, step: 25,
      disabled: favoritesPreferences.pagination.infiniteScroll
    },
    { id: "infiniteScroll", kind: "switch", label: "Infinite scroll", keywords: ["pagination", "scroll"], preference: favoritesPreferences.pagination.infiniteScroll }
  ];
}
