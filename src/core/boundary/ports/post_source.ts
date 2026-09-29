import { CategorizedPost } from "@/core/domain/post/post";

export interface PostSource {
  fetch: (id: string) => Promise<CategorizedPost>;
}
