import { convertToTagSet, convertToTagString } from "../../../../utils/primitive/string";
import { FavoritesDatabaseRecord } from "../../../../types/primitives/composites";
import { Post } from "../../../../types/api/post";

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

  public update(post: Post): void {
    this.tags = convertToTagSet(post.tags);
    this.tags.add(post.id);
  }

  public tagsAreEqual(post: Post): boolean {
    const difference = this.tags.symmetricDifference(getCorrectTags(post));
    return difference.size === 0 || (difference.size === 1 && difference.has(this.id));
  }
}
