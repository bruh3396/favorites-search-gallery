export interface FavoriteElement {
  root: HTMLElement
  container: HTMLAnchorElement
  image: HTMLImageElement
  favoriteButton: HTMLImageElement
  downloadButton: HTMLImageElement
  thumbURL: string
}
export type FavoritesPageRelation = "first" | "previous" | "next" | "final";
