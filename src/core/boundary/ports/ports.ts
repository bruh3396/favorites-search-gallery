import { HostPage } from "@/core/boundary/ports/host_page";
import { LocalFavorites } from "@/core/boundary/ports/local_favorites";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values";
import { LocalPosts } from "@/core/boundary/ports/local_posts";
import { LocalTagCategories } from "@/core/boundary/ports/local_tag_categories";
import { Navigator } from "@/core/boundary/ports/navigator";
import { RandomSource } from "@/core/boundary/ports/random_source";
import { RemoteFavorites } from "@/core/boundary/ports/remote_favorites";
import { RemoteMedia } from "@/core/boundary/ports/remote_media";
import { RemotePages } from "@/core/boundary/ports/remote_pages";
import { RemotePosts } from "@/core/boundary/ports/remote_posts";
import { RemoteSearchResults } from "@/core/boundary/ports/remote_search_results";
import { RemoteTagCategories } from "@/core/boundary/ports/remote_tag_categories";
import { Scheduler } from "@/core/boundary/ports/scheduler";

export interface Ports {
  hostPage: HostPage;
  localFavorites: LocalFavorites;
  localKeyedValues: LocalKeyedValues;
  localPosts: LocalPosts;
  localTagCategories: LocalTagCategories;
  navigator: Navigator;
  randomSource: RandomSource;
  remoteFavorites: RemoteFavorites;
  remoteMedia: RemoteMedia;
  remotePages: RemotePages;
  remotePosts: RemotePosts;
  remoteSearchResults: RemoteSearchResults;
  remoteTagCategories: RemoteTagCategories;
  scheduler: Scheduler;
}
