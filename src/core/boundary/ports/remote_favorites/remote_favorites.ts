import { Post } from "@/core/domain/post/post";

export interface RemoteFavorites {
  fetchCount: () => Promise<number | null>;
  fetchAll: (onFavoritesFound: (posts: readonly Readonly<Post>[]) => void) => Promise<void>;
  findNew: (localPostIds: readonly string[]) => Promise<readonly Readonly<Post>[]>;
  findMissing: (localPostIds: readonly string[], remoteStart: number) => Promise<readonly string[]>;
  add: (postId: string) => Promise<boolean>;
  remove: (postId: string) => Promise<boolean>;
}
