import { API_ORIGIN, ApiClient } from "@/adapters/api/client/client";
import { ApiPostSource } from "@/adapters/api/ports/post_source/post_source";
import { ApiTagSource } from "@/adapters/api/ports/tag_source/tag_source";
import { BrowserKeyValueStore } from "@/adapters/browser/ports/key_value_store/key_value_store";
import { Environment } from "@/core/boundary/environment";
import { Ports } from "@/core/boundary/ports/ports";
import { Rule34FavoritesEditor } from "@/adapters/rule34/ports/favorites_editor/favorites_editor";
import { Rule34FavoritesSource } from "@/adapters/rule34/ports/favorites_source/favorites_source";
import { Rule34Host } from "@/adapters/rule34/ports/host/host";
import { Rule34MediaClient } from "@/adapters/rule34/client/media/client";
import { Rule34MediaSource } from "@/adapters/rule34/ports/media_source/media_source";
import { Rule34Navigation } from "@/adapters/rule34/ports/navigation/navigation";
import { Rule34PostSource } from "@/adapters/rule34/ports/post_source/post_source";
import { Rule34SiteClient } from "@/adapters/rule34/client/site/client";
import { mintMedia } from "@/adapters/rule34/client/media/locator";
import { readBrowserEnvironment } from "@/adapters/browser/environment/environment";
import { readRule34Environment } from "@/adapters/rule34/environment/environment";
import { startApp } from "@/app/startup/app";

declare const SCRIPT_VERSION: string;
declare const USE_LOCAL_SERVER: boolean;

const LOCAL_API_ORIGIN = "http://localhost:8787";

function createApiClient(rule34SiteClient: Rule34SiteClient, environment: Environment): ApiClient {
  const identity = { userId: rule34SiteClient.readUserId(), version: environment.version, platform: environment.device };
  return new ApiClient(USE_LOCAL_SERVER ? LOCAL_API_ORIGIN : API_ORIGIN, identity);
}

function createPorts(rule34SiteClient: Rule34SiteClient, apiClient: ApiClient, environment: Environment): Ports {
  return {
    favoritesSource: new Rule34FavoritesSource(rule34SiteClient),
    favoritesEditor: new Rule34FavoritesEditor(rule34SiteClient),
    postSource: new ApiPostSource(apiClient, new Rule34PostSource(rule34SiteClient), url => mintMedia(url, "")),
    tagSource: new ApiTagSource(apiClient),
    mediaSource: new Rule34MediaSource(new Rule34MediaClient()),
    navigation: new Rule34Navigation(rule34SiteClient),
    host: new Rule34Host(rule34SiteClient, environment.mode),
    keyValueStore: new BrowserKeyValueStore()
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
  const apiClient = createApiClient(rule34SiteClient, environment);
  const didStart = startApp(environment, createPorts(rule34SiteClient, apiClient, environment), createRoot());

  if (didStart) {
    apiClient.ping();
  }
}

main();
