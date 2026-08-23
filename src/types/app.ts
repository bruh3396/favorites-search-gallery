export type Feature = "app" | "favorites" | "gallery" | "postOverlay" | "postList" | "tooltip";
export type PerformanceProfile = "normal" | "medium" | "low" | "potato";
export type Layout = "row" | "square" | "grid" | "column" | "native";
export type GalleryState = "idle" | "preview" | "open";
export type PostOverlayMode = "tag";

export type GalleryMenuAction =
  | "exit"
  | "fullscreen"
  | "openPost"
  | "openOriginal"
  | "download"
  | "addFavorite"
  | "removeFavorite"
  | "toggleDockPosition"
  | "toggleBackground"
  | "search"
  | "pin"
  | "none";

export type FeatureNamespace = Partial<Record<Feature, object>>;

export type MapToString<T extends readonly unknown[]> = { readonly [K in keyof T]: string };

export type Identifiable = { id: string };
