import { Favorite, FavoriteMetricMap } from "@/types/favorite";
import { toSortedTagSet, toTagSet } from "@/utils/pure/tag";
import { FavoriteElement } from "@/features/favorites/types/favorite_element";
import { FavoriteTags } from "@/features/favorites/types/favorite_tags";
import { MediaExtension } from "@/types/media";
import { Post } from "@/types/api";
import { chain } from "@/utils/pure/function";
import { getImageFromThumb } from "@/lib/thumb/query";
import { getTagsFromThumb } from "@/lib/thumb/tag";
import { parseIdFromThumb } from "@/lib/thumb/post_id";
import { removeExtraWhitespace } from "@/utils/pure/string";

export class FavoriteItem implements Favorite {
  public readonly id: string;
  public readonly post: Post;
  private readonly favoriteTags: FavoriteTags;
  private element: FavoriteElement | null;

  constructor(source: HTMLElement | Post) {
    this.post = source instanceof HTMLElement ? thumbToPost(source) : source;
    this.id = this.post.id;
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

  public get metrics(): FavoriteMetricMap {
    return {
      id: parseInt(this.post.id, 10),
      width: this.post.width,
      height: this.post.height,
      score: this.post.score,
      creationTimestamp: 0,
      lastChangedTimestamp: this.post.change,
      duration: this.post.duration ?? 0,
      default: 0,
      random: 0
    };
  }

  public get root(): HTMLElement {
    if (this.element === null) {
      this.element = new FavoriteElement(this.id, this.post.previewURL, this.favoriteTags.tagString);
      this.element.setAspectRatio(this.post.width, this.post.height);
      this.element.setExtension(this.post.extension);
    }
    return this.element.root;
  }

  public enrich(post: Post): void {
    post.previewURL = this.post.previewURL || post.previewURL;
    Object.assign(this.post, post);
    this.favoriteTags.set(toSortedTagSet(post.tags));
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
    previewURL: image === null ? "" : image.src ?? image.getAttribute("data-cfsrc") ?? "",
    tagCategories: new Map()
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
