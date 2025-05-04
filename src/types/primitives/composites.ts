import { MediaExtension, TagCategory } from "./primitives";
import { IUpscaleRequest } from "../interfaces/interfaces";

export type MediaExtensionMapping = {
  id: string
  extension: MediaExtension
}
export type FavoritesMetadataDatabaseRecord = {
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
  tags: Set<string>
  src: string
  metadata: FavoritesMetadataDatabaseRecord
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

export type AwesompleteSuggestion = {
  label: string
  value: string
  type: string
}

export type Dimensions2D = {
  width: number
  height: number
}
