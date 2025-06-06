export enum GalleryState {
  IDLE = 0,
  SHOWING_CONTENT_ON_HOVER = 1,
  IN_GALLERY = 2
}

export type VideoClip = {
  start: number
  end: number
}

export interface AutoplayEvents {
  onEnable: () => void
  onDisable: () => void
  onPause: () => void
  onPlay: () => void
  onComplete: () => void
  onVideoEndedEarly: () => void
}

export interface Renderer {
  container: HTMLElement
  display: (element: HTMLElement) => void
  hide: () => void
  handlePageChange: () => void
  handlePageChangeInGallery: () => void
  preload: (elements: HTMLElement[]) => void
}

export type GalleryMenuButton = {
  id: string;
  icon: string;
  action: string;
  enabled: boolean;
  handler: string;
  hint: string;
  color: string;
};
