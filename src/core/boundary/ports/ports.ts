import { HostPage } from "@/core/boundary/ports/host_page";
import { LocalFavorites } from "@/core/boundary/ports/local_favorites";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values";
import { LocalPosts } from "@/core/boundary/ports/local_posts";
import { LocalTagCategories } from "@/core/boundary/ports/local_tag_categories";
import { Navigation } from "@/core/boundary/ports/navigation";
import { RemoteFavorites } from "@/core/boundary/ports/remote_favorites";
import { RemoteMedia } from "@/core/boundary/ports/remote_media";
import { RemotePosts } from "@/core/boundary/ports/remote_posts";
import { RemoteTagCategories } from "@/core/boundary/ports/remote_tag_categories";
import { Scheduler } from "@/core/boundary/ports/scheduler";

export interface Ports {
  hostPage: HostPage;
  localFavorites: LocalFavorites;
  localKeyedValues: LocalKeyedValues;
  localPosts: LocalPosts;
  localTagCategories: LocalTagCategories;
  navigation: Navigation;
  remoteFavorites: RemoteFavorites;
  remoteMedia: RemoteMedia;
  remotePosts: RemotePosts;
  remoteTagCategories: RemoteTagCategories;
  scheduler: Scheduler;
}
