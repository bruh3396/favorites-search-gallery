import { LocalFavorites } from "@/core/boundary/ports/local_favorites/local_favorites";
import { LocalPosts } from "@/core/boundary/ports/local_posts/local_posts";
import { LocalTagCategories } from "@/core/boundary/ports/local_tag_categories/local_tag_categories";
import { RandomSource } from "@/core/boundary/ports/random_source/random_source";
import { Rating } from "@/core/domain/post/post";
import { RemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/remote_favorite_actions";
import { RemoteFavorites } from "@/core/boundary/ports/remote_favorites/remote_favorites";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { RemotePosts } from "@/core/boundary/ports/remote_posts/remote_posts";
import { RemoteTagCategories } from "@/core/boundary/ports/remote_tag_categories/remote_tag_categories";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { SortOrder } from "@/core/features/favorites/types/search";

export interface FavoritesConfiguration {
  isOwnFavorites: boolean;
  blacklistedTags: string;
}

export interface FavoritesDependencies {
  localFavorites: LocalFavorites;
  localPosts: LocalPosts;
  localTagCategories: LocalTagCategories;
  remoteFavorites: RemoteFavorites;
  remoteFavoriteActions: RemoteFavoriteActions;
  remotePosts: RemotePosts;
  remoteTagCategories: RemoteTagCategories;
  remoteMedia: RemoteMedia;
  scheduler: Scheduler;
  randomSource: RandomSource;
}

export interface FavoritesIntents {
  search: (query: string) => void;
  sortBy: (sortOrder: SortOrder) => void;
  allowRatings: (ratings: ReadonlySet<Rating>) => void;
  excludeBlacklist: (excludes: boolean) => void;
  shuffle: () => void;
  invert: () => void;
  showPage: (page: number) => void;
  removeFavorite: (id: string) => void;
}
