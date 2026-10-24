import { DEFAULT_INDEXED_DB_CONFIGURATION, IndexedDbClient } from "@/adapters/browser/indexed_db/client";
import { FavoritesAppDependencies, composeFavoritesApp } from "@/core/app/favorites/composer";
import { decodeBitmap, loadImage } from "@/adapters/browser/image/image";
import { BrowserFileSaver } from "@/adapters/browser/ports/file_saver/file_saver";
import { BrowserHostPage } from "@/adapters/browser/ports/host_page/host_page";
import { BrowserLocalKeyedValues } from "@/adapters/browser/ports/local_keyed_values/local_keyed_values";
import { BrowserNavigator } from "@/adapters/browser/ports/navigator/navigator";
import { BrowserPageVisibility } from "@/adapters/browser/ports/page_visibility/page_visibility";
import { BrowserRandomSource } from "@/adapters/browser/ports/random_source/random_source";
import { BrowserScheduler } from "@/adapters/browser/ports/scheduler/scheduler";
import { BrowserSizeObserver } from "@/adapters/browser/ports/size_observer/size_observer";
import { BrowserVisibilityObserver } from "@/adapters/browser/ports/visibility_observer/visibility_observer";
import { Environment } from "@/core/boundary/environment";
import { FallbackRemotePosts } from "@/core/boundary/ports/remote_posts/fallback_remote_posts";
import { FrozenCobaltClient } from "@/adapters/frozen_cobalt/client/client";
import { FrozenCobaltRemotePosts } from "@/adapters/frozen_cobalt/ports/remote_posts/remote_posts";
import { IndexedDbLocalFavorites } from "@/adapters/browser/ports/local_favorites/local_favorites";
import { IndexedDbLocalPosts } from "@/adapters/browser/ports/local_posts/local_posts";
import { IndexedDbLocalTagCategories } from "@/adapters/browser/ports/local_tag_categories/local_tag_categories";
import { MemoryHostPage } from "@/adapters/memory/ports/host_page/host_page";
import { Media } from "@/core/domain/media/media";
import { Rule34CdnClient } from "@/adapters/rule34_cdn/client/client";
import { Rule34CdnRemoteMedia } from "@/adapters/rule34_cdn/ports/remote_media/remote_media";
import { Rule34Client } from "@/adapters/rule34/client/client";
import { Rule34RemoteFavorites } from "@/adapters/rule34/ports/remote_favorites/remote_favorites";
import { Rule34RemotePages } from "@/adapters/rule34/ports/remote_pages/remote_pages";
import { Rule34RemotePosts } from "@/adapters/rule34/ports/remote_posts/remote_posts";

declare const USE_LOCAL_SERVER: boolean;
declare const FAVORITES_OWNER_ID: string;

const ENVIRONMENT: Environment = {
  mode: "favorites",
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
  const rule34Cdn = new Rule34CdnClient({ fetch: boundFetch, scheduler, loadImage, decodeBitmap });
  const mintMedia = (file: { url: string; tags: string }): Media | null => rule34Cdn.mintMedia(file);
  const rule34Document = {
    isFirstFavoritesPage: (): boolean => false,
    keepPaginator: (): void => { },
    readFavoritesPageId: (): string => ENVIRONMENT.favoritesOwnerId
  };
  const rule34 = new Rule34Client({ fetch: boundFetch, scheduler, randomSource, mintMedia, rule34Document });
  const frozenCobalt = new FrozenCobaltClient({
    origin: USE_LOCAL_SERVER ? "http://localhost:8787" : "https://frozencobalt.stream",
    identity: { userId: ENVIRONMENT.favoritesOwnerId, version: ENVIRONMENT.version, platform: ENVIRONMENT.device }
  }, { scheduler, fetch: boundFetch });
  const indexedDb = new IndexedDbClient(DEFAULT_INDEXED_DB_CONFIGURATION, mintMedia);
  return {
    localFavorites: new IndexedDbLocalFavorites({ ownerId: ENVIRONMENT.favoritesOwnerId }, indexedDb),
    localPosts: new IndexedDbLocalPosts(indexedDb),
    localTagCategories: new IndexedDbLocalTagCategories(indexedDb),
    localKeyedValues: new BrowserLocalKeyedValues(),
    remoteFavorites: new Rule34RemoteFavorites({ rule34, rule34Document, fetch: boundFetch, scheduler, randomSource }),
    remotePosts: new FallbackRemotePosts({
      primary: new FrozenCobaltRemotePosts({ frozenCobalt, mintMedia, scheduler, randomSource }),
      fallback: new Rule34RemotePosts({ rule34, scheduler, randomSource })
    }),
    remoteMedia: new Rule34CdnRemoteMedia(rule34Cdn),
    visibilityObserver: new BrowserVisibilityObserver(),
    remotePages: new Rule34RemotePages(rule34),
    scheduler,
    randomSource,
    sizeObserver: new BrowserSizeObserver(),
    navigator: new BrowserNavigator(),
    fileSaver: new BrowserFileSaver(document),
    pageVisibility: new BrowserPageVisibility(document),
    hostPage: new MemoryHostPage()
  };
}

const hostPage = new BrowserHostPage();

composeFavoritesApp({
  userOwnsFavorites: ENVIRONMENT.ownsFavorites,
  blacklistedTags: ENVIRONMENT.blacklistedTags,
  favoritesOwnerId: ENVIRONMENT.favoritesOwnerId,
  colorScheme: ENVIRONMENT.colorScheme
}, createFavoritesAppDependencies()).mount(hostPage.claimContent());
