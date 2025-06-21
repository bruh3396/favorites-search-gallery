import { convertToTagSet, convertToTagString } from "../../../../utils/primitive/string";
import { FavoritesDatabaseRecord } from "../../../../types/primitives/composites";
import { Post } from "../../../../types/api/api_types";

function getCorrectTags(post: Post): Set<string> {
  const correctTags = convertToTagSet(post.tags);

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
  public tags: Set<string>;
  private id: string;
  private additionalTagSet: Set<string> = new Set();

  constructor(post: Post, record: HTMLElement | FavoritesDatabaseRecord) {
    this.id = post.id;

    if (record instanceof HTMLElement) {
      this.tags = convertToTagSet(post.tags);
    } else {
      this.tags = record.tags;
    }
    post.tags = "";
  }

  private get originalTagSet(): Set<string> {
    return this.tags.difference(this.additionalTagSet);
  }

  private get originalTagString(): string {
    return convertToTagString(this.originalTagSet);
  }

  private get additionalTagString(): string {
    return convertToTagString(this.additionalTagSet);
  }

  private get tagString(): string {
    return convertToTagString(this.tags);
  }

  public update(post: Post): void {
    this.tags = convertToTagSet(post.tags);
    this.tags.add(post.id);
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

  public addAdditionalTags(newTags: string): string {
    const newTagsSet = convertToTagSet(newTags).difference(this.tags);

    if (newTagsSet.size > 0) {
      this.additionalTagSet = this.additionalTagSet.union(newTagsSet);
      this.combineOriginalAndAdditionalTagSets();
    }
    return this.additionalTagString;
  }

  public removeAdditionalTags(tagsToRemove: string): string {
  }

  public resetAdditionalTags(): void {

  }

  private combineOriginalAndAdditionalTagSets(): void {
    const union = this.originalTagSet.union(this.additionalTagSet);

    this.tags = new Set(Array.from(union).sort());
  }
}
