import { BrowserHostPage } from "@/adapters/browser/ports/host_page/host_page";
import { BrowserLocalKeyedValues } from "@/adapters/browser/ports/local_keyed_values/local_keyed_values";
import { BrowserRandom } from "@/adapters/browser/ports/random/random";
import { BrowserScheduler } from "@/adapters/browser/ports/scheduler/scheduler";
import { Environment } from "@/core/boundary/environment";
import { FallbackRemotePosts } from "@/core/boundary/composites/fallback_remote_posts";
import { FrozenCobaltClient } from "@/adapters/frozen_cobalt/client/client";
import { FrozenCobaltRemotePosts } from "@/adapters/frozen_cobalt/ports/remote_posts/remote_posts";
import { FrozenCobaltRemoteTagCategories } from "@/adapters/frozen_cobalt/ports/remote_tag_categories/remote_tag_categories";
import { IndexedDbClient } from "@/adapters/indexed_db/client/client";
import { IndexedDbLocalFavorites } from "@/adapters/indexed_db/ports/local_favorites/local_favorites";
import { IndexedDbLocalPosts } from "@/adapters/indexed_db/ports/local_posts/local_posts";
import { IndexedDbLocalTagCategories } from "@/adapters/indexed_db/ports/local_tag_categories/local_tag_categories";
import { Ports } from "@/core/boundary/ports/ports";
import { Rule34HostPage } from "@/adapters/rule34/ports/host_page/host_page";
import { Rule34MediaClient } from "@/adapters/rule34/client/media/client";
import { Rule34Navigation } from "@/adapters/rule34/ports/navigation/navigation";
import { Rule34RemoteFavorites } from "@/adapters/rule34/ports/remote_favorites/remote_favorites";
import { Rule34RemoteMedia } from "@/adapters/rule34/ports/remote_media/remote_media";
import { Rule34RemotePosts } from "@/adapters/rule34/ports/remote_posts/remote_posts";
import { Rule34SiteClient } from "@/adapters/rule34/client/site/client";
import { readBrowserEnvironment } from "@/adapters/browser/environment/environment";
import { readRule34Environment } from "@/adapters/rule34/environment/environment";
import { startApp } from "@/app/startup/app";

declare const SCRIPT_VERSION: string;
declare const USE_LOCAL_SERVER: boolean;

function main(): void {
  const scheduler = new BrowserScheduler();
  const random = new BrowserRandom();
  const boundFetch = fetch.bind(globalThis);
  const rule34SiteClient = new Rule34SiteClient({ fetch: boundFetch, scheduler, random });
  const rule34Place = readRule34Environment(rule34SiteClient);

  if (rule34Place === null) {
    return;
  }
  const environment: Environment = { version: SCRIPT_VERSION, ...readBrowserEnvironment(), ...rule34Place };
  const frozenCobaltClient = new FrozenCobaltClient(
    {
      origin: USE_LOCAL_SERVER ? "http://localhost:8787" : "https://frozencobalt.stream",
      identity: {
        userId: rule34SiteClient.readUserId(),
        version: environment.version,
        platform: environment.device
      }
    },
    { scheduler, fetch: boundFetch }
  );
  const rule34MediaClient = new Rule34MediaClient({ fetch: boundFetch, scheduler });
  const indexedDbClient = new IndexedDbClient("rule34");

  const ports: Ports = {
    remoteFavorites: new Rule34RemoteFavorites({ rule34: rule34SiteClient, scheduler, random }),
    remotePosts: new FallbackRemotePosts({
      primary: new FrozenCobaltRemotePosts({
        frozenCobalt: frozenCobaltClient,
        mintMedia: ({ url, tags }) => rule34MediaClient.mintMedia(url, tags),
        scheduler,
        random
      }),
      fallback: new Rule34RemotePosts({ rule34: rule34SiteClient, scheduler, random })
    }),
    remoteTagCategories: new FrozenCobaltRemoteTagCategories(frozenCobaltClient),
    remoteMedia: new Rule34RemoteMedia(rule34MediaClient),
    navigation: new Rule34Navigation(rule34SiteClient),
    hostPage: new Rule34HostPage({ mode: environment.mode }, { rule34: rule34SiteClient, page: new BrowserHostPage() }),
    localFavorites: new IndexedDbLocalFavorites({ ownerId: environment.favoritesOwnerId }, indexedDbClient),
    localKeyedValues: new BrowserLocalKeyedValues(),
    localPosts: new IndexedDbLocalPosts(indexedDbClient),
    localTagCategories: new IndexedDbLocalTagCategories(indexedDbClient),
    random,
    scheduler
  };
  const root = document.body.appendChild(document.createElement("div"));

  if (startApp(environment, ports, root)) {
    frozenCobaltClient.ping();
  }
}

main();
