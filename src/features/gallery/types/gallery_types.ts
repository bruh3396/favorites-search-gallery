import { GalleryMenuAction } from "@/types/app";

export interface GalleryRenderer {
  root: HTMLElement
  render: (thumb: HTMLElement) => void
  hide: () => void
  cache: (thumbs: HTMLElement[]) => Promise<void> | void
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
}
