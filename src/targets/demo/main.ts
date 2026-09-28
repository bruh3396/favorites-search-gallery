import { MemoryFavorites } from "@/adapters/memory/client/favorites";
import { MemoryFavoritesEditor } from "@/adapters/memory/favorites_editor/favorites_editor";
import { MemoryFavoritesSource } from "@/adapters/memory/favorites_source/favorites_source";
import { MemoryHost } from "@/adapters/memory/host/host";
import { MemoryNavigation } from "@/adapters/memory/navigation/navigation";
import { MemoryPostSource } from "@/adapters/memory/post_source/post_source";
import { MemoryTelemetry } from "@/adapters/memory/telemetry/telemetry";
import { PlaceEnvironment } from "@/core/boundary/environment";
import { createSamplePosts } from "@/targets/demo/sample_posts";
import { readBrowserEnvironment } from "@/adapters/browser/environment/environment";
import { startApp } from "@/app/startup/app";

const SAMPLE_POST_COUNT = 300;

function createDemoPlace(): PlaceEnvironment {
  return {
    mode: "favorites",
    favoritesId: "demo",
    ownsFavorites: true,
    blacklistedTags: "",
    usingDarkMode: matchMedia("(prefers-color-scheme: dark)").matches
  };
}

function main(): void {
  const posts = createSamplePosts(SAMPLE_POST_COUNT);
  const favorites = new MemoryFavorites(posts);

  startApp({ version: "demo", ...readBrowserEnvironment(), ...createDemoPlace() }, {
    favoritesSource: new MemoryFavoritesSource(favorites),
    favoritesEditor: new MemoryFavoritesEditor(favorites),
    postSource: new MemoryPostSource(posts),
    navigation: new MemoryNavigation(),
    host: new MemoryHost(),
    telemetry: new MemoryTelemetry()
  });
}

main();
