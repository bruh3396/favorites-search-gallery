import { MetadataMetric, Rating, Searchable } from "@/types/search";
import { Post } from "@/types/api";

export type FavoriteMetricMap = {
  [key in MetadataMetric]: number
}

export type FavoriteMetadataDatabaseRecord = {
  width: number
  height: number
  score: number
  rating: number
  create: number
  change: number
  duration: number | undefined
}

export type FavoriteDatabaseRecord = {
  id: string
  tags: string | Set<string>
  src: string
  metadata: FavoriteMetadataDatabaseRecord
}

export interface Favorite extends Searchable {
  id: string
  root: HTMLElement
  thumbUrl: string
  databaseRecord: FavoriteDatabaseRecord
  withinRating: (rating: Rating) => boolean
  updateTags: (post: Post) => void
  addAdditionalTags: (newTags: string) => string
  removeAdditionalTags: (tagsToRemove: string) => string
  resetAdditionalTags: () => void
  populateMetadata: (post: Post) => void
  metrics: FavoriteMetricMap
}

export type AddFavoriteStatus = "error" | "alreadyAdded" | "loggedOut" | "success"
export type RemoveFavoriteStatus = "error" | "forbidden" | "success"
