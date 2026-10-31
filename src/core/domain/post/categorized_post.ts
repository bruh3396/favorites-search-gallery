import { Post } from "@/core/domain/post/post";
import { TagCategory } from "@/core/domain/tag_category/tag_category";

export type CategorizedPost = {
  readonly post: Post;
  readonly tagCategories: ReadonlyMap<string, TagCategory>;
};
