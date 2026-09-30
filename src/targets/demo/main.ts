import { readBrowserEnvironment, readPreferredColorScheme } from "@/adapters/browser/environment/environment";
import { BrowserHostPage } from "@/adapters/browser/ports/host_page/host_page";
import { BrowserLocalKeyedValues } from "@/adapters/browser/ports/local_keyed_values/local_keyed_values";
import { BrowserScheduler } from "@/adapters/browser/ports/scheduler/scheduler";
import { IndexedDbClient } from "@/adapters/indexed_db/client/client";
import { IndexedDbLocalFavorites } from "@/adapters/indexed_db/ports/local_favorites/local_favorites";
import { IndexedDbLocalPosts } from "@/adapters/indexed_db/ports/local_posts/local_posts";
import { IndexedDbLocalTagCategories } from "@/adapters/indexed_db/ports/local_tag_categories/local_tag_categories";
import { HostEnvironment } from "@/core/boundary/environment";
import { MemoryClient } from "@/adapters/memory/client/client";
import { MemoryNavigation } from "@/adapters/memory/ports/navigation/navigation";
import { MemoryRemoteFavorites } from "@/adapters/memory/ports/remote_favorites/remote_favorites";
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
    colorScheme: readPreferredColorScheme()
  };
}

function createPorts(
  memoryClient: MemoryClient,
  indexedDbClient: IndexedDbClient
): Ports {
  return {
    remoteFavorites: new MemoryRemoteFavorites(memoryClient),
    remotePosts: new MemoryRemotePosts(memoryClient),
    remoteTagCategories: new MemoryRemoteTagCategories(),
    remoteMedia: new MemoryRemoteMedia(),
    navigation: new MemoryNavigation(),
    hostPage: new BrowserHostPage(),
    localFavorites: new IndexedDbLocalFavorites(indexedDbClient, "demo"),
    localKeyedValues: new BrowserLocalKeyedValues(),
    localPosts: new IndexedDbLocalPosts(indexedDbClient),
    localTagCategories: new IndexedDbLocalTagCategories(indexedDbClient),
    scheduler: new BrowserScheduler()
  };
}

function main(): void {
  const memoryClient = new MemoryClient(createSamplePosts(SAMPLE_POST_COUNT));
  const indexedDbClient = new IndexedDbClient("demo");

  startApp({ version: "demo", ...readBrowserEnvironment(), ...createDemoHostEnvironment() }, createPorts(memoryClient, indexedDbClient), document.body);
}

main();
