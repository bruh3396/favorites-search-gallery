import {MediaExtension, TagCategory} from "./primitives";

interface IUpscaleRequest {
  id: string
  action: string
  hasDimensions: boolean
  offscreenCanvas: OffscreenCanvas | null
  imageBitmap: ImageBitmap | null
  imageURL: string
  readonly transferable: OffscreenCanvas[]
}

export type MediaExtensionMapping = {
  id: string
  extension: MediaExtension
}
export type FavoritesDatabaseMetadataRecord = {
  width: number
  height: number
  score: number
  rating: number
  create: number
  change: number
  deleted: boolean
}
export type FavoritesDatabaseRecord = {
  id: string
  tags: string
  src: string
  metadata: string
}
export type TagModificationDatabaseRecord = {
  id: string
  tags: string
}
export type WorkerMessage = {
  action: string
}
export type UpscaleMessage =
  (IUpscaleRequest | { requests: IUpscaleRequest[] } | { width: number, maxHeight: number })
  & WorkerMessage
export type AliasMap = Record<string, Set<string>>
export type NumberRange = {
  min: number
  max: number
}

export type TagCategoryMapping = {
  id: string
  category: TagCategory
}

export type RatingElement = {
  input: HTMLInputElement
  label: HTMLLabelElement
}
export type APIThumb = {
  // apiPost: APIPost
  thumb: HTMLElement
}
export type AwesompleteSuggestion = {
  label: string
  value: string
  type: string
}

export type Dimensions2D = {
  width: number
  height: number
}
