import { Environment } from "@/core/boundary/environment";
import { MemoryClient } from "@/adapters/memory/client/client";
import { MemoryFavoritesEditor } from "@/adapters/memory/favorites_editor/favorites_editor";
import { MemoryFavoritesSource } from "@/adapters/memory/favorites_source/favorites_source";
import { MemoryHost } from "@/adapters/memory/host/host";
import { MemoryNavigation } from "@/adapters/memory/navigation/navigation";
import { MemoryPostSource } from "@/adapters/memory/post_source/post_source";
import { MemoryTagSource } from "@/adapters/memory/tag_source/tag_source";
import { MemoryTelemetry } from "@/adapters/memory/telemetry/telemetry";
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
  const memory = new MemoryClient(createSamplePosts(SAMPLE_POST_COUNT));

  startApp({ version: "demo", ...readBrowserEnvironment(), ...createDemoPlace() }, {
    favoritesSource: new MemoryFavoritesSource(memory),
    favoritesEditor: new MemoryFavoritesEditor(memory),
    postSource: new MemoryPostSource(memory),
    tagSource: new MemoryTagSource(),
    navigation: new MemoryNavigation(),
    host: new MemoryHost(),
    telemetry: new MemoryTelemetry()
  });
}

main();
