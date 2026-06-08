import { MetadataMetric, Rating, Searchable } from "@/types/search";
import { Post } from "@/types/api";

export type FavoriteMetricMap = {
  [key in MetadataMetric]: number
}

export type FavoritesMetadataDatabaseRecord = {
  width: number
  height: number
  score: number
  rating: number
  create: number
  change: number
  duration: number | undefined
}

export type FavoritesDatabaseRecord = {
  id: string
  tags: Set<string>
  src: string
  metadata: FavoritesMetadataDatabaseRecord;
}

export interface Favorite extends Searchable {
  id: string
  root: HTMLElement
  thumbUrl: string
  databaseRecord: FavoritesDatabaseRecord
  withinRating: (rating: Rating) => boolean
  swapFavoriteButton: () => void
  updateTags: (post: Post) => void
  addAdditionalTags: (newTags: string) => string
  removeAdditionalTags: (tagsToRemove: string) => string
  resetAdditionalTags: () => void
  populateMetadata: (post: Post) => void
  metrics: FavoriteMetricMap
}

export enum AddFavoriteStatus {
  Error = 0,
  AlreadyAdded = 1,
  LoggedOut = 2,
  Success = 3
}

export enum RemoveFavoriteStatus {
  Error = 0,
  Forbidden = 1,
  Success = 2
}
