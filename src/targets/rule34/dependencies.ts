import { DEFAULT_INDEXED_DB_CONFIGURATION, IndexedDbClient, IndexedDbClientConfiguration } from "@/adapters/browser/indexed_db/client";
import { decodeBitmap, loadImage } from "@/adapters/browser/image/image";
import { BrowserClipboard } from "@/adapters/browser/ports/clipboard/clipboard";
import { BrowserFileSaver } from "@/adapters/browser/ports/file_saver/file_saver";
import { BrowserHostPage } from "@/adapters/browser/ports/host_page/host_page";
import { BrowserLocalKeyedValues } from "@/adapters/browser/ports/local_keyed_values/local_keyed_values";
import { BrowserNavigator } from "@/adapters/browser/ports/navigator/navigator";
import { BrowserRandomSource } from "@/adapters/browser/ports/random_source/random_source";
import { BrowserScheduler } from "@/adapters/browser/ports/scheduler/scheduler";
import { BrowserSizeObserver } from "@/adapters/browser/ports/size_observer/size_observer";
import { BrowserVisibilityObserver } from "@/adapters/browser/ports/visibility_observer/visibility_observer";
import { Environment } from "@/core/boundary/environment";
import { FallbackRemotePosts } from "@/core/boundary/ports/remote_posts/fallback_remote_posts";
import { FavoritesAppDependencies } from "@/core/app/favorites/composer";
import { FrozenCobaltClient } from "@/adapters/frozen_cobalt/client/client";
import { FrozenCobaltRemotePosts } from "@/adapters/frozen_cobalt/ports/remote_posts/remote_posts";
import { IndexedDbLocalFavorites } from "@/adapters/browser/ports/local_favorites/local_favorites";
import { IndexedDbLocalPosts } from "@/adapters/browser/ports/local_posts/local_posts";
import { IndexedDbLocalTagCategories } from "@/adapters/browser/ports/local_tag_categories/local_tag_categories";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";
import { Media } from "@/core/domain/media/media";
import { NamespacedLocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/namespaced_local_keyed_values";
import { RandomSource } from "@/core/boundary/ports/random_source/random_source";
import { Rule34CdnClient } from "@/adapters/rule34_cdn/client/client";
import { Rule34CdnRemoteMedia } from "@/adapters/rule34_cdn/ports/remote_media/remote_media";
import { Rule34Client } from "@/adapters/rule34/client/client";
import { Rule34Document } from "@/adapters/rule34/document/document";
import { Rule34HostPage } from "@/adapters/rule34/ports/host_page/host_page";
import { Rule34RemoteFavorites } from "@/adapters/rule34/ports/remote_favorites/remote_favorites";
import { Rule34RemotePages } from "@/adapters/rule34/ports/remote_pages/remote_pages";
import { Rule34RemotePosts } from "@/adapters/rule34/ports/remote_posts/remote_posts";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

declare const USE_LOCAL_SERVER: boolean;

export interface Rule34DependenciesConfiguration {
  readonly indexedDb: IndexedDbClientConfiguration;
  readonly localKeyedValuesNamespace: string | null;
}

export const DEFAULT_RULE34_DEPENDENCIES_CONFIGURATION: Rule34DependenciesConfiguration = {
  indexedDb: DEFAULT_INDEXED_DB_CONFIGURATION,
  localKeyedValuesNamespace: null
};

export interface Rule34Dependencies {
  fetch: typeof fetch;
  scheduler: Scheduler;
  randomSource: RandomSource;
  mintMedia: (file: { url: string; tags: string }) => Media | null;
  rule34: Rule34Client;
  rule34Document: Rule34Document;
  rule34Cdn: Rule34CdnClient;
  hostPage: Rule34HostPage;
  localKeyedValues: LocalKeyedValues;
}

export function createRule34Dependencies(
  configuration: Rule34DependenciesConfiguration,
  environment: Environment,
  rule34Document: Rule34Document
): Rule34Dependencies {
  const scheduler = new BrowserScheduler();
  const randomSource = new BrowserRandomSource();
  const boundFetch = fetch.bind(globalThis);
  const rule34Cdn = new Rule34CdnClient({ fetch: boundFetch, scheduler, loadImage, decodeBitmap });
  const mintMedia = (file: { url: string; tags: string }): Media | null => rule34Cdn.mintMedia(file);
  const rule34 = new Rule34Client({ fetch: boundFetch, scheduler, randomSource, mintMedia, rule34Document });
  const hostPage = new Rule34HostPage({ mode: environment.mode }, { rule34Document, page: new BrowserHostPage() });
  const { localKeyedValuesNamespace: namespace } = configuration;
  const browserLocalKeyedValues = new BrowserLocalKeyedValues();
  const localKeyedValues = namespace === null ? browserLocalKeyedValues : new NamespacedLocalKeyedValues(namespace, browserLocalKeyedValues);
  return {
    fetch: boundFetch, scheduler, randomSource, mintMedia, rule34, rule34Document, rule34Cdn,
    hostPage, localKeyedValues
  };
}

export function createFavoritesDependencies(
  configuration: Rule34DependenciesConfiguration,
  environment: Environment,
  dependencies: Rule34Dependencies
): FavoritesAppDependencies {
  const { fetch, scheduler, randomSource, mintMedia, rule34, rule34Document, rule34Cdn, hostPage, localKeyedValues } = dependencies;
  const frozenCobalt = new FrozenCobaltClient({
    origin: USE_LOCAL_SERVER ? "http://localhost:8787" : "https://frozencobalt.stream",
    identity: { userId: rule34Document.readUserId(), version: environment.version, platform: environment.device }
  }, { scheduler, fetch });
  const indexedDb = new IndexedDbClient(configuration.indexedDb, mintMedia);
  return {
    scheduler,
    randomSource,
    localKeyedValues,
    hostPage,
    sizeObserver: new BrowserSizeObserver(),
    navigator: new BrowserNavigator(),
    fileSaver: new BrowserFileSaver(document),
    clipboard: new BrowserClipboard(navigator.clipboard),
    localFavorites: new IndexedDbLocalFavorites({ ownerId: environment.favoritesOwnerId }, indexedDb),
    localPosts: new IndexedDbLocalPosts(indexedDb),
    localTagCategories: new IndexedDbLocalTagCategories(indexedDb),
    remoteFavorites: new Rule34RemoteFavorites({ rule34, rule34Document, fetch, scheduler, randomSource }),
    remotePosts: new FallbackRemotePosts({
      primary: new FrozenCobaltRemotePosts({ frozenCobalt, mintMedia, scheduler, randomSource }),
      fallback: new Rule34RemotePosts({ rule34, scheduler, randomSource })
    }),
    remoteMedia: new Rule34CdnRemoteMedia(rule34Cdn),
    remotePages: new Rule34RemotePages(rule34),
    visibilityObserver: new BrowserVisibilityObserver()
  };
}
