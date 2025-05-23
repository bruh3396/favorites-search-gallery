import { FavoritesDatabaseRecord } from "../../../../types/primitives/composites";
import { Rating } from "../../../../types/primitives/primitives";
import { SearchableWithMetrics } from "../../../../types/interfaces/interfaces";

export interface FavoriteElement {
  root: HTMLElement
  container: HTMLAnchorElement
  image: HTMLImageElement
  addOrRemoveButton: HTMLImageElement
  downloadButton: HTMLImageElement
  thumbURL: string
}

export interface Favorite extends SearchableWithMetrics {
  id: string
  root: HTMLElement
  thumbURL: string
  databaseRecord: FavoritesDatabaseRecord
  withinRating: (rating: Rating) => boolean
}
