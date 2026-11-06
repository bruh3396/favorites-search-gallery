import { Post } from "@/core/domain/post/post";
import { RemoteFavoriteAddResult } from "@/core/boundary/ports/remote_favorites/remote_favorite_add_result";

export interface RemoteFavorites {
  fetchCount: () => Promise<number | null>;
  fetchAll: (onFavoritesFound: (posts: readonly Readonly<Post>[]) => void) => Promise<void>;
  findNew: (localPostIds: readonly string[]) => Promise<readonly Readonly<Post>[]>;
  findMissing: (localPostIds: readonly string[], remoteStart: number) => Promise<readonly string[]>;
  add: (postId: string) => Promise<RemoteFavoriteAddResult>;
  remove: (postId: string) => Promise<boolean>;
}
