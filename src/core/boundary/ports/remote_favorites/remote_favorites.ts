import { Post } from "@/core/domain/post/post";

export interface RemoteFavorites {
  fetchCount: () => Promise<number | null>;
  fetchAll: (onFavoritesFound: (posts: Post[]) => void) => Promise<void>;
  findNew: (localIds: readonly string[]) => Promise<Post[]>;
  findRemoved: (localIds: readonly string[], remoteStart: number) => Promise<string[]>;
}
