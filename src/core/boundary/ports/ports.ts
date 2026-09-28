import { FavoritesEditor } from "@/core/boundary/ports/favorites_editor";
import { FavoritesSource } from "@/core/boundary/ports/favorites_source";
import { Host } from "@/core/boundary/ports/host";
import { MediaSource } from "@/core/boundary/ports/media_source";
import { Navigation } from "@/core/boundary/ports/navigation";
import { PostSource } from "@/core/boundary/ports/post_source";
import { TagSource } from "@/core/boundary/ports/tag_source";

export interface Ports {
  postSource: PostSource;
  tagSource: TagSource;
  mediaSource: MediaSource;
  favoritesSource: FavoritesSource;
  favoritesEditor: FavoritesEditor;
  navigation: Navigation;
  host: Host;
}
