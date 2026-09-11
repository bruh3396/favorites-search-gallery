import { DiscreteRating, Metric, Rating } from "@/types/search";
import { EncodedMediaExtension, EncodedMediaType, MediaExtension, MediaType, decodeMediaExtension, encodeMediaExtension } from "@/types/media";
import { compressPreviewSource, decompressPreviewSource } from "@/features/favorites/types/preview_source_codec";
import { decodeMediaType, encodeMediaType, resolveMediaType } from "@/lib/media/media_type";
import { toRatingString, toRatingValue } from "@/features/favorites/model/search/rating";
import { toTagSet, toTagString } from "@/utils/pure/tag";
import { Favorite } from "@/types/favorite";
import { FavoriteElement } from "@/features/favorites/types/favorite_element";
import { Post } from "@/types/api";
import { thumbToPost } from "@/features/favorites/types/thumb_to_post";

let resolveTags: (favorite: Favorite) => ReadonlySet<string> = () => new Set<string>();
const tagSets: WeakMap<FavoriteItem, Set<string>> = new WeakMap();

export function setFavoriteTagResolver(resolver: (favorite: Favorite) => ReadonlySet<string>): void {
  resolveTags = resolver;
}

export class FavoriteItem implements Favorite {
  private readonly numericId: number;
  private width: number = 0;
  private height: number = 0;
  private score: number = 0;
  private change: number = 0;
  private duration: number = 0;
  private fetchedAt: number = 0;
  private rating: Rating = DiscreteRating.Explicit;
  private encodedMediaExtension: EncodedMediaExtension = EncodedMediaExtension.Unknown;
  private encodedMediaType: EncodedMediaType = EncodedMediaType.Image;
  private previewUrl: string = "";
  private element: FavoriteElement | null = null;

  constructor(source: HTMLElement | Post) {
    const post = source instanceof HTMLElement ? thumbToPost(source) : source;

    this.numericId = parseInt(post.id, 10);
    this.enrich(post);
  }

  public get id(): string {
    return String(this.numericId);
  }

  public get tags(): Set<string> {
    const tags = tagSets.get(this);
    return tags === undefined ? new Set(resolveTags(this)) : tags;
  }

  public get post(): Post {
    return {
      id: String(this.numericId),
      tags: this.tagsReleased ? "" : toTagString(this.tags),
      width: this.width,
      height: this.height,
      score: this.score,
      rating: toRatingString(this.rating),
      change: this.change,
      fileURL: "",
      fetchedAt: this.fetchedAt,
      duration: this.duration,
      deleted: false,
      previewURL: compressPreviewSource(this.previewUrl),
      extension: this.extension
    };
  }

  public get mediaType(): MediaType {
    return decodeMediaType(this.encodedMediaType);
  }

  public get extension(): MediaExtension | undefined {
    return decodeMediaExtension(this.encodedMediaExtension);
  }

  public get thumbUrl(): string {
    return decompressPreviewSource(this.previewUrl);
  }

  public get root(): HTMLElement {
    if (this.element === null) {
      this.element = new FavoriteElement(this.id, this.thumbUrl, this.mediaType);
      this.element.setAspectRatio(this.width, this.height);
      this.element.setExtension(this.extension);
    }
    return this.element.root;
  }

  public get tagsReleased(): boolean {
    return !tagSets.has(this);
  }

  public releaseTags(): void {
    tagSets.delete(this);
  }

  public getMetric(metric: Metric): number {
    switch (metric) {
      case "id":
        return this.numericId;
      case "width":
        return this.width;
      case "height":
        return this.height;
      case "score":
        return this.score;
      case "lastChangedTimestamp":
        return this.change;
      case "duration":
        return this.duration;
      case "creationTimestamp":
      case "default":
      case "random":
      default:
        return 0;
    }
  }

  public setDuration(duration: number): void {
    this.post.duration = duration;
  }

  public enrich(post: Post): void {
    this.width = post.width;
    this.height = post.height;
    this.score = post.score;
    this.rating = toRatingValue(post.rating);
    this.fetchedAt = post.fetchedAt ?? 0;
    this.change = post.change;
    this.duration = post.duration;
    this.encodedMediaExtension = post.extension === undefined ? EncodedMediaExtension.Unknown : encodeMediaExtension(post.extension);
    this.previewUrl = compressPreviewSource(post.previewURL);
    tagSets.set(this, toTagSet(post.tags));
    this.encodedMediaType = encodeMediaType(resolveMediaType(post.tags));
    this.element?.setAspectRatio(post.width, post.height);
    this.element?.setExtension(post.extension);
  }
}
