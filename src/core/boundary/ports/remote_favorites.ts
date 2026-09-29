import { Post } from "@/core/domain/post/post";

export type AddFavoriteResult = "added" | "alreadyAdded" | "loggedOut" | "cancelled" | "error";
export type RemoveFavoriteResult = "removed" | "cancelled" | "error";

export interface RemoteFavorites {
  fetchCount: () => Promise<number | null>;
  fetchAllExcept: (knownIds: ReadonlySet<string>, onFavoritesFound: (posts: Post[]) => void) => Promise<void>;
  add: (id: string) => Promise<AddFavoriteResult>;
  remove: (id: string) => Promise<RemoveFavoriteResult>;
}
