import {Post} from "../../../../types/api/post";

export interface Searchable {
  tags: Set<string>
}

export interface FavoriteElementI {
    root: HTMLElement
    container: HTMLAnchorElement
    image: HTMLImageElement
    addOrRemoveButton: HTMLImageElement
    downloadButton: HTMLImageElement
    thumbURL: string
}

export interface FavoriteI extends Searchable {
  id: string
  post: Post
  element: FavoriteElementI | null
}
