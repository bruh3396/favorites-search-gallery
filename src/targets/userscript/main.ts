import { ApiClient } from "@/adapters/api/client/client";
import { ApiPostSource } from "@/adapters/api/post_source/post_source";
import { ApiTagSource } from "@/adapters/api/tag_source/tag_source";
import { ApiTelemetry } from "@/adapters/api/telemetry/telemetry";
import { Rule34Client } from "@/adapters/rule34/client/client";
import { Rule34FavoritesEditor } from "@/adapters/rule34/favorites_editor/favorites_editor";
import { Rule34FavoritesSource } from "@/adapters/rule34/favorites_source/favorites_source";
import { Rule34Host } from "@/adapters/rule34/host/host";
import { Rule34Navigation } from "@/adapters/rule34/navigation/navigation";
import { Rule34PostSource } from "@/adapters/rule34/post_source/post_source";
import { Rule34TagSource } from "@/adapters/rule34/tag_source/tag_source";
import { readBrowserEnvironment } from "@/adapters/browser/environment/environment";
import { readRule34Environment } from "@/adapters/rule34/environment/environment";
import { startApp } from "@/app/startup/app";

declare const SCRIPT_VERSION: string;
declare const USE_LOCAL_SERVER: boolean;

const LOCAL_API_ORIGIN = "http://localhost:8787";

function main(): void {
  const rule34 = new Rule34Client();
  const place = readRule34Environment(rule34);

  if (place === null) {
    return;
  }
  const api = USE_LOCAL_SERVER ? new ApiClient(LOCAL_API_ORIGIN) : new ApiClient();

  startApp({ version: SCRIPT_VERSION, ...readBrowserEnvironment(), ...place }, {
    favoritesSource: new Rule34FavoritesSource(rule34),
    favoritesEditor: new Rule34FavoritesEditor(rule34),
    postSource: new ApiPostSource(api, new Rule34PostSource(rule34)),
    tagSource: new ApiTagSource(api, new Rule34TagSource(rule34)),
    navigation: new Rule34Navigation(rule34),
    host: new Rule34Host(rule34),
    telemetry: new ApiTelemetry(api, rule34.readUserId())
  });
}

main();
