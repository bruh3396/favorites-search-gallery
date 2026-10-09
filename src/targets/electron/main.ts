import { FavoritesPageDependencies, mountFavoritesPage } from "@/core/app/favorites_page/favorites_page";
import { BrowserHostPage } from "@/adapters/browser/ports/host_page/host_page";
import { BrowserLocalKeyedValues } from "@/adapters/browser/ports/local_keyed_values/local_keyed_values";
import { BrowserRandomSource } from "@/adapters/browser/ports/random_source/random_source";
import { BrowserScheduler } from "@/adapters/browser/ports/scheduler/scheduler";
import { Environment } from "@/core/boundary/environment";
import { FallbackRemotePosts } from "@/core/boundary/ports/remote_posts/fallback_remote_posts";
import { FrozenCobaltClient } from "@/adapters/frozen_cobalt/client/client";
import { FrozenCobaltRemotePosts } from "@/adapters/frozen_cobalt/ports/remote_posts/remote_posts";
import { IndexedDbClient } from "@/adapters/indexed_db/client/client";
import { IndexedDbLocalFavorites } from "@/adapters/indexed_db/ports/local_favorites/local_favorites";
import { IndexedDbLocalPosts } from "@/adapters/indexed_db/ports/local_posts/local_posts";
import { IndexedDbLocalTagCategories } from "@/adapters/indexed_db/ports/local_tag_categories/local_tag_categories";
import { Media } from "@/core/domain/media/media";
import { Rule34CdnClient } from "@/adapters/rule34_cdn/client/client";
import { Rule34CdnRemoteMedia } from "@/adapters/rule34_cdn/ports/remote_media/remote_media";
import { Rule34Client } from "@/adapters/rule34/client/client";
import { Rule34RemoteFavoriteActions } from "@/adapters/rule34/ports/remote_favorite_actions/remote_favorite_actions";
import { Rule34RemoteFavorites } from "@/adapters/rule34/ports/remote_favorites/remote_favorites";
import { Rule34RemotePages } from "@/adapters/rule34/ports/remote_pages/remote_pages";
import { Rule34RemotePosts } from "@/adapters/rule34/ports/remote_posts/remote_posts";

declare const USE_LOCAL_SERVER: boolean;
declare const FAVORITES_OWNER_ID: string;

const ENVIRONMENT: Environment = {
  mode: "favorites",
  favoritesOwnerId: FAVORITES_OWNER_ID,
  ownsFavorites: true,
  blacklistedTags: "",
  colorScheme: "dark",
  device: "desktop",
  pointer: "hover",
  canvasBudget: "full",
  version: "playground"
};

function createFavoritesPageDependencies(hostPage: BrowserHostPage): FavoritesPageDependencies {
  const scheduler = new BrowserScheduler();
  const randomSource = new BrowserRandomSource();
  const boundFetch = fetch.bind(globalThis);
  const rule34Cdn = new Rule34CdnClient({ fetch: boundFetch, scheduler });
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
  const indexedDb = new IndexedDbClient();
  return {
    localFavorites: new IndexedDbLocalFavorites({ ownerId: ENVIRONMENT.favoritesOwnerId }, indexedDb),
    localPosts: new IndexedDbLocalPosts(indexedDb),
    localTagCategories: new IndexedDbLocalTagCategories(indexedDb),
    localKeyedValues: new BrowserLocalKeyedValues(),
    remoteFavorites: new Rule34RemoteFavorites({ rule34, rule34Document, scheduler, randomSource }),
    remoteFavoriteActions: new Rule34RemoteFavoriteActions({ fetch: boundFetch, scheduler, randomSource }),
    remotePosts: new FallbackRemotePosts({
      primary: new FrozenCobaltRemotePosts({ frozenCobalt, mintMedia, scheduler, randomSource }),
      fallback: new Rule34RemotePosts({ rule34, scheduler, randomSource })
    }),
    remoteMedia: new Rule34CdnRemoteMedia(rule34Cdn),
    remotePages: new Rule34RemotePages(rule34),
    scheduler,
    randomSource,
    hostPage
  };
}

const hostPage = new BrowserHostPage();

mountFavoritesPage(hostPage.claimContent(), {
  userOwnsFavorites: ENVIRONMENT.ownsFavorites,
  blacklistedTags: ENVIRONMENT.blacklistedTags,
  favoritesOwnerId: ENVIRONMENT.favoritesOwnerId,
  colorScheme: ENVIRONMENT.colorScheme
}, createFavoritesPageDependencies(hostPage));
