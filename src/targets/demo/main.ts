import { readBrowserEnvironment, readPrefersDarkMode } from "@/adapters/browser/environment/environment";
import { BrowserKeyValueStore } from "@/adapters/browser/ports/key_value_store/key_value_store";
import { HostEnvironment } from "@/core/boundary/environment";
import { MemoryClient } from "@/adapters/memory/client/client";
import { MemoryRemoteFavorites } from "@/adapters/memory/ports/remote_favorites/remote_favorites";
import { MemoryHost } from "@/adapters/memory/ports/host/host";
import { MemoryNavigation } from "@/adapters/memory/ports/navigation/navigation";
import { MemoryRemoteMedia } from "@/adapters/memory/ports/remote_media/remote_media";
import { MemoryRemotePosts } from "@/adapters/memory/ports/remote_posts/remote_posts";
import { MemoryRemoteTagCategories } from "@/adapters/memory/ports/remote_tag_categories/remote_tag_categories";
import { Ports } from "@/core/boundary/ports/ports";
import { createSamplePosts } from "@/targets/demo/sample_posts";
import { startApp } from "@/app/startup/app";

const SAMPLE_POST_COUNT = 300;

function createDemoHostEnvironment(): HostEnvironment {
  return {
    mode: "favorites",
    favoritesOwnerId: "demo",
    ownsFavorites: true,
    blacklistedTags: "",
    darkTheme: readPrefersDarkMode()
  };
}

function createPorts(memoryClient: MemoryClient): Ports {
  return {
    remoteFavorites: new MemoryRemoteFavorites(memoryClient),
    remotePosts: new MemoryRemotePosts(memoryClient),
    remoteTagCategories: new MemoryRemoteTagCategories(),
    remoteMedia: new MemoryRemoteMedia(),
    navigation: new MemoryNavigation(),
    host: new MemoryHost(),
    keyValueStore: new BrowserKeyValueStore()
  };
}

function main(): void {
  const memoryClient = new MemoryClient(createSamplePosts(SAMPLE_POST_COUNT));

  startApp({ version: "demo", ...readBrowserEnvironment(), ...createDemoHostEnvironment() }, createPorts(memoryClient), document.body);
}

main();
