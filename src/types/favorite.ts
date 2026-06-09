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

export type AddFavoriteStatus = "error" | "alreadyAdded" | "loggedOut" | "success"

export type RemoveFavoriteStatus = "error" | "forbidden" | "success"
