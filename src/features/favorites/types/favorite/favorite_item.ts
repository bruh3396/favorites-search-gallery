import {clearPost, createPostFromRawFavorite} from "./favorite_type_utils";
import {FAVORITES_SEARCH_INDEX} from "../../model/search/index/favorites_search_index";
import {Favorite} from "./favorite_interfaces";
import {FavoriteHTMLElement} from "./favorite_element";
import {FavoriteTags} from "./favorite_tags";
import {FavoritesDatabaseRecord} from "../../../../types/primitives/composites";
import {Post} from "../../../../types/api/post";
import {compressThumbSource} from "../../../../utils/image/image";
import {convertToTagString} from "../../../../utils/primitive/string";
import {getIdFromThumb} from "../../../../utils/dom/dom";
const ALL_FAVORITES = new Map<string, FavoriteItem>();

export function getFavorite(id: string): FavoriteItem | undefined {
  return ALL_FAVORITES.get(id);
}

export function getAllFavorites(): FavoriteItem[] {
  return Array.from(ALL_FAVORITES.values());
}

export class FavoriteItem implements Favorite {
  public id: string;
  public post: Post;
  public element: FavoriteHTMLElement | null;
  public favoriteTags: FavoriteTags;

  get tags(): Set<string> {
    return this.favoriteTags.tags;
  }

  get root(): HTMLElement {
    if (this.element === null) {
      this.element = new FavoriteHTMLElement(this.post);
    }
    clearPost(this.post);
    return this.element.root;
  }

  get thumbURL(): string {
    return this.element === null ? this.post.previewURL : this.element.thumbURL;
  }

  get databaseRecord(): FavoritesDatabaseRecord {
    return {
      id: this.id,
      tags: convertToTagString(this.tags),
      src: compressThumbSource(this.thumbURL)
    };
  }

  constructor(object: HTMLElement | FavoritesDatabaseRecord) {
    this.id = object instanceof HTMLElement ? getIdFromThumb(object) : object.id;
    this.post = createPostFromRawFavorite(object);
    this.element = null;
    this.favoriteTags = new FavoriteTags(this.post);
    FAVORITES_SEARCH_INDEX.add(this);
  }
}
