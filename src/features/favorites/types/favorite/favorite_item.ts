import { Favorite, FavoriteMetricMap } from "../../../../types/interfaces/interfaces";
import { clearPost, createPostFromRawFavorite } from "./favorite_type_utils";
import { FAVORITES_SEARCH_INDEX } from "../../model/search/index/favorites_search_index";
import { FavoriteHTMLElement } from "./favorite_element";
import { FavoriteMetadata } from "../metadata/favorite_metadata";
import { FavoriteTags } from "./favorite_tags";
import { FavoritesDatabaseRecord } from "../../../../types/primitives/composites";
import { Post } from "../../../../types/api/api_types";
import { Rating } from "../../../../types/primitives/primitives";
import { compressPreviewSource } from "../../../../utils/content/url";
import { getIdFromThumb } from "../../../../utils/dom/dom";

const ALL_FAVORITES = new Map<string, FavoriteItem>();

export function getFavorite(id: string): FavoriteItem | undefined {
  return ALL_FAVORITES.get(id);
}

export function getAllFavorites(): FavoriteItem[] {
  return Array.from(ALL_FAVORITES.values());
}

export function validateTags(post: Post): void {
  const favorite = getFavorite(post.id);

  if (favorite !== undefined) {
    favorite.validateTags(post);
  }
}

function registerFavorite(favorite: FavoriteItem): void {
  if (!ALL_FAVORITES.has(favorite.id)) {
    ALL_FAVORITES.set(favorite.id, favorite);
    FAVORITES_SEARCH_INDEX.add(favorite);
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
    registerFavorite(this);
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
      src: compressPreviewSource(this.thumbURL),
      metadata: this.metadata.databaseRecord
    };
  }

  public withinRating(rating: Rating): boolean {
    // eslint-disable-next-line no-bitwise
    return (this.metadata.rating & rating) > 0;
  }

  public validateTags(post: Post): void {
    if (!this.favoriteTags.tagsAreEqual(post)) {
      this.updateTags(post.tags);
    }
  }

  public swapFavoriteButton(): void {
    if (this.element !== null) {
      this.element.swapFavoriteButton();
    }
  }

  public addAdditionalTags(newTags: string): string {
    FAVORITES_SEARCH_INDEX.remove(this);
    const result = this.favoriteTags.addAdditionalTags(newTags);

    FAVORITES_SEARCH_INDEX.add(this);
    return result;
  }

  public removeAdditionalTags(tagsToRemove: string): string {
    FAVORITES_SEARCH_INDEX.remove(this);
    const result = this.favoriteTags.removeAdditionalTags(tagsToRemove);

    FAVORITES_SEARCH_INDEX.add(this);
    return result;
  }

  public resetAdditionalTags(): void {
    FAVORITES_SEARCH_INDEX.remove(this);
    this.favoriteTags.resetAdditionalTags();
    FAVORITES_SEARCH_INDEX.add(this);
  }

  private updateTags(tags: string): void {
    FAVORITES_SEARCH_INDEX.remove(this);
    this.favoriteTags.update(tags);
    FAVORITES_SEARCH_INDEX.add(this);
  }
}
