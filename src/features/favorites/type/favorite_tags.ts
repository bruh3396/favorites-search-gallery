import { convertToTagSet, convertToTagString } from "../../../utils/string/tags";
import { FavoritesDatabaseRecord } from "../../../types/favorite";
import { Post } from "../../../types/post";
import { getCorrectTags } from "../../../lib/media/media_tag_validator";

export class FavoriteTags {
  public tags: Set<string> = new Set();
  private baseTags: Set<string> = new Set();
  private additionalTags: Set<string> = new Set();

  constructor(post: Post, record: HTMLElement | FavoritesDatabaseRecord, additionalTags?: string) {
    this.set(record instanceof HTMLElement ? post.tags : record.tags, additionalTags);
    post.tags = "";
  }

  public get tagString(): string {
    return convertToTagString(this.tags);
  }

  public set(tags: string | Set<string>, additionalTags?: string): void {
    this.baseTags = tags instanceof Set ? tags : convertToTagSet(tags);

    if (!(tags instanceof Set)) {
      this.correctVideoTag();
    }

    if (additionalTags !== undefined) {
      this.additionalTags = convertToTagSet(additionalTags);
    }
    this.mergeTags();
  }

  public validate(post: Post): void {
    if (!this.tagsAreEqual(post)) {
      this.set(post.tags);
    }
  }

  public addAdditionalTags(newTagString: string): string {
    const newTags = convertToTagSet(newTagString).difference(this.tags);

    if (newTags.size > 0) {
      this.additionalTags = this.additionalTags.union(newTags);
      this.mergeTags();
    }
    return convertToTagString(this.additionalTags);
  }

  public removeAdditionalTags(tagsToRemove: string): string {
    const tagsToRemoveSet = convertToTagSet(tagsToRemove).intersection(this.additionalTags);

    if (tagsToRemoveSet.size > 0) {
      this.additionalTags = this.additionalTags.difference(tagsToRemoveSet);
      this.mergeTags();
    }
    return convertToTagString(this.additionalTags);
  }

  public resetAdditionalTags(): void {
    if (this.additionalTags.size === 0) {
      return;
    }
    this.additionalTags = new Set();
    this.mergeTags();
  }

  private tagsAreEqual(post: Post): boolean {
    const correctTags = getCorrectTags(post);
    const difference = this.tags.symmetricDifference(correctTags);
    const equal = difference.size === 0 || (difference.size === 1 && difference.has(post.id));

    if (equal) {
      return true;
    }
    post.tags = convertToTagString(correctTags);
    return false;
  }

  private mergeTags(): void {
    const sorted = Array.from(this.baseTags.union(this.additionalTags)).sort();

    this.tags = new Set(sorted);
  }

  private correctVideoTag(): void {
    if (this.baseTags.has("vide") && this.baseTags.has("animated")) {
      this.baseTags.delete("vide");
      this.baseTags.add("video");
    }
  }
}
