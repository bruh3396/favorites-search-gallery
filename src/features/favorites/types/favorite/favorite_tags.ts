import { convertToTagSet, convertToTagString } from "../../../../utils/primitive/string";
import { FavoritesDatabaseRecord } from "../../../../types/primitives/composites";
import { Post } from "../../../../types/api/post";

export class FavoriteTags {
  public tags: Set<string>;
  private id: string;

  constructor(post: Post, record: HTMLElement | FavoritesDatabaseRecord) {
    this.id = post.id;

    if (record instanceof HTMLElement) {
      this.tags = convertToTagSet(post.tags);
    } else {
      this.tags = record.tags;
    }
    post.tags = "";
  }

  public get tagString(): string {
    return convertToTagString(this.tags);
  }

  public validateTagsAgainstAPI(post: Post): Set<string> {
    const oldTags = new Set(this.tags);
    const currentTags = new Set(this.tags);
    const correctTags = this.getCorrectTags(post);

    currentTags.delete(this.id);

    if (!this.tagsAreEqual(currentTags, correctTags)) {
      this.tags = new Set(correctTags);
      this.tags.add(this.id);
    }
    return oldTags;
  }

  private getCorrectTags(post: Post): Set<string> {
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

  private tagsAreEqual(tags1: Set<string>, tags2: Set<string>): boolean {
    const difference = tags1.symmetricDifference(tags2);

    if (difference.size === 0) {
      return true;
    }
    return difference.size === 1 && difference.has(this.id);
  }
}
