import { toSortedTagSet, toSortedTagString, toTagSet, toTagString } from "@/utils/string/tags";
import { FavoriteDatabaseRecord } from "@/types/favorite";
import { Post } from "@/types/api";

function toBaseTagSet(post: Post, record: HTMLElement | FavoriteDatabaseRecord): Set<string> {
  if (record instanceof HTMLElement) {
    return toSortedTagSet(post.tags);
  }
  return record.tags instanceof Set ? record.tags : toTagSet(record.tags);
}

export class FavoriteTags {
  public tags: Set<string> = new Set();
  private baseTags: Set<string> = new Set();
  private additionalTags: Set<string> = new Set();

  constructor(post: Post, record: HTMLElement | FavoriteDatabaseRecord, additionalTags?: string) {
    this.set(toBaseTagSet(post, record), additionalTags === undefined ? undefined : toSortedTagSet(additionalTags));
    post.tags = "";
  }

  public get tagString(): string {
    return toTagString(this.tags);
  }

  public set(tags: Set<string>, additionalTags?: Set<string>): void {
    this.baseTags = tags;

    if (additionalTags !== undefined) {
      this.additionalTags = additionalTags;
    }
    this.mergeTags();
  }

  public addAdditionalTags(newTagString: string): string {
    const newTags = toSortedTagSet(newTagString).difference(this.tags);

    if (newTags.size > 0) {
      this.additionalTags = this.additionalTags.union(newTags);
      this.mergeTags();
    }
    return toSortedTagString(this.additionalTags);
  }

  public removeAdditionalTags(tagsToRemove: string): string {
    const tagsToRemoveSet = toSortedTagSet(tagsToRemove).intersection(this.additionalTags);

    if (tagsToRemoveSet.size > 0) {
      this.additionalTags = this.additionalTags.difference(tagsToRemoveSet);
      this.mergeTags();
    }
    return toSortedTagString(this.additionalTags);
  }

  public resetAdditionalTags(): void {
    if (this.additionalTags.size === 0) {
      return;
    }
    this.additionalTags = new Set();
    this.mergeTags();
  }

  private setPresorted(tags: string | Set<string>, additionalTags?: string): void {
    this.baseTags = tags instanceof Set ? tags : toTagSet(tags);

    if (additionalTags !== undefined) {
      this.additionalTags = toSortedTagSet(additionalTags);
    }
    this.mergeTags();
  }

  private mergeTags(): void {
    if (this.additionalTags.size === 0) {
      this.tags = this.baseTags;
      return;
    }
    this.tags = new Set(Array.from(this.baseTags.union(this.additionalTags)).sort());
  }
}
