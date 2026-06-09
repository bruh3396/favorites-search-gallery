export interface DrawerPanelClasses {
  section: string;
  sectionTitle: string;
}

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

export interface AwesompleteInstance {
  input: HTMLTextAreaElement | HTMLInputElement
  list: AwesompleteSuggestion[]
  isOpened: boolean
  suggestions: AwesompleteSuggestion[]
  next(): void
  select(): void
}

export interface AwesompleteConstructor {
  $: {
    regExpEscape(s: string): string
    create(tag: string, attrs: Record<string, unknown>): HTMLElement
  }
  new(input: HTMLTextAreaElement | HTMLInputElement, options: Record<string, unknown>): AwesompleteInstance
  FILTER_STARTSWITH(value: string, input: string): boolean
}

export type PerformanceProfile = "normal" | "medium" | "low" | "potato";
export type Theme = "native-dark" | "native-light" | "midnight" | "ember" | "venom" | "zeal" | "frozen-cobalt";
export type Layout = "row" | "square" | "grid" | "column" | "native"

export type SkeletonAnimation = "pulse" | "shine"
export type FavoritesDrawerTab = "settings" | "saved" | "tags" | "download" | "change" | "help";
export type PaginationTerm = number | "ellipsis";
export type PaginationSequence = PaginationTerm[];

export type GalleryState = "idle" | "preview" | "open"
export type ImageCursor = "zoom-in" | "zoom-out" | "auto"

export type FavoriteIndicatorStyle = "border" | "dim" | "hidden" | "none";
export type GalleryFavoriteIndicatorStyle = "border" | "glow" | "none";

export type PostOverlayMode = "tag";
