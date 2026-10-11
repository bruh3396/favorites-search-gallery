import { Post } from "@/core/domain/post/post";

export interface RemoteFavorites {
  fetchCount: () => Promise<number | null>;
  fetchAll: (onFavoritesFound: (posts: readonly Readonly<Post>[]) => void) => Promise<void>;
  findNew: (localIds: readonly string[]) => Promise<readonly Readonly<Post>[]>;
  findRemoved: (localIds: readonly string[], remoteStart: number) => Promise<readonly string[]>;
}
