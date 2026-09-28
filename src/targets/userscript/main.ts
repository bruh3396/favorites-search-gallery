import { API_ORIGIN, ApiClient } from "@/adapters/api/client/client";
import { ApiPostSource } from "@/adapters/api/ports/post_source/post_source";
import { ApiTagSource } from "@/adapters/api/ports/tag_source/tag_source";
import { Rule34FavoritesEditor } from "@/adapters/rule34/ports/favorites_editor/favorites_editor";
import { Rule34FavoritesSource } from "@/adapters/rule34/ports/favorites_source/favorites_source";
import { Rule34Host } from "@/adapters/rule34/ports/host/host";
import { Rule34MediaClient } from "@/adapters/rule34/client/media/client";
import { Rule34MediaSource } from "@/adapters/rule34/ports/media_source/media_source";
import { Rule34Navigation } from "@/adapters/rule34/ports/navigation/navigation";
import { Rule34PostSource } from "@/adapters/rule34/ports/post_source/post_source";
import { Rule34SiteClient } from "@/adapters/rule34/client/site/client";
import { Rule34TagSource } from "@/adapters/rule34/ports/tag_source/tag_source";
import { readBrowserEnvironment } from "@/adapters/browser/environment/environment";
import { readRule34Environment } from "@/adapters/rule34/environment/environment";
import { startApp } from "@/app/startup/app";

declare const SCRIPT_VERSION: string;
declare const USE_LOCAL_SERVER: boolean;

const LOCAL_API_ORIGIN = "http://localhost:8787";

function main(): void {
  const rule34SiteClient = new Rule34SiteClient();
  const rule34Place = readRule34Environment(rule34SiteClient);

  if (rule34Place === null) {
    return;
  }
  const environment = { version: SCRIPT_VERSION, ...readBrowserEnvironment(), ...rule34Place };
  const identity = { userId: rule34SiteClient.readUserId(), version: environment.version, platform: environment.device };
  const apiClient = new ApiClient(USE_LOCAL_SERVER ? LOCAL_API_ORIGIN : API_ORIGIN, identity);
  const wasStarted = startApp(environment, {
    favoritesSource: new Rule34FavoritesSource(rule34SiteClient),
    favoritesEditor: new Rule34FavoritesEditor(rule34SiteClient),
    postSource: new ApiPostSource(apiClient, new Rule34PostSource(rule34SiteClient)),
    tagSource: new ApiTagSource(apiClient, new Rule34TagSource(rule34SiteClient)),
    mediaSource: new Rule34MediaSource(new Rule34MediaClient()),
    navigation: new Rule34Navigation(rule34SiteClient),
    host: new Rule34Host(rule34SiteClient)
  });

  if (wasStarted) {
    apiClient.ping();
  }
}

main();
