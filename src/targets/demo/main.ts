import { FavoritesPageDependencies, mountFavoritesPage } from "@/core/app/favorites_page/composer";
import { BrowserHostPage } from "@/adapters/browser/ports/host_page/host_page";
import { BrowserLocalKeyedValues } from "@/adapters/browser/ports/local_keyed_values/local_keyed_values";
import { BrowserMorpher } from "@/adapters/browser/ports/morpher/morpher";
import { BrowserNavigator } from "@/adapters/browser/ports/navigator/navigator";
import { BrowserRandomSource } from "@/adapters/browser/ports/random_source/random_source";
import { BrowserScheduler } from "@/adapters/browser/ports/scheduler/scheduler";
import { BrowserViewport } from "@/adapters/browser/ports/viewport/viewport";
import { BrowserVisibilityObserver } from "@/adapters/browser/ports/visibility_observer/visibility_observer";
import { IndexedDbClient } from "@/adapters/browser/indexed_db/client";
import { IndexedDbLocalFavorites } from "@/adapters/browser/ports/local_favorites/local_favorites";
import { IndexedDbLocalPosts } from "@/adapters/browser/ports/local_posts/local_posts";
import { IndexedDbLocalTagCategories } from "@/adapters/browser/ports/local_tag_categories/local_tag_categories";
import { MemoryClient } from "@/adapters/memory/client/client";
import { MemoryRemoteFavoriteActions } from "@/adapters/memory/ports/remote_favorite_actions/remote_favorite_actions";
import { MemoryRemoteFavorites } from "@/adapters/memory/ports/remote_favorites/remote_favorites";
import { MemoryRemoteMedia } from "@/adapters/memory/ports/remote_media/remote_media";
import { MemoryRemotePages } from "@/adapters/memory/ports/remote_pages/remote_pages";
import { MemoryRemotePosts } from "@/adapters/memory/ports/remote_posts/remote_posts";
import { createSamplePosts } from "@/targets/demo/sample_posts";
import { readPreferredColorScheme } from "@/adapters/browser/environment/environment";

const SAMPLE_POST_COUNT = 300;
const FAVORITES_OWNER_ID = "demo";

function createDemoDependencies(): FavoritesPageDependencies {
  const memory = new MemoryClient(createSamplePosts(SAMPLE_POST_COUNT));
  const indexedDb = new IndexedDbClient(() => null);
  return {
    localFavorites: new IndexedDbLocalFavorites({ ownerId: FAVORITES_OWNER_ID }, indexedDb),
    localPosts: new IndexedDbLocalPosts(indexedDb),
    localTagCategories: new IndexedDbLocalTagCategories(indexedDb),
    localKeyedValues: new BrowserLocalKeyedValues(),
    remoteFavorites: new MemoryRemoteFavorites(memory),
    remoteFavoriteActions: new MemoryRemoteFavoriteActions(memory),
    remotePosts: new MemoryRemotePosts(memory),
    remoteMedia: new MemoryRemoteMedia(),
    visibilityObserver: new BrowserVisibilityObserver(),
    remotePages: new MemoryRemotePages(),
    scheduler: new BrowserScheduler(),
    randomSource: new BrowserRandomSource(),
    viewport: new BrowserViewport(),
    morpher: new BrowserMorpher(),
    navigator: new BrowserNavigator()
  };
}

const hostPage = new BrowserHostPage();

mountFavoritesPage(hostPage.claimContent(), {
  userOwnsFavorites: true,
  blacklistedTags: [],
  favoritesOwnerId: FAVORITES_OWNER_ID,
  colorScheme: readPreferredColorScheme()
}, createDemoDependencies());
