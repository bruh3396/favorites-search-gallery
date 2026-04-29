export type GalleryMenuAction = "exit" |
  "fullscreen" | "openPost" | "openOriginal" |
  "download" | "addFavorite" | "removeFavorite" |
  "toggleDockPosition" | "toggleBackground" | "search" |
  "changeBackgroundColor" | "pin" | "none"
export type AwesompleteSuggestion = {
  label: string
  value: string
  type: string
}
export type LayoutMode = "row" | "square" | "grid" | "column" | "native"
export type ImageCursor = "zoom-in" | "zoom-out" | "auto"
export type SkeletonAnimation = "pulse" | "shine"
export enum PerformanceProfile {
  NORMAL = 0,
  MEDIUM = 3,
  LOW = 1,
  POTATO = 2
}
