import { Post } from "@/core/domain/post/post";

export type AddFavoriteResult = "added" | "alreadyAdded" | "loggedOut" | "cancelled" | "blocked" | "error";
export type RemoveFavoriteResult = "removed" | "cancelled" | "blocked" | "error";

export interface RemoteFavorites {
  fetchCount: () => Promise<number | null>;
  fetchAll: (onFavoritesFound: (posts: readonly Readonly<Post>[]) => void) => Promise<void>;
  findNew: (localIds: readonly string[]) => Promise<readonly Readonly<Post>[]>;
  findRemoved: (localIds: readonly string[], remoteStart: number) => Promise<readonly string[]>;
  add: (id: string) => Promise<AddFavoriteResult>;
  remove: (id: string) => Promise<RemoveFavoriteResult>;
}
