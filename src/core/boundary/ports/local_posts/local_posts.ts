import { Post } from "@/core/domain/post/post";

export interface LocalPosts {
  getMany: (ids: readonly string[]) => Promise<readonly Readonly<Post>[]>;
  setMany: (posts: readonly Readonly<Post>[]) => Promise<void>;
  setManyIfAbsent: (posts: readonly Readonly<Post>[]) => Promise<void>;
}
