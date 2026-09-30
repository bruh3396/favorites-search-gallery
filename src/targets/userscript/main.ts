import { API_ORIGIN, ApiClient } from "@/adapters/api/client/client";
import { ApiRemotePosts } from "@/adapters/api/ports/remote_posts/remote_posts";
import { ApiRemoteTagCategories } from "@/adapters/api/ports/remote_tag_categories/remote_tag_categories";
import { BrowserHostPage } from "@/adapters/browser/ports/host_page/host_page";
import { BrowserLocalKeyedValues } from "@/adapters/browser/ports/local_keyed_values/local_keyed_values";
import { BrowserScheduler } from "@/adapters/browser/ports/scheduler/scheduler";
import { IndexedDbClient } from "@/adapters/indexed_db/client/client";
import { IndexedDbLocalFavorites } from "@/adapters/indexed_db/ports/local_favorites/local_favorites";
import { IndexedDbLocalPosts } from "@/adapters/indexed_db/ports/local_posts/local_posts";
import { IndexedDbLocalTagCategories } from "@/adapters/indexed_db/ports/local_tag_categories/local_tag_categories";
import { Environment } from "@/core/boundary/environment";
import { Ports } from "@/core/boundary/ports/ports";
import { Scheduler } from "@/core/boundary/ports/scheduler";
import { Rule34HostPage } from "@/adapters/rule34/ports/host_page/host_page";
import { Rule34MediaClient } from "@/adapters/rule34/client/media/client";
import { Rule34Navigation } from "@/adapters/rule34/ports/navigation/navigation";
import { Rule34RemoteFavorites } from "@/adapters/rule34/ports/remote_favorites/remote_favorites";
import { Rule34RemoteMedia } from "@/adapters/rule34/ports/remote_media/remote_media";
import { Rule34RemotePosts } from "@/adapters/rule34/ports/remote_posts/remote_posts";
import { Rule34SiteClient } from "@/adapters/rule34/client/site/client";
import { mintMedia } from "@/adapters/rule34/client/media/locator";
import { readBrowserEnvironment } from "@/adapters/browser/environment/environment";
import { readRule34Environment } from "@/adapters/rule34/environment/environment";
import { startApp } from "@/app/startup/app";

declare const SCRIPT_VERSION: string;
declare const USE_LOCAL_SERVER: boolean;

const LOCAL_API_ORIGIN = "http://localhost:8787";

function createApiClient(
  rule34SiteClient: Rule34SiteClient,
  environment: Environment,
  scheduler: Scheduler
): ApiClient {
  const identity = { userId: rule34SiteClient.readUserId(), version: environment.version, platform: environment.device };
  return new ApiClient(scheduler, USE_LOCAL_SERVER ? LOCAL_API_ORIGIN : API_ORIGIN, identity);
}

function createPorts(
  rule34SiteClient: Rule34SiteClient,
  apiClient: ApiClient,
  indexedDbClient: IndexedDbClient,
  environment: Environment,
  scheduler: Scheduler
): Ports {
  return {
    remoteFavorites: new Rule34RemoteFavorites(rule34SiteClient),
    remotePosts: new ApiRemotePosts(apiClient, new Rule34RemotePosts(rule34SiteClient), url => mintMedia(url, "")),
    remoteTagCategories: new ApiRemoteTagCategories(apiClient),
    remoteMedia: new Rule34RemoteMedia(new Rule34MediaClient()),
    navigation: new Rule34Navigation(rule34SiteClient),
    hostPage: new Rule34HostPage(rule34SiteClient, new BrowserHostPage(), environment.mode),
    localFavorites: new IndexedDbLocalFavorites(indexedDbClient, environment.favoritesOwnerId),
    localKeyedValues: new BrowserLocalKeyedValues(),
    localPosts: new IndexedDbLocalPosts(indexedDbClient),
    localTagCategories: new IndexedDbLocalTagCategories(indexedDbClient),
    scheduler
  };
}

function createRoot(): HTMLElement {
  return document.body.appendChild(document.createElement("div"));
}

function main(): void {
  const rule34SiteClient = new Rule34SiteClient();
  const rule34Place = readRule34Environment(rule34SiteClient);

  if (rule34Place === null) {
    return;
  }
  const environment: Environment = { version: SCRIPT_VERSION, ...readBrowserEnvironment(), ...rule34Place };
  const scheduler = new BrowserScheduler();
  const apiClient = createApiClient(rule34SiteClient, environment, scheduler);
  const indexedDbClient = new IndexedDbClient("rule34");
  const didStart = startApp(environment, createPorts(rule34SiteClient, apiClient, indexedDbClient, environment, scheduler), createRoot());

  if (didStart) {
    apiClient.ping();
  }
}

main();
