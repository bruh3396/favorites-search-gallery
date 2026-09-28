import { CategorizedPost } from "@/core/domain/post/post";

export interface PostSource {
  fetchPost: (id: string) => Promise<CategorizedPost>;
}
