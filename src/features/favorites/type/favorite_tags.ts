import { convertToTagSet, convertToTagString } from "../../../utils/string/tags";
import { FavoritesDatabaseRecord } from "../../../types/favorite";
import { Post } from "../../../types/post";

function getCorrectTags(post: Post): Set<string> {
  const correctTags = convertToTagSet(post.tags);

  correctTags.add(post.id);

  if (post.fileURL.endsWith("mp4")) {
    correctTags.add("video");
  } else if (post.fileURL.endsWith("gif")) {
    correctTags.add("gif");
  } else if (!correctTags.has("animated_png")) {
    correctTags.delete("video");
    correctTags.delete("animated");
  }
  return correctTags;
}

export class FavoriteTags {
  public tags: Set<string> = new Set();
  private additionalTags: Set<string> = new Set();

  constructor(post: Post, record: HTMLElement | FavoritesDatabaseRecord, additionalTags?: string) {
    this.set(record instanceof HTMLElement ? post.tags : record.tags, additionalTags);
    post.tags = "";
  }

  public get tagString(): string {
    return convertToTagString(this.tags);
  }

  private get originalTagSet(): Set<string> {
    return this.tags.difference(this.additionalTags);
  }

  private get additionalTagString(): string {
    return convertToTagString(this.additionalTags);
  }

  public set(tags: string | Set<string>, additionalTags?: string): void {
    this.tags = tags instanceof Set ? tags : convertToTagSet(tags);
    this.correctVideoTag(tags);

    if (additionalTags !== undefined) {
      this.additionalTags = convertToTagSet(additionalTags);
      this.combineOriginalAndAdditionalTagSets();
    }
  }

  public validate(post: Post): void {
    if (!this.tagsAreEqual(post)) {
      this.set(post.tags);
    }
  }

  public tagsAreEqual(post: Post): boolean {
    const correctTags = getCorrectTags(post);
    const difference = this.tags.symmetricDifference(correctTags);
    const equal = difference.size === 0 || (difference.size === 1 && difference.has(post.id));

    if (equal) {
      return true;
    }
    post.tags = convertToTagString(correctTags);
    return false;
  }

  public addAdditionalTags(newTagString: string): string {
    const newTags = convertToTagSet(newTagString).difference(this.tags);

    if (newTags.size > 0) {
      this.additionalTags = this.additionalTags.union(newTags);
      this.combineOriginalAndAdditionalTagSets();
    }
    return this.additionalTagString;
  }

  public removeAdditionalTags(tagsToRemove: string): string {
    const tagsToRemoveSet = convertToTagSet(tagsToRemove).intersection(this.additionalTags);

    if (tagsToRemoveSet.size > 0) {
      this.tags = this.tags.difference(tagsToRemoveSet);
      this.additionalTags = this.additionalTags.difference(tagsToRemoveSet);
    }
    return this.additionalTagString;
  }

  public resetAdditionalTags(): void {
    if (this.additionalTags.size === 0) {
      return;
    }
    this.additionalTags = new Set();
    this.combineOriginalAndAdditionalTagSets();
  }

  private combineOriginalAndAdditionalTagSets(): void {
    const sorted = Array.from(this.originalTagSet.union(this.additionalTags)).sort();

    this.tags = new Set(sorted);
  }

  private correctVideoTag(tags: string | Set<string>): void {
    if (typeof tags === "string" && this.tags.has("vide") && this.tags.has("animated")) {
      this.tags.delete("vide");
      this.tags.add("video");
    }
  }
}
