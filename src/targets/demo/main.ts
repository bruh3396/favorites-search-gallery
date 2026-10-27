import { DEFAULT_INDEXED_DB_CONFIGURATION, IndexedDbClient } from "@/adapters/browser/indexed_db/indexed_db_client";
import { FavoritesAppDependencies, composeFavoritesApp } from "@/core/app/favorites/favorites_app_composer";
import { BrowserClipboard } from "@/adapters/browser/ports/clipboard/browser_clipboard";
import { BrowserFileSaver } from "@/adapters/browser/ports/file_saver/browser_file_saver";
import { BrowserHostPage } from "@/adapters/browser/ports/host_page/browser_host_page";
import { BrowserLocalKeyedValues } from "@/adapters/browser/ports/local_keyed_values/browser_local_keyed_values";
import { BrowserNavigator } from "@/adapters/browser/ports/navigator/browser_navigator";
import { BrowserRandomSource } from "@/adapters/browser/ports/random_source/browser_random_source";
import { BrowserScheduler } from "@/adapters/browser/ports/scheduler/browser_scheduler";
import { BrowserSizeObserver } from "@/adapters/browser/ports/size_observer/browser_size_observer";
import { BrowserVisibilityObserver } from "@/adapters/browser/ports/visibility_observer/browser_visibility_observer";
import { IndexedDbLocalFavorites } from "@/adapters/browser/ports/local_favorites/indexed_db_local_favorites";
import { IndexedDbLocalPosts } from "@/adapters/browser/ports/local_posts/indexed_db_local_posts";
import { IndexedDbLocalTagCategories } from "@/adapters/browser/ports/local_tag_categories/indexed_db_local_tag_categories";
import { MemoryClient } from "@/adapters/memory/client/memory_client";
import { MemoryHostPage } from "@/adapters/memory/ports/host_page/memory_host_page";
import { MemoryRemoteFavorites } from "@/adapters/memory/ports/remote_favorites/memory_remote_favorites";
import { MemoryRemoteMedia } from "@/adapters/memory/ports/remote_media/memory_remote_media";
import { MemoryRemotePages } from "@/adapters/memory/ports/remote_pages/memory_remote_pages";
import { MemoryRemotePosts } from "@/adapters/memory/ports/remote_posts/memory_remote_posts";
import { createSamplePosts } from "@/targets/demo/sample_posts";
import { readPreferredColorScheme } from "@/adapters/browser/environment/browser_environment_reader";

const SAMPLE_POST_COUNT = 300;
const FAVORITES_OWNER_ID = "demo";

function createDemoDependencies(): FavoritesAppDependencies {
  const memory = new MemoryClient(createSamplePosts(SAMPLE_POST_COUNT));
  const indexedDb = new IndexedDbClient(DEFAULT_INDEXED_DB_CONFIGURATION, () => null);
  return {
    localFavorites: new IndexedDbLocalFavorites({ ownerId: FAVORITES_OWNER_ID }, indexedDb),
    localPosts: new IndexedDbLocalPosts(indexedDb),
    localTagCategories: new IndexedDbLocalTagCategories(indexedDb),
    localKeyedValues: new BrowserLocalKeyedValues(),
    remoteFavorites: new MemoryRemoteFavorites(memory),
    remotePosts: new MemoryRemotePosts(memory),
    remoteMedia: new MemoryRemoteMedia(),
    visibilityObserver: new BrowserVisibilityObserver(),
    remotePages: new MemoryRemotePages(),
    scheduler: new BrowserScheduler(),
    randomSource: new BrowserRandomSource(),
    sizeObserver: new BrowserSizeObserver(),
    navigator: new BrowserNavigator(),
    fileSaver: new BrowserFileSaver(document),
    clipboard: new BrowserClipboard(navigator.clipboard),
    hostPage: new MemoryHostPage()
  };
}

const hostPage = new BrowserHostPage();

composeFavoritesApp({
  userOwnsFavorites: true,
  blacklistedTags: [],
  favoritesOwnerId: FAVORITES_OWNER_ID,
  colorScheme: readPreferredColorScheme()
}, createDemoDependencies()).mount(hostPage.claimContent());
