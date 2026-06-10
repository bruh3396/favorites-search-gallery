import { Favorite, FavoriteMetricMap, FavoritesDatabaseRecord } from "@/types/favorite";
import { clearPost, createPost } from "@/features/favorites/types/post_factory";
import { FavoriteElement } from "@/features/favorites/types/favorite_element";
import { FavoriteMetadata } from "@/features/favorites/types/favorite_metadata";
import { FavoriteTags } from "@/features/favorites/types/favorite_tags";
import { Post } from "@/types/api";
import { Rating } from "@/types/search";
import { compressPreviewSource } from "@/lib/media/url_compressor";
import { getIdFromThumb } from "@/lib/thumb/thumbs";

export class FavoriteItem implements Favorite {
  public readonly id: string;
  public readonly metadata: FavoriteMetadata;
  private readonly post: Post;
  private readonly favoriteTags: FavoriteTags;
  private element: FavoriteElement | null;

  constructor(source: HTMLElement | FavoritesDatabaseRecord, additionalTags?: string) {
    this.id = source instanceof HTMLElement ? getIdFromThumb(source) : source.id;
    this.post = createPost(source);
    this.favoriteTags = new FavoriteTags(this.post, source, additionalTags);
    this.element = null;
    this.metadata = new FavoriteMetadata(this.id, source);
  }

  public get tags(): Set<string> {
    return this.favoriteTags.tags;
  }

  public get root(): HTMLElement {
    if (this.element === null) {
      this.post.tags = this.favoriteTags.tagString;
      this.element = new FavoriteElement(this.post);
      this.element.setAspectRatio(this.metadata.metrics.width, this.metadata.metrics.height);
      clearPost(this.post);
    }
    return this.element.root;
  }

  public get thumbnailUrl(): string {
    return this.element === null ? this.post.previewURL : this.element.thumbUrl;
  }

  public get metrics(): FavoriteMetricMap {
    return this.metadata.metrics;
  }

  public get databaseRecord(): FavoritesDatabaseRecord {
    return { id: this.id, tags: this.tags, src: compressPreviewSource(this.thumbnailUrl), metadata: this.metadata.databaseRecord };
  }

  public updateTags = (post: Post): void => this.favoriteTags.set(post.tags);
  public withinRating = (rating: Rating): boolean => (this.metadata.rating & rating) > 0;
  public populateMetadata = (post: Post): void => {
    this.metadata.populateFromPost(post);
    this.element?.setAspectRatio(post.width, post.height);
  };
  public addAdditionalTags = (newTags: string): string => this.favoriteTags.addAdditionalTags(newTags);
  public removeAdditionalTags = (tagsToRemove: string): string => this.favoriteTags.removeAdditionalTags(tagsToRemove);
  public resetAdditionalTags = (): void => this.favoriteTags.resetAdditionalTags();
}
