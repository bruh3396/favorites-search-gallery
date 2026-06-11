import { convertToSortedTagString, toTagSet, toTagString } from "@/utils/string/tags";
import { FavoriteDatabaseRecord } from "@/types/favorite";
import { Post } from "@/types/api";

export class FavoriteTags {
  public tags: Set<string> = new Set();
  private baseTags: Set<string> = new Set();
  private additionalTags: Set<string> = new Set();

  constructor(post: Post, record: HTMLElement | FavoriteDatabaseRecord, additionalTags?: string) {
    this.set(record instanceof HTMLElement ? post.tags : record.tags, additionalTags);
    post.tags = "";
  }

  public get tagString(): string {
    return toTagString(this.tags);
  }

  public set(tags: string | Set<string>, additionalTags?: string): void {
    this.baseTags = tags instanceof Set ? tags : toTagSet(tags);

    if (additionalTags !== undefined) {
      this.additionalTags = toTagSet(additionalTags);
    }
    this.mergeTags();
  }

  public addAdditionalTags(newTagString: string): string {
    const newTags = toTagSet(newTagString).difference(this.tags);

    if (newTags.size > 0) {
      this.additionalTags = this.additionalTags.union(newTags);
      this.mergeTags();
    }
    return convertToSortedTagString(this.additionalTags);
  }

  public removeAdditionalTags(tagsToRemove: string): string {
    const tagsToRemoveSet = toTagSet(tagsToRemove).intersection(this.additionalTags);

    if (tagsToRemoveSet.size > 0) {
      this.additionalTags = this.additionalTags.difference(tagsToRemoveSet);
      this.mergeTags();
    }
    return convertToSortedTagString(this.additionalTags);
  }

  public resetAdditionalTags(): void {
    if (this.additionalTags.size === 0) {
      return;
    }
    this.additionalTags = new Set();
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
