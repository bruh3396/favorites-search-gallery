import { toTagSet } from "@/utils/pure/tag";
import { Favorite } from "@/types/favorite";
import { FavoriteElement } from "@/features/favorites/types/favorite_element";
import { MediaExtension } from "@/types/media";
import { Metric } from "@/types/search";
import { Post } from "@/types/api";
import { getImageFromThumb } from "@/lib/thumb/query";
import { getTagsFromThumb } from "@/lib/thumb/tag";
import { parseIdFromThumb } from "@/lib/thumb/post_id";
import { removeExtraWhitespace } from "@/utils/pure/string";

export class FavoriteItem implements Favorite {
  public readonly id: string;
  public readonly post: Post;
  private readonly numericId: number;
  private element: FavoriteElement | null;

  constructor(source: HTMLElement | Post) {
    this.post = source instanceof HTMLElement ? thumbToPost(source) : source;
    this.id = this.post.id;
    this.numericId = parseInt(this.post.id, 10);
    this.element = null;
  }

  public get tags(): Set<string> {
    return toTagSet(this.post.tags);
  }

  public get thumbUrl(): string {
    return this.element === null ? this.post.previewURL : this.element.thumbUrl;
  }

  public get extension(): MediaExtension | undefined {
    return this.post.extension;
  }

  public get root(): HTMLElement {
    if (this.element === null) {
      this.element = new FavoriteElement(this.id, this.post.previewURL, this.post.tags);
      this.element.setAspectRatio(this.post.width, this.post.height);
      this.element.setExtension(this.post.extension);
    }
    return this.element.root;
  }

  public getMetric(metric: Metric): number {
    switch (metric) {
      case "id":
        return this.numericId;
      case "width":
        return this.post.width;
      case "height":
        return this.post.height;
      case "score":
        return this.post.score;
      case "lastChangedTimestamp":
        return this.post.change;
      case "duration":
        return this.post.duration ?? 0;
      case "creationTimestamp":
      case "default":
      case "random":
      default:
        return 0;
    }
  }

  public enrich(post: Post): void {
    post.previewURL = this.post.previewURL || post.previewURL;
    Object.assign(this.post, post);
    this.element?.setAspectRatio(post.width, post.height);
    this.element?.setExtension(post.extension);
  }

  public setDuration(duration: number): void {
    this.post.duration = duration;
  }
}

function thumbToPost(thumb: HTMLElement): Post {
  const id = parseIdFromThumb(thumb);
  const image = getImageFromThumb(thumb);
  return {
    id,
    tags: image === null ? "" : normalizeTags(thumb),
    width: 0,
    height: 0,
    score: 0,
    rating: "",
    change: 0,
    fileURL: "",
    previewURL: image === null ? "" : image.src ?? image.getAttribute("data-cfsrc") ?? ""
  };
}

function normalizeTags(thumb: HTMLElement): string {
  return removeExtraWhitespace(getTagsFromThumb(thumb).replace(/\bvide\b/g, "video"));
}
