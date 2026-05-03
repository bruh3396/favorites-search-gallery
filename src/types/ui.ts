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
export type LayoutMode = "row" | "square" | "grid" | "column" | "native"
export type ImageCursor = "zoom-in" | "zoom-out" | "auto"
export type SkeletonAnimation = "pulse" | "shine"
export enum PerformanceProfile {
  NORMAL = 0,
  MEDIUM = 3,
  LOW = 1,
  POTATO = 2
}
