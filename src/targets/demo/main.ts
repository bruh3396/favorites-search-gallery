import { Environment } from "@/core/boundary/environment";
import { MemoryClient } from "@/adapters/memory/client/client";
import { MemoryFavoritesEditor } from "@/adapters/memory/ports/favorites_editor/favorites_editor";
import { MemoryFavoritesSource } from "@/adapters/memory/ports/favorites_source/favorites_source";
import { MemoryHost } from "@/adapters/memory/ports/host/host";
import { MemoryMediaSource } from "@/adapters/memory/ports/media_source/media_source";
import { MemoryNavigation } from "@/adapters/memory/ports/navigation/navigation";
import { MemoryPostSource } from "@/adapters/memory/ports/post_source/post_source";
import { MemoryTagSource } from "@/adapters/memory/ports/tag_source/tag_source";
import { createSamplePosts } from "@/targets/demo/sample_posts";
import { readBrowserEnvironment } from "@/adapters/browser/environment/environment";
import { startApp } from "@/app/startup/app";

const SAMPLE_POST_COUNT = 300;

function createDemoPlace(): Pick<Environment, "mode" | "favoritesId" | "ownsFavorites" | "blacklistedTags" | "usingDarkMode"> {
  return {
    mode: "favorites",
    favoritesId: "demo",
    ownsFavorites: true,
    blacklistedTags: "",
    usingDarkMode: matchMedia("(prefers-color-scheme: dark)").matches
  };
}

function main(): void {
  const memoryClient = new MemoryClient(createSamplePosts(SAMPLE_POST_COUNT));

  startApp({ version: "demo", ...readBrowserEnvironment(), ...createDemoPlace() }, {
    favoritesSource: new MemoryFavoritesSource(memoryClient),
    favoritesEditor: new MemoryFavoritesEditor(memoryClient),
    postSource: new MemoryPostSource(memoryClient),
    tagSource: new MemoryTagSource(),
    mediaSource: new MemoryMediaSource(),
    navigation: new MemoryNavigation(),
    host: new MemoryHost()
  });
}

main();
