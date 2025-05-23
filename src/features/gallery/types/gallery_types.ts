import { ContentType } from "../../../types/primitives/primitives";

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
  render: (element: HTMLElement) => void
  render_: (element: HTMLElement) => void
  stopRender: () => void
  stopRender_: () => void
  handlePageChange: () => void
  handlePageChangeInGallery: () => void
  preload: (elements: HTMLElement[]) => void
}

export interface ImageRequestI {
  id: string
  bitmap: ImageBitmap | null
  abortController: AbortController
  cancelled: boolean
  contentType: ContentType
  isImage: boolean
  isAnimated: boolean
  isIncomplete: boolean
  hasCompleted: boolean
  isOriginalResolution: boolean
  isLowResolution: boolean
  thumb: HTMLElement
  megabytes: number
  accentColor: string | null
  complete: (bitmap: ImageBitmap) => void
  cancel: () => void
  close : () => void
}

export interface ThumbUpscaler {
  upscale: (request: ImageRequestI) => void
  upscaleBatch(requests: ImageRequestI[]): void
  setCanvasDimensionsFromImageBitmap(canvas: HTMLCanvasElement, imageBitmap: ImageBitmap): void
}
