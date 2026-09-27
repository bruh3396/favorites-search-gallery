export type Platform = "mobile" | "desktop";
export type Feature ="app" | "favorites" | "gallery" | "postOverlay" | "postList" | "tooltip";
export type PerformanceProfile = "normal" | "low" | "potato";
export type Layout = "row" | "square" | "grid" | "column" | "native";
export type GalleryState = "idle" | "preview" | "open";

export enum UpscaleQuality {
  Low = 0.5,
  Normal = 1,
  High = 2,
  Ultra = 4
}

export type QualityCutoff = {
  maxRatio: number;
  quality: UpscaleQuality;
};
export type PostOverlayMode = "tag";

export type GalleryAction =
  | "exit"
  | "fullscreen"
  | "openPost"
  | "openOriginal"
  | "download"
  | "addFavorite"
  | "removeFavorite"
  | "toggleDockPosition"
  | "toggleBackground"
  | "toggleMute"
  | "togglePause"
  | "search"
  | "pin"
  | "none";

export type FeatureNamespace = Partial<Record<Feature, object>>;

export type MapToString<T extends readonly unknown[]> = { readonly [K in keyof T]: string };

export type Identifiable = { id: string };
