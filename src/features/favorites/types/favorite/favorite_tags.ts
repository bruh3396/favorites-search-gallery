import {Post} from "../../../../types/api/post";
import {convertToTagSet} from "../../../../utils/primitive/string";

export class FavoriteTags {
  public tags: Set<string>;

  constructor(post: Post) {
    this.tags = convertToTagSet(post.tags);
    post.tags = "";
  }
}
