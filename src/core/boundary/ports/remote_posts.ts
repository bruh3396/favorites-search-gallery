import { CategorizedPost } from "@/core/domain/post/post";

export interface RemotePosts {
  fetch: (id: string) => Promise<CategorizedPost>;
}
