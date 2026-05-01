import * as FavoritesSearchEngine from "../model/search/favorites_search_engine";
import { Favorite, FavoriteMetricMap, FavoritesDatabaseRecord } from "../../../types/favorite";
import { clearPost, createPost } from "./favorite_post_factory";
import { FavoriteElement } from "./favorite_element";
import { FavoriteMetadata } from "./favorite_metadata";
import { FavoriteTags } from "./favorite_tags";
import { Post } from "../../../types/post";
import { Rating } from "../../../types/search";
import { compressPreviewSource } from "../../../lib/server/url/media_url_transformer";
import { getIdFromThumb } from "../../../lib/dom/thumb";

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
    FavoritesSearchEngine.addItem(favorite);
  }
}

export class FavoriteItem implements Favorite {
  public id: string;
  private post: Post;
  private element: FavoriteElement | null;
  private favoriteTags: FavoriteTags;
  private metadata: FavoriteMetadata;

  constructor(object: HTMLElement | FavoritesDatabaseRecord) {
    this.id = object instanceof HTMLElement ? getIdFromThumb(object) : object.id;
    this.post = createPost(object);
    this.element = null;
    this.favoriteTags = new FavoriteTags(this.post, object);
    registerFavorite(this);
    this.metadata = new FavoriteMetadata(this.id, object);
  }

  public get tags(): Set<string> {
    return this.favoriteTags.tags;
  }

  public get root(): HTMLElement {
    if (this.element === null) {
      this.post.tags = this.favoriteTags.tagString;
      this.element = new FavoriteElement(this.post);
    }
    clearPost(this.post);
    return this.element.root;
  }

  public get thumbUrl(): string {
    return this.element === null ? this.post.previewURL : this.element.thumbUrl;
  }

  public get metrics(): FavoriteMetricMap {
    return this.metadata.metrics;
  }

  public get databaseRecord(): FavoritesDatabaseRecord {
    return {
      id: this.id,
      tags: this.tags,
      src: compressPreviewSource(this.thumbUrl),
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

  public processPost(post: Post): void {
    this.metadata.processPost(post);
  }

  public addAdditionalTags(newTags: string): string {
    FavoritesSearchEngine.removeItem(this);
    const result = this.favoriteTags.addAdditionalTags(newTags);

    FavoritesSearchEngine.addItem(this);
    return result;
  }

  public removeAdditionalTags(tagsToRemove: string): string {
    FavoritesSearchEngine.removeItem(this);
    const result = this.favoriteTags.removeAdditionalTags(tagsToRemove);

    FavoritesSearchEngine.addItem(this);
    return result;
  }

  public resetAdditionalTags(): void {
    FavoritesSearchEngine.removeItem(this);
    this.favoriteTags.resetAdditionalTags();
    FavoritesSearchEngine.addItem(this);
  }

  private updateTags(tags: string): void {
    FavoritesSearchEngine.removeItem(this);
    this.favoriteTags.update(tags);
    FavoritesSearchEngine.addItem(this);
  }
}
