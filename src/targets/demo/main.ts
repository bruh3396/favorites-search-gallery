import { readBrowserEnvironment, readPrefersDarkMode } from "@/adapters/browser/environment/environment";
import { BrowserKeyValueStore } from "@/adapters/browser/ports/key_value_store/key_value_store";
import { MemoryClient } from "@/adapters/memory/client/client";
import { MemoryFavoritesEditor } from "@/adapters/memory/ports/favorites_editor/favorites_editor";
import { MemoryFavoritesSource } from "@/adapters/memory/ports/favorites_source/favorites_source";
import { MemoryHost } from "@/adapters/memory/ports/host/host";
import { MemoryMediaSource } from "@/adapters/memory/ports/media_source/media_source";
import { MemoryNavigation } from "@/adapters/memory/ports/navigation/navigation";
import { MemoryPostSource } from "@/adapters/memory/ports/post_source/post_source";
import { MemoryTagSource } from "@/adapters/memory/ports/tag_source/tag_source";
import { Place } from "@/core/boundary/environment";
import { Ports } from "@/core/boundary/ports/ports";
import { createSamplePosts } from "@/targets/demo/sample_posts";
import { startApp } from "@/app/startup/app";

const SAMPLE_POST_COUNT = 300;

function createDemoPlace(): Place {
  return {
    mode: "favorites",
    favoritesId: "demo",
    ownsFavorites: true,
    blacklistedTags: "",
    usingDarkMode: readPrefersDarkMode()
  };
}

function createPorts(memoryClient: MemoryClient): Ports {
  return {
    favoritesSource: new MemoryFavoritesSource(memoryClient),
    favoritesEditor: new MemoryFavoritesEditor(memoryClient),
    postSource: new MemoryPostSource(memoryClient),
    tagSource: new MemoryTagSource(),
    mediaSource: new MemoryMediaSource(),
    navigation: new MemoryNavigation(),
    host: new MemoryHost(),
    keyValueStore: new BrowserKeyValueStore()
  };
}

function main(): void {
  const memoryClient = new MemoryClient(createSamplePosts(SAMPLE_POST_COUNT));

  startApp({ version: "demo", ...readBrowserEnvironment(), ...createDemoPlace() }, createPorts(memoryClient), document.body);
}

main();
