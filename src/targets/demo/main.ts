import { FavoritesPageDependencies, mountFavoritesPage } from "@/core/app/favorites_page/favorites_page";
import { BrowserHostPage } from "@/adapters/browser/ports/host_page/host_page";
import { BrowserLocalKeyedValues } from "@/adapters/browser/ports/local_keyed_values/local_keyed_values";
import { BrowserRandomSource } from "@/adapters/browser/ports/random_source/random_source";
import { BrowserScheduler } from "@/adapters/browser/ports/scheduler/scheduler";
import { IndexedDbClient } from "@/adapters/indexed_db/client/client";
import { IndexedDbLocalFavorites } from "@/adapters/indexed_db/ports/local_favorites/local_favorites";
import { IndexedDbLocalPosts } from "@/adapters/indexed_db/ports/local_posts/local_posts";
import { IndexedDbLocalTagCategories } from "@/adapters/indexed_db/ports/local_tag_categories/local_tag_categories";
import { MemoryClient } from "@/adapters/memory/client/client";
import { MemoryRemoteFavoriteActions } from "@/adapters/memory/ports/remote_favorite_actions/remote_favorite_actions";
import { MemoryRemoteFavorites } from "@/adapters/memory/ports/remote_favorites/remote_favorites";
import { MemoryRemoteMedia } from "@/adapters/memory/ports/remote_media/remote_media";
import { MemoryRemotePosts } from "@/adapters/memory/ports/remote_posts/remote_posts";
import { MemoryRemoteTagCategories } from "@/adapters/memory/ports/remote_tag_categories/remote_tag_categories";
import { createSamplePosts } from "@/targets/demo/sample_posts";
import { readPreferredColorScheme } from "@/adapters/browser/environment/environment";

const SAMPLE_POST_COUNT = 300;
const FAVORITES_OWNER_ID = "demo";

function createDemoDependencies(): FavoritesPageDependencies {
  const memory = new MemoryClient(createSamplePosts(SAMPLE_POST_COUNT));
  const indexedDb = new IndexedDbClient();
  return {
    localFavorites: new IndexedDbLocalFavorites({ ownerId: FAVORITES_OWNER_ID }, indexedDb),
    localPosts: new IndexedDbLocalPosts(indexedDb),
    localTagCategories: new IndexedDbLocalTagCategories(indexedDb),
    localKeyedValues: new BrowserLocalKeyedValues(),
    remoteFavorites: new MemoryRemoteFavorites(memory),
    remoteFavoriteActions: new MemoryRemoteFavoriteActions(memory),
    remotePosts: new MemoryRemotePosts(memory),
    remoteTagCategories: new MemoryRemoteTagCategories(),
    remoteMedia: new MemoryRemoteMedia(),
    scheduler: new BrowserScheduler(),
    randomSource: new BrowserRandomSource()
  };
}

mountFavoritesPage(new BrowserHostPage().claimContent(), {
  userOwnsFavorites: true,
  blacklistedTags: "",
  favoritesOwnerId: FAVORITES_OWNER_ID,
  colorScheme: readPreferredColorScheme()
}, createDemoDependencies());
