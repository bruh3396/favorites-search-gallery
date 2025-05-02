import {FavoriteTags} from "./favorite_tags";
import {FavoritesDatabaseRecord} from "../../../../types/primitives/composites";
import {Post} from "../../../../types/api/post";

export interface Searchable {
  tags: Set<string>
}

export interface FavoriteElement {
  root: HTMLElement
  container: HTMLAnchorElement
  image: HTMLImageElement
  addOrRemoveButton: HTMLImageElement
  downloadButton: HTMLImageElement
  thumbURL: string
}

export interface Favorite extends Searchable {
  id: string
  databaseRecord: FavoritesDatabaseRecord
  post: Post
  favoriteTags: FavoriteTags
  root: HTMLElement
  element: FavoriteElement | null
  thumbURL: string
}
