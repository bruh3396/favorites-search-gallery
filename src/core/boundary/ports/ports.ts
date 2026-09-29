import { Host } from "@/core/boundary/ports/host";
import { KeyValueStore } from "@/core/boundary/ports/key_value_store";
import { Navigation } from "@/core/boundary/ports/navigation";
import { RemoteFavorites } from "@/core/boundary/ports/remote_favorites";
import { RemoteMedia } from "@/core/boundary/ports/remote_media";
import { RemotePosts } from "@/core/boundary/ports/remote_posts";
import { RemoteTagCategories } from "@/core/boundary/ports/remote_tag_categories";

export interface Ports {
  host: Host;
  keyValueStore: KeyValueStore;
  navigation: Navigation;
  remoteFavorites: RemoteFavorites;
  remoteMedia: RemoteMedia;
  remotePosts: RemotePosts;
  remoteTagCategories: RemoteTagCategories;
}
