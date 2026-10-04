import { Post } from "@/core/domain/post/post";

export interface LocalPosts {
  getMany: (ids: string[]) => Promise<Post[]>;
  setMany: (posts: Post[]) => Promise<void>;
  setManyIfAbsent: (posts: Post[]) => Promise<void>;
}
