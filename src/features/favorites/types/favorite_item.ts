import { compressPreviewSource, decompressPreviewSource } from "@/features/favorites/types/preview_source_codec";
import { decodeTagSet, encodeTags } from "@/app/domain/tag/dictionary";
import { Favorite } from "@/types/favorite";
import { FavoriteElement } from "@/features/favorites/types/favorite_element";
import { MediaExtension } from "@/types/media";
import { Metric } from "@/types/search";
import { Post } from "@/types/api";
import { getImageFromThumb } from "@/lib/ui/thumb/query";
import { getTagsFromThumb } from "@/lib/ui/thumb/tag";
import { internString } from "@/app/domain/tag/interner";
import { parseIdFromThumb } from "@/lib/ui/thumb/post_id";
import { removeExtraWhitespace } from "@/utils/pure/string";

export class FavoriteItem implements Favorite {
  public readonly id: string;
  public readonly post: Post;
  private readonly numericId: number;
  private readonly tagIds: Uint16Array;
  private element: FavoriteElement | null;

  constructor(source: HTMLElement | Post) {
    this.post = source instanceof HTMLElement ? thumbToPost(source) : source;
    this.id = internString(source.id);
    this.tagIds = encodeTags(this.post.tags);
    this.post.tags = "";
    this.numericId = parseInt(source.id, 10);
    this.element = null;
    this.dedupe();
  }

  public get tags(): Set<string> {
    return decodeTagSet(this.tagIds);
  }

  public get thumbUrl(): string {
    const compressed = this.element === null ? this.post.previewURL : this.element.thumbUrl;
    return decompressPreviewSource(compressed);
  }

  public get extension(): MediaExtension | undefined {
    return this.post.extension;
  }

  public get root(): HTMLElement {
    if (this.element === null) {
      this.element = new FavoriteElement(this.id, this.thumbUrl, this.post.tags);
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
    post.previewURL = compressPreviewSource(post.previewURL);
    Object.assign(this.post, post);
    this.dedupe();
    this.element?.setAspectRatio(post.width, post.height);
    this.element?.setExtension(post.extension);
  }

  public setDuration(duration: number): void {
    this.post.duration = duration;
  }

  private dedupe(): void {
    this.post.rating = internString(this.post.rating);
    this.post.fileURL = "";
    this.post.id = internString(this.post.id);

    if (this.post.extension) {
      this.post.extension = internString(this.post.extension) as MediaExtension;
    }
  }
}

function thumbToPost(thumb: HTMLElement): Post {
  const id = parseIdFromThumb(thumb);
  const image = getImageFromThumb(thumb);
  const previewURL = compressPreviewSource(image?.src ?? image?.getAttribute("data-cfsrc") ?? "");
  return {
    id,
    tags: image === null ? "" : normalizeTags(thumb),
    width: 0,
    height: 0,
    score: 0,
    rating: "",
    change: 0,
    fileURL: "",
    previewURL
  };
}

function normalizeTags(thumb: HTMLElement): string {
  return removeExtraWhitespace(getTagsFromThumb(thumb).replace(/\bvide\b/g, "video"));
}
