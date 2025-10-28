import { MetadataMetric, Post, Rating, Searchable } from "./common_types";

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
  deleted: boolean
};

export type FavoritesDatabaseRecord = {
  id: string;
  tags: Set<string>;
  src: string;
  metadata: FavoritesMetadataDatabaseRecord;
};

export interface Favorite extends Searchable {
  id: string
  root: HTMLElement
  thumbURL: string
  databaseRecord: FavoritesDatabaseRecord
  withinRating: (rating: Rating) => boolean
  swapFavoriteButton: () => void
  validateTags: (post: Post) => void
  addAdditionalTags: (newTags: string) => string
  removeAdditionalTags: (tagsToRemove: string) => string
  resetAdditionalTags: () => void
  metrics: FavoriteMetricMap
}

export enum AddFavoriteStatus {
  ERROR = 0,
  ALREADY_ADDED = 1,
  NOT_LOGGED_IN = 2,
  SUCCESSFULLY_ADDED = 3
}

export enum RemoveFavoriteStatus {
  ERROR = 0,
  FORBIDDEN = 1,
  SUCCESSFULLY_REMOVED = 2
}
