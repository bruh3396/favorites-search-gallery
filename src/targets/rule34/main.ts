import { AppMode, Environment } from "@/core/boundary/environment";
import { DEFAULT_INDEXED_DB_CONFIGURATION, IndexedDbClient } from "@/adapters/browser/indexed_db/indexed_db_client";
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
import { FallbackRemotePosts } from "@/core/boundary/ports/remote_posts/fallback_remote_posts";
import { FrozenCobaltClient } from "@/adapters/frozen_cobalt/client/frozen_cobalt_client";
import { FrozenCobaltRemotePosts } from "@/adapters/frozen_cobalt/ports/remote_posts/frozen_cobalt_remote_posts";
import { IndexedDbLocalFavorites } from "@/adapters/browser/ports/local_favorites/indexed_db_local_favorites";
import { IndexedDbLocalPosts } from "@/adapters/browser/ports/local_posts/indexed_db_local_posts";
import { IndexedDbLocalTagCategories } from "@/adapters/browser/ports/local_tag_categories/indexed_db_local_tag_categories";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";
import { MediaMinter } from "@/core/domain/media/media_minter";
import { RandomSource } from "@/core/boundary/ports/random_source/random_source";
import { Rule34CdnClient } from "@/adapters/rule34_cdn/client/rule34_cdn_client";
import { Rule34CdnRemoteMedia } from "@/adapters/rule34_cdn/ports/remote_media/rule34_cdn_remote_media";
import { Rule34Client } from "@/adapters/rule34/client/rule34_client";
import { Rule34Document } from "@/adapters/rule34/document/rule34_document";
import { Rule34HostPage } from "@/adapters/rule34/ports/host_page/rule34_host_page";
import { Rule34RemoteFavorites } from "@/adapters/rule34/ports/remote_favorites/rule34_remote_favorites";
import { Rule34RemotePages } from "@/adapters/rule34/ports/remote_pages/rule34_remote_pages";
import { Rule34RemotePostList } from "@/adapters/rule34/ports/remote_post_list/rule34_remote_post_list";
import { Rule34RemotePosts } from "@/adapters/rule34/ports/remote_posts/rule34_remote_posts";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { composeFavoritesApp } from "@/core/app/favorites/favorites_app_composer";
import { composePostListApp } from "@/core/app/post_list/post_list_app_composer";
import { APP_STORAGE_SCHEMA } from "@/core/app/app_storage_schema";
import { createAppStorage } from "@/core/app/app_storage";
import { createStoredTree } from "@/core/utils/stored_value/stored_tree";
import { readBrowserEnvironment } from "@/adapters/browser/environment/browser_environment_reader";
import { readRule34Environment } from "@/adapters/rule34/environment/rule34_environment_reader";

declare const SCRIPT_VERSION: string;
declare const USE_LOCAL_SERVER: boolean;

interface Rule34Dependencies {
  fetch: typeof fetch;
  scheduler: Scheduler;
  randomSource: RandomSource;
  mintMedia: MediaMinter;
  rule34Client: Rule34Client;
  rule34Document: Rule34Document;
  rule34CdnClient: Rule34CdnClient;
  hostPage: Rule34HostPage;
  localKeyedValues: LocalKeyedValues;
}

type StartApp = (environment: Environment, dependencies: Rule34Dependencies) => void;

const APPS: Record<AppMode, StartApp> = {
  favorites: startFavoritesApp,
  postList: startPostListApp
};

function readEnvironment(rule34Document: Rule34Document): Environment {
  const hostEnvironment = readRule34Environment(rule34Document);

  if (hostEnvironment === null) {
    throw new Error(`Unsupported page: ${location.href}`);
  }
  return { version: SCRIPT_VERSION, ...readBrowserEnvironment(), ...hostEnvironment };
}

function createRule34Dependencies(environment: Environment, rule34Document: Rule34Document): Rule34Dependencies {
  const scheduler = new BrowserScheduler();
  const randomSource = new BrowserRandomSource();
  const boundFetch = fetch.bind(globalThis);
  const rule34CdnClient = new Rule34CdnClient({ fetch: boundFetch, scheduler, loadImage, decodeBitmap });
  const mintMedia: MediaMinter = file => rule34CdnClient.mintMediaFromUrl(file);
  const rule34Client = new Rule34Client({ fetch: boundFetch, scheduler, randomSource, mintMedia, rule34Document });
  const hostPage = new Rule34HostPage({ mode: environment.mode }, { rule34Document, page: new BrowserHostPage() });
  return {
    fetch: boundFetch, scheduler, randomSource, mintMedia, rule34Client, rule34Document, rule34CdnClient,
    hostPage, localKeyedValues: new BrowserLocalKeyedValues()
  };
}

