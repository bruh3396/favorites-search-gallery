import { Post } from "@/core/domain/post/post";
import { TagCategoryMap } from "@/types/search";

export type ParsedPost = {
  post: Post;
  tagCategories: TagCategoryMap;
};

export interface PostSource {
  fetch: (id: string) => Promise<ParsedPost>;
}
