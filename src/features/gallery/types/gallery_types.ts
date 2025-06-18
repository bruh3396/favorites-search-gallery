export enum GalleryState {
  IDLE = 0,
  SHOWING_CONTENT_ON_HOVER = 1,
  IN_GALLERY = 2
}

export type VideoClip = {
  start: number
  end: number
}

export interface Renderer {
  container: HTMLElement
  display: (element: HTMLElement) => void
  hide: () => void
  handlePageChange: () => void
  handlePageChangeInGallery: () => void
  preload: (elements: HTMLElement[]) => void
}

export type GalleryMenuAction = "exit" | "fullscreen" | "openPost" | "openOriginal" | "download" | "addFavorite" | "removeFavorite" | "toggleDockPosition" | "toggleBackground" | "search" | "changeBackgroundColor" | "pin";

export type GalleryMenuButton = {
  id: string;
  icon: string;
  action: GalleryMenuAction;
  enabled: boolean;
  hint: string;
  color: string;
};
