export type Feature = "app" | "favorites" | "gallery" | "postOverlay" | "postList" | "savedSearches" | "tooltip" | "autocomplete";
export type FeatureNamespaced = Partial<Record<Feature, object>>;

export type PerformanceProfile = "normal" | "medium" | "low" | "potato";
export type Theme = "native-dark" | "native-light" | "midnight" | "ember" | "venom" | "zeal" | "frozen-cobalt";
export type Layout = "row" | "square" | "grid" | "column" | "native";
export type HighlightStyle = "glow" | "trace" | "border" | "hidden" | "none";

export type GalleryMenuAction = "exit" |
  "fullscreen" | "openPost" | "openOriginal" |
  "download" | "addFavorite" | "removeFavorite" |
  "toggleDockPosition" | "toggleBackground" | "search" |
  "changeBackgroundColor" | "pin" | "none";

export type GalleryState = "idle" | "preview" | "open";
export type FavoritesDrawerTab = "settings" | "saved" | "tags" | "download" | "change" | "help";
export type PostOverlayMode = "tag";
