import { readBrowserEnvironment, readPreferredColorScheme } from "@/adapters/browser/environment/environment";
import { BrowserHostPage } from "@/adapters/browser/ports/host_page/host_page";
import { BrowserLocalKeyedValues } from "@/adapters/browser/ports/local_keyed_values/local_keyed_values";
import { BrowserRandomSource } from "@/adapters/browser/ports/random_source/random_source";
import { BrowserScheduler } from "@/adapters/browser/ports/scheduler/scheduler";
import { HostEnvironment } from "@/core/boundary/environment";
import { IndexedDbClient } from "@/adapters/indexed_db/client/client";
import { IndexedDbLocalFavorites } from "@/adapters/indexed_db/ports/local_favorites/local_favorites";
import { IndexedDbLocalPosts } from "@/adapters/indexed_db/ports/local_posts/local_posts";
import { IndexedDbLocalTagCategories } from "@/adapters/indexed_db/ports/local_tag_categories/local_tag_categories";
import { MemoryClient } from "@/adapters/memory/client/client";
import { MemoryNavigator } from "@/adapters/memory/ports/navigator/navigator";
import { MemoryRemoteFavorites } from "@/adapters/memory/ports/remote_favorites/remote_favorites";
import { MemoryRemoteMedia } from "@/adapters/memory/ports/remote_media/remote_media";
import { MemoryRemotePages } from "@/adapters/memory/ports/remote_pages/remote_pages";
import { MemoryRemotePosts } from "@/adapters/memory/ports/remote_posts/remote_posts";
import { MemoryRemoteSearchResults } from "@/adapters/memory/ports/remote_search_results/remote_search_results";
import { MemoryRemoteTagCategories } from "@/adapters/memory/ports/remote_tag_categories/remote_tag_categories";
import { Ports } from "@/core/boundary/ports/ports";
import { createSamplePosts } from "@/targets/demo/sample_posts";
import { startApp } from "@/app/startup/app";

const SAMPLE_POST_COUNT = 300;
const SEARCH_RESULTS = { pageSize: 42, initialPageIndex: 0 };

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
  indexedDbClient: IndexedDbClient,
  hostPage: BrowserHostPage
): Ports {
  return {
    remoteFavorites: new MemoryRemoteFavorites(memoryClient),
    remotePosts: new MemoryRemotePosts(memoryClient),
    remoteSearchResults: new MemoryRemoteSearchResults(SEARCH_RESULTS, memoryClient),
    remoteTagCategories: new MemoryRemoteTagCategories(),
    remoteMedia: new MemoryRemoteMedia(),
    remotePages: new MemoryRemotePages(),
    navigator: new MemoryNavigator(),
    hostPage,
    localFavorites: new IndexedDbLocalFavorites({ ownerId: "demo" }, indexedDbClient),
    localKeyedValues: new BrowserLocalKeyedValues(),
    localPosts: new IndexedDbLocalPosts(indexedDbClient),
    localTagCategories: new IndexedDbLocalTagCategories(indexedDbClient),
    randomSource: new BrowserRandomSource(),
    scheduler: new BrowserScheduler()
  };
}

function main(): void {
  const memoryClient = new MemoryClient(createSamplePosts(SAMPLE_POST_COUNT));
  const indexedDbClient = new IndexedDbClient("demo");
  const hostPage = new BrowserHostPage();

  startApp({
      version: "demo",
      ...readBrowserEnvironment(), ...createDemoHostEnvironment()
    }, createPorts(memoryClient, indexedDbClient, hostPage), hostPage);
}

main();
