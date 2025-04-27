import {convertToTagSet} from "../../../../utils/primitive/string";

export class FavoriteTags {
  public tags: Set<string>;

  constructor(tags: string) {
    this.tags = convertToTagSet(tags);
  }
}
