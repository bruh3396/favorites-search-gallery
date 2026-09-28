import { FavoritesEditor } from "@/core/boundary/ports/favorites_editor";
import { FavoritesSource } from "@/core/boundary/ports/favorites_source";
import { Host } from "@/core/boundary/ports/host";
import { KeyValueStore } from "@/core/boundary/ports/key_value_store";
import { MediaSource } from "@/core/boundary/ports/media_source";
import { Navigation } from "@/core/boundary/ports/navigation";
import { PostSource } from "@/core/boundary/ports/post_source";
import { TagSource } from "@/core/boundary/ports/tag_source";

export interface Ports {
  favoritesEditor: FavoritesEditor;
  favoritesSource: FavoritesSource;
  host: Host;
  keyValueStore: KeyValueStore;
  mediaSource: MediaSource;
  navigation: Navigation;
  postSource: PostSource;
  tagSource: TagSource;
}
