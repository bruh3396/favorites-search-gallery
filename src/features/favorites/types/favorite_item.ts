import { Favorite, FavoriteMetricMap, SerializedFavorite } from "@/types/favorite";
import { clearPost, createPost } from "@/features/favorites/types/post_factory";
import { FavoriteElement } from "@/features/favorites/types/favorite_element";
import { FavoriteMetadata } from "@/features/favorites/types/favorite_metadata";
import { FavoriteTags } from "@/features/favorites/types/favorite_tags";
import { Post } from "@/types/api";
import { Rating } from "@/types/search";
import { compressPreviewSource } from "@/lib/media/url_compressor";
import { parseIdFromThumb } from "@/lib/thumb/thumbs";
import { toSortedTagSet } from "@/utils/string/tags";

export class FavoriteItem implements Favorite {
  public readonly id: string;
  public readonly metadata: FavoriteMetadata;
  private readonly post: Post;
  private readonly favoriteTags: FavoriteTags;
  private element: FavoriteElement | null;
  private isDeleted: boolean;

  constructor(source: HTMLElement | SerializedFavorite, addedTags?: string) {
    this.id = source instanceof HTMLElement ? parseIdFromThumb(source) : source.id;
    this.post = createPost(source);
    this.favoriteTags = new FavoriteTags(this.post, source, addedTags);
    this.element = null;
    this.metadata = new FavoriteMetadata(this.id, source);
    this.isDeleted = source instanceof HTMLElement ? false : source.deleted ?? false;
  }

  public get deleted(): boolean {
    return this.isDeleted;
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

  public get thumbUrl(): string {
    return this.element === null ? this.post.previewURL : this.element.thumbUrl;
  }

  public get metrics(): FavoriteMetricMap {
    return this.metadata.metrics;
  }

  public get serialized(): SerializedFavorite {
    return { id: this.id, tags: this.favoriteTags.tagString, src: compressPreviewSource(this.thumbUrl), deleted: this.isDeleted, metadata: this.metadata.serialized };
  }

  public populateMetadata(post: Post): void {
    this.metadata.populateFromPost(post);
    this.element?.setAspectRatio(post.width, post.height);
  }

  public markDeleted = (): boolean => (this.isDeleted = true);
  public updateTags = (post: Post): void => this.favoriteTags.set(toSortedTagSet(post.tags));
  public withinRating = (rating: Rating): boolean => (this.metadata.rating & rating) > 0;
  public addTags = (newTags: string): string => this.favoriteTags.addTags(newTags);
  public removeAddedTags = (tagsToRemove: string): string => this.favoriteTags.removeAddedTags(tagsToRemove);
  public resetAddedTags = (): void => this.favoriteTags.resetAddedTags();
}