function createFrozenCobaltClient(
  environment: Environment,
  { fetch, scheduler, rule34Document }: Pick<Rule34Dependencies, "fetch" | "scheduler" | "rule34Document">
): FrozenCobaltClient {
  return new FrozenCobaltClient({
    origin: USE_LOCAL_SERVER ? "http://localhost:8787" : "https://frozencobalt.stream",
    identity: { userId: rule34Document.readUserId(), version: environment.version, platform: environment.device }
  }, { scheduler, fetch });
}

function startFavoritesApp(environment: Environment, dependencies: Rule34Dependencies): void {
  const { fetch, scheduler, randomSource, mintMedia, rule34Client, rule34Document, rule34CdnClient, hostPage, localKeyedValues } = dependencies;
  const frozenCobaltClient = createFrozenCobaltClient(environment, dependencies);
  const indexedDbClient = new IndexedDbClient(DEFAULT_INDEXED_DB_CONFIGURATION, mintMedia);
  const remotePosts = new FallbackRemotePosts({
    primary: new FrozenCobaltRemotePosts({
      frozenCobaltClient,
      mintMedia: file => rule34CdnClient.mintMediaFromParts(file),
      scheduler,
      randomSource
    }),
    fallback: new Rule34RemotePosts({ rule34Client, scheduler, randomSource })
  });

  frozenCobaltClient.ping();
  composeFavoritesApp({
    userOwnsFavorites: environment.ownsFavorites,
    blacklistedTags: environment.blacklistedTags,
    favoritesOwnerId: environment.favoritesOwnerId,
    colorScheme: environment.colorScheme
  }, {
    scheduler,
    randomSource,
    localKeyedValues,
    hostPage,
    sizeObserver: new BrowserSizeObserver(),
    navigator: new BrowserNavigator(),
    fileSaver: new BrowserFileSaver(document),
    clipboard: new BrowserClipboard(navigator.clipboard),
    localFavorites: new IndexedDbLocalFavorites({ ownerId: environment.favoritesOwnerId }, indexedDbClient),
    localPosts: new IndexedDbLocalPosts(indexedDbClient),
    localTagCategories: new IndexedDbLocalTagCategories(indexedDbClient),
    remoteFavorites: new Rule34RemoteFavorites({ rule34Client, rule34Document, fetch, scheduler, randomSource }),
    remotePosts,
    remoteMedia: new Rule34CdnRemoteMedia(rule34CdnClient),
    remotePages: new Rule34RemotePages({ rule34Client, scheduler, randomSource }),
    visibilityObserver: new BrowserVisibilityObserver()
  }).mount(hostPage.claimContent());
}

function startPostListApp(environment: Environment, {
  hostPage, rule34Client, rule34CdnClient, rule34Document, randomSource, localKeyedValues, scheduler
}: Rule34Dependencies): void {
  const { shared: sharedPreferences } = createStoredTree(APP_STORAGE_SCHEMA.preferences, createAppStorage(localKeyedValues).preferences, ["shared"]);

  if (!sharedPreferences.postListEnabled.peek()) {
    return;
  }
  const remotePostList = new Rule34RemotePostList({ rule34Client, rule34Document, scheduler, randomSource });

  composePostListApp({ colorScheme: environment.colorScheme }, {
    scheduler,
    visibilityObserver: new BrowserVisibilityObserver(),
    sizeObserver: new BrowserSizeObserver(),
    remoteMedia: new Rule34CdnRemoteMedia(rule34CdnClient),
    remotePages: new Rule34RemotePages({ rule34Client, scheduler, randomSource }),
    remotePostList,
    localKeyedValues,
    navigator: new BrowserNavigator(),
    fileSaver: new BrowserFileSaver(document),
    hostPage
  }).mount(hostPage.claimContent());
}

function main(): void {
  const rule34Document = new Rule34Document();
  const environment = readEnvironment(rule34Document);

  APPS[environment.mode](environment, createRule34Dependencies(environment, rule34Document));
}

main();
