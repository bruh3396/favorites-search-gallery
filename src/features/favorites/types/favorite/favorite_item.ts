import { clearPost, createPostFromRawFavorite } from "./favorite_type_utils";
import { Favorite } from "./favorite_types";
import { FavoriteHTMLElement } from "./favorite_element";
import { FavoriteMetadata } from "../metadata/favorite_metadata";
import { FavoriteMetricMap } from "../../../../types/interfaces/interfaces";
import { FavoriteTags } from "./favorite_tags";
import { FavoritesDatabaseRecord } from "../../../../types/primitives/composites";
import { Post } from "../../../../types/api/post";
import { Rating } from "../../../../types/primitives/primitives";
import { compressThumbSource } from "../../../../utils/content/url";
import { getIdFromThumb } from "../../../../utils/dom/dom";

const ALL_FAVORITES = new Map<string, FavoriteItem>();

export function getFavorite(id: string): FavoriteItem | undefined {
  return ALL_FAVORITES.get(id);
}

export function getAllFavorites(): FavoriteItem[] {
  return Array.from(ALL_FAVORITES.values());
}

export function addInstanceToAllFavorites(favorite: FavoriteItem): void {
  if (!ALL_FAVORITES.has(favorite.id)) {
    ALL_FAVORITES.set(favorite.id, favorite);
  }
}

export function validateTags(post: Post): void {
  const favorite = getFavorite(post.id);

  if (favorite !== undefined) {
    favorite.validateTags(post);
  }
}

export class FavoriteItem implements Favorite {
  public id: string;
  private post: Post;
  private element: FavoriteHTMLElement | null;
  private favoriteTags: FavoriteTags;
  private metadata: FavoriteMetadata;

  constructor(object: HTMLElement | FavoritesDatabaseRecord) {
    this.id = object instanceof HTMLElement ? getIdFromThumb(object) : object.id;
    this.post = createPostFromRawFavorite(object);
    this.element = null;
    this.favoriteTags = new FavoriteTags(this.post, object);
    this.metadata = new FavoriteMetadata(this.id, object);
    addInstanceToAllFavorites(this);
  }

  public get tags(): Set<string> {
    return this.favoriteTags.tags;
  }

  public get root(): HTMLElement {
    if (this.element === null) {
      this.post.tags = this.favoriteTags.tagString;
      this.element = new FavoriteHTMLElement(this.post);
    }
    clearPost(this.post);
    return this.element.root;
  }

  public get thumbURL(): string {
    return this.element === null ? this.post.previewURL : this.element.thumbURL;
  }

  public get metrics(): FavoriteMetricMap {
    return this.metadata.metrics;
  }

  public get databaseRecord(): FavoritesDatabaseRecord {
    return {
      id: this.id,
      tags: this.tags,
      src: compressThumbSource(this.thumbURL),
      metadata: this.metadata.databaseRecord
    };
  }

  public withinRating(rating: Rating): boolean {
    // eslint-disable-next-line no-bitwise
    return (this.metadata.rating & rating) > 0;
  }

  public validateTags(post: Post): void {
    this.favoriteTags.validateTagsAgainstAPI(post);
  }
}
