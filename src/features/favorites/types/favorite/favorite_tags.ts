import { convertToTagSet, convertToTagString } from "../../../../utils/primitive/string";
import { FavoritesDatabaseRecord } from "../../../../types/primitives/composites";
import { Post } from "../../../../types/api/post";

export class FavoriteTags {
  public tags: Set<string>;

  constructor(post: Post, record: HTMLElement | FavoritesDatabaseRecord) {
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
}
