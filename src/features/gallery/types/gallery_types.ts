import { GalleryMenuAction } from "@/types/ui";

export interface GalleryRenderer {
  root: HTMLElement
  render: (thumb: HTMLElement) => void
  clear: () => void
  softReset: () => void
  reset: () => void
  preload: (thumbs: HTMLElement[]) => Promise<void> | void
}

export enum GalleryState {
  Idle,
  Preview,
  Open
}

export type VideoClip = {
  start: number
  end: number
}

export interface GalleryViewCallbacks {
  onMenuAction: (action: GalleryMenuAction) => void
  onVideoEnded: () => void
  onVideoDoubleClicked: (event: MouseEvent) => void
}

export type GalleryMenuButton = {
  id: string
  icon: string
  action: GalleryMenuAction
  enabled: boolean
  tooltip: string
  color: string
  href?: string
};
