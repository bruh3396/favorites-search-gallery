import { Post } from "@/core/domain/post/post";

export interface FavoritesSource {
  fetchAll: (onFavoritesFound: (posts: Post[]) => void) => Promise<void>;
  fetchNew: (existingIds: Set<string>) => Promise<Post[]>;
  count: () => Promise<number | null>;
}
