import { DEFAULT_INDEXED_DB_CLIENT_CONFIGURATION, IndexedDbClient } from "@/adapters/browser/indexed_db/indexed_db_client";
import { FavoritesAppDependencies, composeFavoritesApp } from "@/core/app/favorites/favorites_app_composer";
import { decodeBitmap, loadImage } from "@/adapters/browser/image/image_utilities";
import { BrowserClipboard } from "@/adapters/browser/ports/clipboard/browser_clipboard";
import { BrowserFileSaver } from "@/adapters/browser/ports/file_saver/browser_file_saver";
import { BrowserHostPage } from "@/adapters/browser/ports/host_page/browser_host_page";
import { BrowserLocalKeyedValues } from "@/adapters/browser/ports/local_keyed_values/browser_local_keyed_values";
import { BrowserNavigator } from "@/adapters/browser/ports/navigator/browser_navigator";
import { BrowserRandomSource } from "@/adapters/browser/ports/random_source/browser_random_source";
import { BrowserScheduler } from "@/adapters/browser/ports/scheduler/browser_scheduler";
import { BrowserSizeObserver } from "@/adapters/browser/ports/size_observer/browser_size_observer";
import { BrowserVisibilityObserver } from "@/adapters/browser/ports/visibility_observer/browser_visibility_observer";
import { Environment } from "@/core/boundary/environment";
import { FallbackRemotePosts } from "@/core/boundary/ports/remote_posts/fallback_remote_posts";
import { FrozenCobaltClient } from "@/adapters/frozen_cobalt/client/frozen_cobalt_client";
import { FrozenCobaltRemotePosts } from "@/adapters/frozen_cobalt/ports/remote_posts/frozen_cobalt_remote_posts";
import { IndexedDbLocalFavorites } from "@/adapters/browser/ports/local_favorites/indexed_db_local_favorites";
import { IndexedDbLocalPosts } from "@/adapters/browser/ports/local_posts/indexed_db_local_posts";
import { IndexedDbLocalTagCategories } from "@/adapters/browser/ports/local_tag_categories/indexed_db_local_tag_categories";
import { MediaMinter } from "@/core/domain/media/media_minter";
import { MemoryHostPage } from "@/adapters/memory/ports/host_page/memory_host_page";
import { Rule34CdnClient } from "@/adapters/rule34_cdn/client/rule34_cdn_client";
import { Rule34CdnRemoteMedia } from "@/adapters/rule34_cdn/ports/remote_media/rule34_cdn_remote_media";
import { Rule34Client } from "@/adapters/rule34/client/rule34_client";
import { Rule34RemoteFavorites } from "@/adapters/rule34/ports/remote_favorites/rule34_remote_favorites";
import { Rule34RemotePages } from "@/adapters/rule34/ports/remote_pages/rule34_remote_pages";
import { Rule34RemotePosts } from "@/adapters/rule34/ports/remote_posts/rule34_remote_posts";

declare const USE_LOCAL_SERVER: boolean;
declare const FAVORITES_OWNER_ID: string;

const ENVIRONMENT: Environment = {
  appMode: "favorites",
  favoritesOwnerId: FAVORITES_OWNER_ID,
  ownsFavorites: true,
  blacklistedTags: [],
  colorScheme: "dark",
  device: "desktop",
  pointer: "hover",
  canvasBudget: "full",
  version: "playground"
};

function createFavoritesAppDependencies(): FavoritesAppDependencies {
  const scheduler = new BrowserScheduler();
  const randomSource = new BrowserRandomSource();
  const boundFetch = fetch.bind(globalThis);
  const rule34CdnClient = new Rule34CdnClient({ fetch: boundFetch, scheduler, loadImage, decodeBitmap });
  const mintMedia: MediaMinter = file => rule34CdnClient.mintMediaFromUrl(file);
  const rule34Document = {
    isFirstFavoritesPage: (): boolean => false,
    keepPaginator: (): void => { },
    readFavoritesOwnerId: (): string => ENVIRONMENT.favoritesOwnerId
  };
  const rule34Client = new Rule34Client({ fetch: boundFetch, scheduler, randomSource, mintMedia, rule34Document });
  const frozenCobaltClient = new FrozenCobaltClient({
    origin: USE_LOCAL_SERVER ? "http://localhost:8787" : "https://frozencobalt.stream",
    identity: { userId: ENVIRONMENT.favoritesOwnerId, version: ENVIRONMENT.version, platform: ENVIRONMENT.device }
  }, { scheduler, fetch: boundFetch });
  const indexedDbClient = new IndexedDbClient(DEFAULT_INDEXED_DB_CLIENT_CONFIGURATION, mintMedia);
  return {
    localFavorites: new IndexedDbLocalFavorites({ ownerId: ENVIRONMENT.favoritesOwnerId }, indexedDbClient),
    localPosts: new IndexedDbLocalPosts(indexedDbClient),
    localTagCategories: new IndexedDbLocalTagCategories(indexedDbClient),
    localKeyedValues: new BrowserLocalKeyedValues(),
    remoteFavorites: new Rule34RemoteFavorites({ rule34Client, rule34Document, fetch: boundFetch, scheduler, randomSource }),
    remotePosts: new FallbackRemotePosts({
      primaryRemotePosts: new FrozenCobaltRemotePosts({
        frozenCobaltClient,
        mintMedia: file => rule34CdnClient.mintMediaFromParts(file),
        scheduler,
        randomSource
      }),
      fallbackRemotePosts: new Rule34RemotePosts({ rule34Client, scheduler, randomSource })
    }),
    remoteMedia: new Rule34CdnRemoteMedia(rule34CdnClient),
    visibilityObserver: new BrowserVisibilityObserver(),
    remotePages: new Rule34RemotePages({ rule34Client, scheduler, randomSource }),
    scheduler,
    randomSource,
    sizeObserver: new BrowserSizeObserver(),
    navigator: new BrowserNavigator(),
    fileSaver: new BrowserFileSaver(document),
    clipboard: new BrowserClipboard(navigator.clipboard),
    hostPage: new MemoryHostPage()
  };
}

const browserHostPage = new BrowserHostPage();

composeFavoritesApp({
  userOwnsFavorites: ENVIRONMENT.ownsFavorites,
  blacklistedTags: ENVIRONMENT.blacklistedTags,
  favoritesOwnerId: ENVIRONMENT.favoritesOwnerId,
  colorScheme: ENVIRONMENT.colorScheme
}, createFavoritesAppDependencies()).mount(browserHostPage.claimContent());
