import { Favorite, FavoriteMetricMap, FavoritesDatabaseRecord } from "../../../types/favorite";
import { clearPost, createPost } from "./favorite_post_factory";
import { FavoriteElement } from "./favorite_element";
import { FavoriteMetadata } from "./favorite_metadata";
import { FavoriteTags } from "./favorite_tags";
import { Post } from "../../../types/post";
import { Rating } from "../../../types/search";
import { compressPreviewSource } from "../../../lib/server/url/media_url_transformer";
import { getIdFromThumb } from "../../../lib/dom/thumb";

export class FavoriteItem implements Favorite {
  public readonly id: string;
  public readonly metadata: FavoriteMetadata;
  private readonly post: Post;
  private readonly favoriteTags: FavoriteTags;
  private element: FavoriteElement | null;

  constructor(object: HTMLElement | FavoritesDatabaseRecord, additionalTags?: string) {
    this.id = object instanceof HTMLElement ? getIdFromThumb(object) : object.id;
    this.post = createPost(object);
    this.favoriteTags = new FavoriteTags(this.post, object, additionalTags);
    this.element = null;
    this.metadata = new FavoriteMetadata(this.id, object);
  }

  public get tags(): Set<string> {
    return this.favoriteTags.tags;
  }

  public get root(): HTMLElement {
    if (this.element === null) {
      this.post.tags = this.favoriteTags.tagString;
      this.element = new FavoriteElement(this.post);
      clearPost(this.post);
    }
    return this.element.root;
  }

  public get thumbUrl(): string {
    return this.element === null ? this.post.previewURL : this.element.thumbUrl;
  }

  public get metrics(): FavoriteMetricMap {
    return this.metadata.metrics;
  }

  public get databaseRecord(): FavoritesDatabaseRecord {
    return { id: this.id, tags: this.tags, src: compressPreviewSource(this.thumbUrl), metadata: this.metadata.databaseRecord };
  }

  public swapFavoriteButton = (): void => this.element?.swapFavoriteButton();
  public validateTags = (post: Post): void => this.favoriteTags.validate(post);
  public withinRating = (rating: Rating): boolean => (this.metadata.rating & rating) > 0;
  public populateMetadata = (post: Post): void => this.metadata.populateFromPost(post);
  public addAdditionalTags = (newTags: string): string => this.favoriteTags.addAdditionalTags(newTags);
  public removeAdditionalTags = (tagsToRemove: string): string => this.favoriteTags.removeAdditionalTags(tagsToRemove);
  public resetAdditionalTags = (): void => this.favoriteTags.resetAdditionalTags();
}
