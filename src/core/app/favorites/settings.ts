import { AppPreferences, FavoritesPreferences, LightboxPreferences } from "@/core/app/preferences";
import { COLOR_SCHEMES, ColorScheme } from "@/core/boundary/environment";
import { LIGHTBOX_MODES, LightboxMode } from "@/core/features/lightbox/mode";
import { THEMES, Theme } from "@/core/ui/theme/themes";
import { GridLayout } from "@/core/ui/post_grid/tiler";
import { Icon } from "@/core/ui/components/icon/icon";
import { Preference } from "@/core/utils/reactive/preference";
import { SettingDescriptor } from "@/core/ui/settings/descriptor";
import { SettingsLayout } from "@/core/ui/settings/screen";
import { computed } from "@/core/utils/reactive/signal";

export const FAVORITES_SETTINGS_LAYOUT: SettingsLayout = [
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
};const LIGHTBOX_MODE_LABELS: Readonly<Record<LightboxMode, string>> = { off: "Off", simple: "Simple", full: "Full" };
const LAYOUTS: readonly GridLayout[] = ["column", "row", "square", "native"];
const LAYOUT_LABELS: Readonly<Record<GridLayout, string>> = { row: "Row", square: "Square", grid: "Grid", column: "Column", native: "Native" };
const LAYOUT_ICONS: Readonly<Record<GridLayout, Icon>> = {
  row: "layoutRow", square: "layoutSquare", grid: "layoutGrid", column: "layoutColumn", native: "layoutNative"
};

export function createFavoritesSettings(
  preferences: FavoritesPreferences,
  appPreferences: AppPreferences,
  lightboxPreferences: LightboxPreferences,
  colorScheme: Preference<ColorScheme>,
  onThemePreview: (theme: Theme | null) => void
): SettingDescriptor[] {
  return [
    {
      id: "postListEnabled", kind: "switch", label: "Enhance search pages", keywords: ["post list", "search"],
      preference: appPreferences.postListEnabled
    },
    {
      id: "lightboxMode", kind: "choice", label: "Gallery", keywords: ["lightbox", "viewer", "click", "simple", "zoom"], control: "segmented",
      preference: lightboxPreferences.mode, members: LIGHTBOX_MODES, labels: LIGHTBOX_MODE_LABELS
    },
    {
      id: "theme", kind: "choice", label: "Theme", keywords: ["colors", "palette", "accent"], control: "dropdown",
      preference: appPreferences.theme, members: THEMES, labels: THEME_LABELS, onPreview: onThemePreview
    },
    {
      id: "colorScheme", kind: "choice", label: "Color", keywords: ["color scheme", "theme", "dark", "light"], control: "segmented",
      preference: colorScheme, members: COLOR_SCHEMES, labels: COLOR_SCHEME_LABELS, icons: COLOR_SCHEME_ICONS
    },
    {
      id: "nativeHeaderVisible", kind: "switch", label: "Header", keywords: ["site header", "native header", "navigation"],
      preference: preferences.nativeHeaderVisible
    },
    {
      id: "hdTilesEnabled", kind: "switch", label: "HD", keywords: ["hd tiles", "thumbnails", "quality", "resolution", "full size"],
      preference: preferences.hdTilesEnabled
    },
    {
      id: "layout", kind: "choice", label: "Layout", keywords: ["grid", "arrangement"], control: "segmented",
      preference: preferences.layout, members: LAYOUTS, labels: LAYOUT_LABELS, icons: LAYOUT_ICONS
    },
    {
      id: "tileSize", kind: "slider", label: "Size", keywords: ["tile size", "tiles per row", "columns", "zoom", "grid"],
      preference: preferences.tilesPerRow, min: 1, max: 16, step: 1, inverted: true,
      disabled: computed(() => preferences.layout.value === "native")
    },
    {
      id: "pageSize", kind: "number", label: "Page size", keywords: ["results per page", "count", "pagination"],
      preference: preferences.pageSize, min: 1, max: 5_000, step: 25,
      disabled: preferences.infiniteScroll
    },
    { id: "infiniteScroll", kind: "switch", label: "Infinite scroll", keywords: ["pagination", "scroll"], preference: preferences.infiniteScroll }
  ];
}
