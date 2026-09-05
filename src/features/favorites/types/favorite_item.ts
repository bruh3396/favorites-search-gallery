import { toSortedTagSet, toSortedTagString, toTagSet } from "@/utils/pure/tag";
import { Favorite } from "@/types/favorite";
import { FavoriteElement } from "@/features/favorites/types/favorite_element";
import { FavoriteTags } from "@/features/favorites/types/favorite_tags";
import { MediaExtension } from "@/types/media";
import { MetadataMetric } from "@/types/search";
import { Post } from "@/types/api";
import { chain } from "@/utils/pure/function";
import { getImageFromThumb } from "@/lib/thumb/query";
import { getTagsFromThumb } from "@/lib/thumb/tag";
import { parseIdFromThumb } from "@/lib/thumb/post_id";
import { removeExtraWhitespace } from "@/utils/pure/string";

export class FavoriteItem implements Favorite {
  public readonly id: string;
  public readonly post: Post;
  private readonly numericId: number;
  private readonly favoriteTags: FavoriteTags;
  private element: FavoriteElement | null;

  constructor(source: HTMLElement | Post) {
    this.post = source instanceof HTMLElement ? thumbToPost(source) : source;
    this.id = this.post.id;
    this.numericId = parseInt(this.post.id, 10);
    this.favoriteTags = new FavoriteTags(toTagSet(this.post.tags));
    this.element = null;
  }

  public get tags(): Set<string> {
    return this.favoriteTags.tags;
  }

  public get thumbUrl(): string {
    return this.element === null ? this.post.previewURL : this.element.thumbUrl;
  }

  public get extension(): MediaExtension | undefined {
    return this.post.extension;
  }

  public get root(): HTMLElement {
    if (this.element === null) {
      this.element = new FavoriteElement(this.id, this.post.previewURL, this.favoriteTags.tagString);
      this.element.setAspectRatio(this.post.width, this.post.height);
      this.element.setExtension(this.post.extension);
    }
    return this.element.root;
  }

  public getMetric(metric: MetadataMetric): number {
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
    const tags = toSortedTagSet(post.tags).add(this.id);

    Object.assign(this.post, post);
    this.post.tags = toSortedTagString(tags);
    this.favoriteTags.set(tags);
    this.element?.setAspectRatio(post.width, post.height);
    this.element?.setExtension(post.extension);
  }

  public setDuration = (duration: number): void => {
    this.post.duration = duration;
  };

  public addTags = (newTags: string): string => this.favoriteTags.addTags(newTags);
  public removeAddedTags = (tagsToRemove: string): string => this.favoriteTags.removeAddedTags(tagsToRemove);
  public resetAddedTags = (): void => this.favoriteTags.resetAddedTags();
}

function thumbToPost(thumb: HTMLElement): Post {
  const id = parseIdFromThumb(thumb);
  const image = getImageFromThumb(thumb);
  return {
    id,
    tags: image === null ? "" : normalizeTags(thumb, id),
    width: 0,
    height: 0,
    score: 0,
    rating: "",
    change: 0,
    fileURL: "",
    previewURL: image === null ? "" : image.src ?? image.getAttribute("data-cfsrc") ?? ""
  };
}

function normalizeTags(thumb: HTMLElement, id: string): string {
  return chain(
    getTagsFromThumb(thumb),
    tags => tags.replace(/\bvide\b/g, "video"),
    tags => `${tags} ${id}`,
    tags => tags.split(" ").sort().join(" "),
    removeExtraWhitespace
  );
}
