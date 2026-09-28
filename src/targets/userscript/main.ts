import { readRule34Environment, readRule34UserId } from "@/adapters/rule34/environment/environment";
import { ApiPostSource } from "@/adapters/api/post_source/post_source";
import { ApiTelemetry } from "@/adapters/api/telemetry/telemetry";
import { Rule34FavoritesEditor } from "@/adapters/rule34/favorites_editor/favorites_editor";
import { Rule34FavoritesSource } from "@/adapters/rule34/favorites_source/favorites_source";
import { Rule34Host } from "@/adapters/rule34/host/host";
import { Rule34Navigation } from "@/adapters/rule34/navigation/navigation";
import { Rule34PostSource } from "@/adapters/rule34/post_source/post_source";
import { readBrowserEnvironment } from "@/adapters/browser/environment/environment";
import { startApp } from "@/app/startup/app";

declare const SCRIPT_VERSION: string;

function main(): void {
  const place = readRule34Environment();

  if (place === null) {
    return;
  }
  startApp({ version: SCRIPT_VERSION, ...readBrowserEnvironment(), ...place }, {
    favoritesSource: new Rule34FavoritesSource(),
    favoritesEditor: new Rule34FavoritesEditor(),
    postSource: new ApiPostSource(new Rule34PostSource()),
    navigation: new Rule34Navigation(),
    host: new Rule34Host(),
    telemetry: new ApiTelemetry(readRule34UserId())
  });
}

main();
