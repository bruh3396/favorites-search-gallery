import { MetadataMetric, Rating } from "../primitives/primitives";
import { FavoritesDatabaseRecord } from "../primitives/composites";
import { Post } from "../api/api_types";

export interface Searchable {
  tags: Set<string>
}

export type FavoriteMetricMap = {
  [key in MetadataMetric]: number;
}

export interface SearchableWithMetrics extends Searchable {
  metrics: FavoriteMetricMap
}

export interface IUpscaleRequest {
  id: string
  action: string
  hasDimensions: boolean
  offscreenCanvas: OffscreenCanvas | null
  imageBitmap: ImageBitmap | null
  imageURL: string
  readonly transferable: OffscreenCanvas[]
}
export interface Favorite extends SearchableWithMetrics {
  id: string;
  root: HTMLElement;
  thumbURL: string;
  databaseRecord: FavoritesDatabaseRecord;
  withinRating: (rating: Rating) => boolean;
  swapFavoriteButton: () => void;
  validateTags: (post: Post) => void;
  addAdditionalTags: (newTags: string) => string
  removeAdditionalTags: (tagsToRemove: string) => string
  resetAdditionalTags: () => void
}
