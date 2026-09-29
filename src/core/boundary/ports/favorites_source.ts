import { Post } from "@/core/domain/post/post";

export interface FavoritesSource {
  fetchCount: () => Promise<number | null>;
  fetchMissing: (knownIds: ReadonlySet<string>, onFavoritesFound: (posts: Post[]) => void) => Promise<void>;
}
