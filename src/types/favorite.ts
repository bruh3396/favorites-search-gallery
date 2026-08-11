import { MetadataMetric, Rating, Searchable } from "@/types/search";
import { Post } from "@/types/api";

export type FavoriteMetricMap = {
  [key in MetadataMetric]: number
}

export type SerializedFavoriteMetadata = {
  width: number
  height: number
  score: number
  rating: number
  create: number
  change: number
  duration: number | undefined
}

export type SerializedFavorite = {
  id: string
  tags: string | Set<string>
  src: string
  metadata: SerializedFavoriteMetadata
}

export interface Favorite extends Searchable {
  id: string
  root: HTMLElement
  thumbUrl: string
  serialized: SerializedFavorite
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
export const FavoritesDrawerViewNames = ["settings", "snippets", "tags", "download", "change", "help"] as const;
export type FavoritesDrawerView = (typeof FavoritesDrawerViewNames)[number];
export type FavoritesDrawerViewContent = {
  mount?: (panel: HTMLElement) => void;
  actions?: HTMLElement[];
};
export type FavoritesDrawerViewMap = Partial<Record<FavoritesDrawerView, FavoritesDrawerViewContent>>;
