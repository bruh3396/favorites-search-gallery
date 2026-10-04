import { BrowserHostPage } from "@/adapters/browser/ports/host_page/host_page";
import { BrowserLocalKeyedValues } from "@/adapters/browser/ports/local_keyed_values/local_keyed_values";
import { BrowserNavigator } from "@/adapters/browser/ports/navigator/navigator";
import { BrowserRandomSource } from "@/adapters/browser/ports/random_source/random_source";
import { BrowserScheduler } from "@/adapters/browser/ports/scheduler/scheduler";
import { Environment } from "@/core/boundary/environment";
import { FallbackRemotePosts } from "@/core/boundary/ports/remote_posts/fallback_remote_posts";
import { FrozenCobaltClient } from "@/adapters/frozen_cobalt/client/client";
import { FrozenCobaltRemotePosts } from "@/adapters/frozen_cobalt/ports/remote_posts/remote_posts";
import { FrozenCobaltRemoteTagCategories } from "@/adapters/frozen_cobalt/ports/remote_tag_categories/remote_tag_categories";
import { IndexedDbClient } from "@/adapters/indexed_db/client/client";
import { IndexedDbLocalFavorites } from "@/adapters/indexed_db/ports/local_favorites/local_favorites";
import { IndexedDbLocalPosts } from "@/adapters/indexed_db/ports/local_posts/local_posts";
import { IndexedDbLocalTagCategories } from "@/adapters/indexed_db/ports/local_tag_categories/local_tag_categories";
import { Media } from "@/core/domain/media/media";
import { Ports } from "@/core/boundary/ports/ports";
import { Rule34CdnClient } from "@/adapters/rule34_cdn/client/client";
import { Rule34CdnRemoteMedia } from "@/adapters/rule34_cdn/ports/remote_media/remote_media";
import { Rule34Client } from "@/adapters/rule34/client/client";
import { Rule34HostPage } from "@/adapters/rule34/ports/host_page/host_page";
import { Rule34RemoteFavoriteActions } from "@/adapters/rule34/ports/remote_favorite_actions/remote_favorite_actions";
import { Rule34RemoteFavorites } from "@/adapters/rule34/ports/remote_favorites/remote_favorites";
import { Rule34RemotePages } from "@/adapters/rule34/ports/remote_pages/remote_pages";
import { Rule34RemotePosts } from "@/adapters/rule34/ports/remote_posts/remote_posts";
import { Rule34RemoteSearchResults } from "@/adapters/rule34/ports/remote_search_results/remote_search_results";
import { readBrowserEnvironment } from "@/adapters/browser/environment/environment";
import { readRule34Environment } from "@/adapters/rule34/environment/environment";
import { startApp } from "@/app/startup/app";

declare const SCRIPT_VERSION: string;
declare const USE_LOCAL_SERVER: boolean;

function main(): void {
  const scheduler = new BrowserScheduler();
  const randomSource = new BrowserRandomSource();
  const boundFetch = fetch.bind(globalThis);
  const rule34CdnClient = new Rule34CdnClient({ fetch: boundFetch, scheduler });
  const mintMedia = (file: { url: string; tags: string }): Media | null => rule34CdnClient.mintMedia(file);
  const rule34Client = new Rule34Client({ fetch: boundFetch, scheduler, randomSource, mintMedia });
  const rule34Place = readRule34Environment(rule34Client);

  if (rule34Place === null) {
    return;
  }
  const environment: Environment = { version: SCRIPT_VERSION, ...readBrowserEnvironment(), ...rule34Place };
  const frozenCobaltClient = new FrozenCobaltClient(
    {
      origin: USE_LOCAL_SERVER ? "http://localhost:8787" : "https://frozencobalt.stream",
      identity: {
        userId: rule34Client.readUserId(),
        version: environment.version,
        platform: environment.device
      }
    },
    { scheduler, fetch: boundFetch }
  );
  const indexedDbClient = new IndexedDbClient("rule34");
  const hostPage = new Rule34HostPage({ mode: environment.mode }, { rule34: rule34Client, page: new BrowserHostPage() });

  const ports: Ports = {
    remoteFavoriteActions: new Rule34RemoteFavoriteActions({ fetch: boundFetch, scheduler, randomSource }),
    remoteFavorites: new Rule34RemoteFavorites({ rule34: rule34Client, scheduler, randomSource }),
    remotePosts: new FallbackRemotePosts({
      primary: new FrozenCobaltRemotePosts({ frozenCobalt: frozenCobaltClient, mintMedia, scheduler, randomSource }),
      fallback: new Rule34RemotePosts({ rule34: rule34Client, scheduler, randomSource })
    }),
    remoteSearchResults: new Rule34RemoteSearchResults({ rule34: rule34Client, scheduler, randomSource }),
    remoteTagCategories: new FrozenCobaltRemoteTagCategories(frozenCobaltClient),
    remoteMedia: new Rule34CdnRemoteMedia(rule34CdnClient),
    remotePages: new Rule34RemotePages(rule34Client),
    navigator: new BrowserNavigator(),
    hostPage,
    localFavorites: new IndexedDbLocalFavorites({ ownerId: environment.favoritesOwnerId }, indexedDbClient),
    localKeyedValues: new BrowserLocalKeyedValues(),
    localPosts: new IndexedDbLocalPosts(indexedDbClient),
    localTagCategories: new IndexedDbLocalTagCategories(indexedDbClient),
    randomSource,
    scheduler
  };

  if (startApp(environment, ports, hostPage)) {
    frozenCobaltClient.ping();
  }
}

main();
