export type Feature = "app" | "favorites" | "gallery" | "postOverlay" | "postList" | "tooltip" | "autocomplete";
export type FeatureNamespaced = Partial<Record<Feature, object>>;

export type PerformanceProfile = "normal" | "medium" | "low" | "potato";
export type Layout = "row" | "square" | "grid" | "column" | "native";
export type HighlightStyle = "glow" | "trace" | "border" | "hidden" | "none";

export type GalleryMenuAction = "exit" |
  "fullscreen" | "openPost" | "openOriginal" |
  "download" | "addFavorite" | "removeFavorite" |
  "toggleDockPosition" | "toggleBackground" | "search" |
  "changeBackgroundColor" | "pin" | "none";

export type GalleryState = "idle" | "preview" | "open";
export type PostOverlayMode = "tag";
export type MapToString<T extends readonly unknown[]> = { readonly [K in keyof T]: string };
export type Identifiable = { id: string };
