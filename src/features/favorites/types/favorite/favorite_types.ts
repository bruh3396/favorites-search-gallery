import { FavoriteItem } from "./favorite_item";

export interface FavoriteElement {
  root: HTMLElement
  container: HTMLAnchorElement
  image: HTMLImageElement
  favoriteButton: HTMLImageElement
  downloadButton: HTMLImageElement
  thumbURL: string
}

export type FavoritesPageRelation = "first" | "previous" | "next" | "final";

export interface NewFavorites {
  newFavorites: FavoriteItem[]
  newSearchResults: FavoriteItem[]
  allSearchResults: FavoriteItem[]
}
