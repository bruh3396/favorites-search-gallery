import { Post } from "@/core/domain/post/post";

export interface PostStore {
  getMany: (ids: string[]) => Promise<Post[]>;
  setMany: (posts: Post[]) => Promise<void>;
}
