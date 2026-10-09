import { AppMode, Environment } from "@/core/boundary/environment";
import { FavoritesPageDependencies, mountFavoritesPage } from "@/core/app/favorites_page/favorites_page";
import { BrowserHostPage } from "@/adapters/browser/ports/host_page/host_page";
import { BrowserLocalKeyedValues } from "@/adapters/browser/ports/local_keyed_values/local_keyed_values";
import { BrowserRandomSource } from "@/adapters/browser/ports/random_source/random_source";
import { BrowserScheduler } from "@/adapters/browser/ports/scheduler/scheduler";
import { FallbackRemotePosts } from "@/core/boundary/ports/remote_posts/fallback_remote_posts";
import { FrozenCobaltClient } from "@/adapters/frozen_cobalt/client/client";
import { FrozenCobaltRemotePosts } from "@/adapters/frozen_cobalt/ports/remote_posts/remote_posts";
import { IndexedDbClient } from "@/adapters/indexed_db/client/client";
import { IndexedDbLocalFavorites } from "@/adapters/indexed_db/ports/local_favorites/local_favorites";
import { IndexedDbLocalPosts } from "@/adapters/indexed_db/ports/local_posts/local_posts";
import { IndexedDbLocalTagCategories } from "@/adapters/indexed_db/ports/local_tag_categories/local_tag_categories";
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
import { mountPostListPage } from "@/core/app/post_list_page/post_list_page";
import { readBrowserEnvironment } from "@/adapters/browser/environment/environment";
import { readRule34Environment } from "@/adapters/rule34/environment/environment";

declare const SCRIPT_VERSION: string;
declare const USE_LOCAL_SERVER: boolean;

interface PageDependencies {
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

type ComposePage = (environment: Environment, dependencies: PageDependencies) => void;
type FavoritesPorts = Omit<FavoritesPageDependencies, "scheduler" | "randomSource" | "localKeyedValues" | "hostPage">;

const PAGES: Record<AppMode, ComposePage> = {
  favorites: composeFavoritesPage,
  postList: composePostListPage
};

function readEnvironment(rule34Document: Rule34Document): Environment {
  const hostEnvironment = readRule34Environment(rule34Document);

  if (hostEnvironment === null) {
    throw new Error(`Unsupported page: ${location.href}`);
  }
  return { version: SCRIPT_VERSION, ...readBrowserEnvironment(), ...hostEnvironment };
}

function createPageDependencies(environment: Environment, rule34Document: Rule34Document): PageDependencies {
  const scheduler = new BrowserScheduler();
  const randomSource = new BrowserRandomSource();
  const boundFetch = fetch.bind(globalThis);
  const rule34Cdn = new Rule34CdnClient({ fetch: boundFetch, scheduler });
  const mintMedia = (file: { url: string; tags: string }): Media | null => rule34Cdn.mintMedia(file);
  const rule34 = new Rule34Client({ fetch: boundFetch, scheduler, randomSource, mintMedia, rule34Document });
  const hostPage = new Rule34HostPage({ mode: environment.mode }, { rule34Document, page: new BrowserHostPage() });
  const localKeyedValues = new BrowserLocalKeyedValues();
  return { fetch: boundFetch, scheduler, randomSource, mintMedia, rule34, rule34Document, rule34Cdn, hostPage, localKeyedValues };
}

function composeFavoritesPage(environment: Environment, dependencies: PageDependencies): void {
  const { scheduler, randomSource, localKeyedValues, hostPage } = dependencies;
  const ports = createFavoritesPorts(environment, dependencies);

  mountFavoritesPage(hostPage.claimContent(), {
    userOwnsFavorites: environment.ownsFavorites,
    blacklistedTags: environment.blacklistedTags,
    favoritesOwnerId: environment.favoritesOwnerId,
    colorScheme: environment.colorScheme
  }, { ...ports, scheduler, randomSource, localKeyedValues, hostPage });
}

function createFavoritesPorts(environment: Environment, dependencies: PageDependencies): FavoritesPorts {
  const { fetch, scheduler, randomSource, mintMedia, rule34, rule34Document, rule34Cdn } = dependencies;
  const frozenCobalt = new FrozenCobaltClient({
    origin: USE_LOCAL_SERVER ? "http://localhost:8787" : "https://frozencobalt.stream",
    identity: { userId: rule34Document.readUserId(), version: environment.version, platform: environment.device }
  }, { scheduler, fetch });
  const indexedDb = new IndexedDbClient();
  return {
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
    remotePages: new Rule34RemotePages(rule34)
  };
}

function composePostListPage(environment: Environment, { hostPage, rule34, rule34Cdn, localKeyedValues }: PageDependencies): void {
  mountPostListPage(hostPage.claimContent(), { colorScheme: environment.colorScheme }, {
    remoteMedia: new Rule34CdnRemoteMedia(rule34Cdn),
    remotePages: new Rule34RemotePages(rule34),
    localKeyedValues
  });
}

function main(): void {
  const rule34Document = new Rule34Document();
  const environment = readEnvironment(rule34Document);

  PAGES[environment.mode](environment, createPageDependencies(environment, rule34Document));
}

main();
