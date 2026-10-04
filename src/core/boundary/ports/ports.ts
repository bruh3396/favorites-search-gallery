import { HostPage } from "@/core/boundary/ports/host_page/host_page";
import { LocalFavorites } from "@/core/boundary/ports/local_favorites/local_favorites";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";
import { LocalPosts } from "@/core/boundary/ports/local_posts/local_posts";
import { LocalTagCategories } from "@/core/boundary/ports/local_tag_categories/local_tag_categories";
import { Navigator } from "@/core/boundary/ports/navigator/navigator";
import { RandomSource } from "@/core/boundary/ports/random_source/random_source";
import { RemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/remote_favorite_actions";
import { RemoteFavorites } from "@/core/boundary/ports/remote_favorites/remote_favorites";
import { RemoteMedia } from "@/core/boundary/ports/remote_media/remote_media";
import { RemotePages } from "@/core/boundary/ports/remote_pages/remote_pages";
import { RemotePosts } from "@/core/boundary/ports/remote_posts/remote_posts";
import { RemoteSearchResults } from "@/core/boundary/ports/remote_search_results/remote_search_results";
import { RemoteTagCategories } from "@/core/boundary/ports/remote_tag_categories/remote_tag_categories";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

export interface Ports {
  hostPage: HostPage;
  localFavorites: LocalFavorites;
  localKeyedValues: LocalKeyedValues;
  localPosts: LocalPosts;
  localTagCategories: LocalTagCategories;
  navigator: Navigator;
  randomSource: RandomSource;
  remoteFavoriteActions: RemoteFavoriteActions;
  remoteFavorites: RemoteFavorites;
  remoteMedia: RemoteMedia;
  remotePages: RemotePages;
  remotePosts: RemotePosts;
  remoteSearchResults: RemoteSearchResults;
  remoteTagCategories: RemoteTagCategories;
  scheduler: Scheduler;
}
