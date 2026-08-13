import { toSortedTagSet, toSortedTagString, toTagSet, toTagString } from "@/utils/string/tags";
import { Post } from "@/types/api";
import { SerializedFavorite } from "@/types/favorite";

export class FavoriteTags {
  public tags: Set<string> = new Set();
  private baseTags: Set<string> = new Set();
  private addedTags: Set<string> = new Set();

  constructor(post: Post, record: HTMLElement | SerializedFavorite, addedTags?: string) {
    this.set(toBaseTagSet(post, record), addedTags === undefined ? undefined : toSortedTagSet(addedTags));
    post.tags = "";
  }

  public get tagString(): string {
    return toTagString(this.tags);
  }

  public set(tags: Set<string>, addedTags?: Set<string>): void {
    this.baseTags = tags;

    if (addedTags !== undefined) {
      this.addedTags = addedTags;
    }
    this.mergeTags();
  }

  public addTags(newTagString: string): string {
    const newTags = toSortedTagSet(newTagString).difference(this.tags);

    if (newTags.size > 0) {
      this.addedTags = this.addedTags.union(newTags);
      this.mergeTags();
    }
    return toSortedTagString(this.addedTags);
  }

  public removeAddedTags(tagsToRemove: string): string {
    const tagsToRemoveSet = toSortedTagSet(tagsToRemove).intersection(this.addedTags);

    if (tagsToRemoveSet.size > 0) {
      this.addedTags = this.addedTags.difference(tagsToRemoveSet);
      this.mergeTags();
    }
    return toSortedTagString(this.addedTags);
  }

  public resetAddedTags(): void {
    if (this.addedTags.size === 0) {
      return;
    }
    this.addedTags = new Set();
    this.mergeTags();
  }

  private mergeTags(): void {
    if (this.addedTags.size === 0) {
      this.tags = this.baseTags;
      return;
    }
    this.tags = new Set(Array.from(this.baseTags.union(this.addedTags)).sort());
  }
}

function toBaseTagSet(post: Post, record: HTMLElement | SerializedFavorite): Set<string> {
  if (record instanceof HTMLElement) {
    return toSortedTagSet(post.tags);
  }
  return record.tags instanceof Set ? record.tags : toTagSet(record.tags);
}
