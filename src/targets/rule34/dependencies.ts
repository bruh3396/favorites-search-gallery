import { DEFAULT_INDEXED_DB_CONFIGURATION, IndexedDbClient, IndexedDbClientConfiguration } from "@/adapters/browser/indexed_db/indexed_db_client";
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
import { FavoritesAppDependencies } from "@/core/app/favorites/favorites_app_composer";
import { IndexedDbLocalFavorites } from "@/adapters/browser/ports/local_favorites/indexed_db_local_favorites";
import { IndexedDbLocalPosts } from "@/adapters/browser/ports/local_posts/indexed_db_local_posts";
import { IndexedDbLocalTagCategories } from "@/adapters/browser/ports/local_tag_categories/indexed_db_local_tag_categories";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";
import { Media } from "@/core/domain/media/media";
import { NamespacedLocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/namespaced_local_keyed_values";
import { RandomSource } from "@/core/boundary/ports/random_source/random_source";
import { RemotePosts } from "@/core/boundary/ports/remote_posts/remote_posts";
import { Rule34CdnClient } from "@/adapters/rule34_cdn/client/rule34_cdn_client";
import { Rule34CdnRemoteMedia } from "@/adapters/rule34_cdn/ports/remote_media/rule34_cdn_remote_media";
import { Rule34Client } from "@/adapters/rule34/client/rule34_client";
import { Rule34Document } from "@/adapters/rule34/document/rule34_document";
import { Rule34HostPage } from "@/adapters/rule34/ports/host_page/rule34_host_page";
import { Rule34RemoteFavorites } from "@/adapters/rule34/ports/remote_favorites/rule34_remote_favorites";
import { Rule34RemotePages } from "@/adapters/rule34/ports/remote_pages/rule34_remote_pages";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

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
  dependencies: Rule34Dependencies,
  remotePosts: RemotePosts
): FavoritesAppDependencies {
  const { fetch, scheduler, randomSource, mintMedia, rule34, rule34Document, rule34Cdn, hostPage, localKeyedValues } = dependencies;
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
    remotePosts,
    remoteMedia: new Rule34CdnRemoteMedia(rule34Cdn),
    remotePages: new Rule34RemotePages(rule34),
    visibilityObserver: new BrowserVisibilityObserver()
  };
}
