import { Post } from "@/core/domain/post/post";
import { Snippet } from "@/core/domain/snippet/snippet";
import { TagCategory } from "@/core/domain/tag_category/tag_category";

export interface V1StorageContents {
  readonly posts: readonly Post[];
  readonly favoriteIdsByOwnerId: ReadonlyMap<string, readonly string[]>;
  readonly tagCategoryByTagName: ReadonlyMap<string, TagCategory>;
  readonly snippets: readonly Snippet[];
}
