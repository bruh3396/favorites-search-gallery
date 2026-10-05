export const PERFORMANCE_PROFILES = ["normal", "low", "potato"] as const;
export type PerformanceProfile = (typeof PERFORMANCE_PROFILES)[number];
export const LAYOUTS = ["row", "square", "grid", "column", "native"] as const;
export type Layout = (typeof LAYOUTS)[number];
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
export const POST_OVERLAY_MODES = ["tag"] as const;
export type PostOverlayMode = (typeof POST_OVERLAY_MODES)[number];

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

export type MapToString<T extends readonly unknown[]> = { readonly [K in keyof T]: string };
