import { AppMode, Environment } from "@/core/boundary/environment";
import { FavoritesAppDependencies, composeFavoritesApp } from "@/core/app/favorites/composer";
import { decodeBitmap, loadImage } from "@/adapters/browser/image/image";
import { BrowserFileSaver } from "@/adapters/browser/ports/file_saver/file_saver";
import { BrowserHostPage } from "@/adapters/browser/ports/host_page/host_page";
import { BrowserLocalKeyedValues } from "@/adapters/browser/ports/local_keyed_values/local_keyed_values";
import { BrowserMorpher } from "@/adapters/browser/ports/morpher/morpher";
import { BrowserNavigator } from "@/adapters/browser/ports/navigator/navigator";
import { BrowserPageVisibility } from "@/adapters/browser/ports/page_visibility/page_visibility";
import { BrowserRandomSource } from "@/adapters/browser/ports/random_source/random_source";
import { BrowserScheduler } from "@/adapters/browser/ports/scheduler/scheduler";
import { BrowserSizeObserver } from "@/adapters/browser/ports/size_observer/size_observer";
import { BrowserVisibilityObserver } from "@/adapters/browser/ports/visibility_observer/visibility_observer";
import { FallbackRemotePosts } from "@/core/boundary/ports/remote_posts/fallback_remote_posts";
import { FrozenCobaltClient } from "@/adapters/frozen_cobalt/client/client";
import { FrozenCobaltRemotePosts } from "@/adapters/frozen_cobalt/ports/remote_posts/remote_posts";
import { IndexedDbClient } from "@/adapters/browser/indexed_db/client";
import { IndexedDbLocalFavorites } from "@/adapters/browser/ports/local_favorites/local_favorites";
import { IndexedDbLocalPosts } from "@/adapters/browser/ports/local_posts/local_posts";
import { IndexedDbLocalTagCategories } from "@/adapters/browser/ports/local_tag_categories/local_tag_categories";
import { LocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/local_keyed_values";
import { Media } from "@/core/domain/media/media";
import { RandomSource } from "@/core/boundary/ports/random_source/random_source";
import { Rule34CdnClient } from "@/adapters/rule34_cdn/client/client";
import { Rule34CdnRemoteMedia } from "@/adapters/rule34_cdn/ports/remote_media/remote_media";
import { Rule34Client } from "@/adapters/rule34/client/client";
import { Rule34Document } from "@/adapters/rule34/document/document";
import { Rule34HostPage } from "@/adapters/rule34/ports/host_page/host_page";
import { Rule34RemoteFavoriteActions } from "@/adapters/rule34/ports/remote_favorite_actions/remote_favorite_actions";
import { Rule34RemoteFavorites } from "@/adapters/rule34/ports/remote_favorites/remote_favorites";
import { Rule34RemotePages } from "@/adapters/rule34/ports/remote_pages/remote_pages";
import { Rule34RemotePosts } from "@/adapters/rule34/ports/remote_posts/remote_posts";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { composePostListApp } from "@/core/app/post_list/composer";
import { readBrowserEnvironment } from "@/adapters/browser/environment/environment";
import { readRule34Environment } from "@/adapters/rule34/environment/environment";

declare const SCRIPT_VERSION: string;
declare const USE_LOCAL_SERVER: boolean;

interface AppDependencies {
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

type StartApp = (environment: Environment, dependencies: AppDependencies) => void;

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

function createAppDependencies(environment: Environment, rule34Document: Rule34Document): AppDependencies {
  const scheduler = new BrowserScheduler();
  const randomSource = new BrowserRandomSource();
  const boundFetch = fetch.bind(globalThis);
  const rule34Cdn = new Rule34CdnClient({ fetch: boundFetch, scheduler, loadImage, decodeBitmap });
  const mintMedia = (file: { url: string; tags: string }): Media | null => rule34Cdn.mintMedia(file);
  const rule34 = new Rule34Client({ fetch: boundFetch, scheduler, randomSource, mintMedia, rule34Document });
  const hostPage = new Rule34HostPage({ mode: environment.mode }, { rule34Document, page: new BrowserHostPage() });
  const localKeyedValues = new BrowserLocalKeyedValues();
  return {
    fetch: boundFetch, scheduler, randomSource, mintMedia, rule34, rule34Document, rule34Cdn,
    hostPage, localKeyedValues
  };
}

function startFavoritesApp(environment: Environment, dependencies: AppDependencies): void {
  composeFavoritesApp({
    userOwnsFavorites: environment.ownsFavorites,
    blacklistedTags: environment.blacklistedTags,
    favoritesOwnerId: environment.favoritesOwnerId,
    colorScheme: environment.colorScheme
  }, createFavoritesDependencies(environment, dependencies)).mount(dependencies.hostPage.claimContent());
}

function createFavoritesDependencies(environment: Environment, dependencies: AppDependencies): FavoritesAppDependencies {
  const { fetch, scheduler, randomSource, mintMedia, rule34, rule34Document, rule34Cdn, localKeyedValues } = dependencies;
  const frozenCobalt = new FrozenCobaltClient({
    origin: USE_LOCAL_SERVER ? "http://localhost:8787" : "https://frozencobalt.stream",
    identity: { userId: rule34Document.readUserId(), version: environment.version, platform: environment.device }
  }, { scheduler, fetch });
  const indexedDb = new IndexedDbClient(mintMedia);
  return {
    scheduler,
    randomSource,
    localKeyedValues,
    sizeObserver: new BrowserSizeObserver(),
    morpher: new BrowserMorpher(),
    navigator: new BrowserNavigator(),
    fileSaver: new BrowserFileSaver(document),
    pageVisibility: new BrowserPageVisibility(document),
    localFavorites: new IndexedDbLocalFavorites({ ownerId: environment.favoritesOwnerId }, indexedDb),
    localPosts: new IndexedDbLocalPosts(indexedDb),
    localTagCategories: new IndexedDbLocalTagCategories(indexedDb),
    remoteFavorites: new Rule34RemoteFavorites({ rule34, rule34Document, scheduler, randomSource }),
    remoteFavoriteActions: new Rule34RemoteFavoriteActions({ fetch, scheduler, randomSource }),
    remotePosts: new FallbackRemotePosts({
      primary: new FrozenCobaltRemotePosts({ frozenCobalt, mintMedia, scheduler, randomSource }),
      fallback: new Rule34RemotePosts({ rule34, scheduler, randomSource })
    }),
    remoteMedia: new Rule34CdnRemoteMedia(rule34Cdn),
    remotePages: new Rule34RemotePages(rule34),
    visibilityObserver: new BrowserVisibilityObserver()
  };
}

function startPostListApp(environment: Environment, { hostPage, rule34, rule34Cdn, localKeyedValues, scheduler }: AppDependencies): void {
  composePostListApp({ colorScheme: environment.colorScheme }, {
    scheduler,
    visibilityObserver: new BrowserVisibilityObserver(),
    remoteMedia: new Rule34CdnRemoteMedia(rule34Cdn),
    remotePages: new Rule34RemotePages(rule34),
    localKeyedValues
  }).mount(hostPage.claimContent());
}

function main(): void {
  const rule34Document = new Rule34Document();
  const environment = readEnvironment(rule34Document);

  if (environment.mode === "postList") {
    return;
  }

  APPS[environment.mode](environment, createAppDependencies(environment, rule34Document));
}

main();
