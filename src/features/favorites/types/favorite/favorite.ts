import {FavoriteElement} from "./element";
import {FavoriteI} from "./interfaces";
import {FavoritesDatabaseRecord} from "../../../../types/primitives/composites";
import {Post} from "../../../../types/api/post";
import {createPostFromRawFavorite} from "./utils";
import {getIdFromThumb} from "../../../../utils/dom/dom";
const ALL_FAVORITES = new Map<string, Favorite>();

export function getFavorite(id: string): Favorite | undefined {
  return ALL_FAVORITES.get(id);
}

export function getAllFavorites(): Favorite[] {
  return Array.from(ALL_FAVORITES.values());
}

class Favorite implements FavoriteI {
  public id: string;
  public post: Post;
  public element: FavoriteElement;

  get tags(): Set<string> {
    return new Set<string>([]);
  }

  constructor(object: HTMLElement | FavoritesDatabaseRecord) {
    this.id = object instanceof HTMLElement ? getIdFromThumb(object) : object.id;
    this.post = createPostFromRawFavorite(object);
    this.element = new FavoriteElement(this.post);
  }
}
