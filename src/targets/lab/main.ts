import { FavoritesAppDependencies, composeFavoritesApp } from "@/core/app/favorites/favorites_app_composer";
import { LAB_INDEXED_DB_CONFIGURATION, LAB_NAMESPACE, LAB_OWNER_ID, applyPendingReset, readCorpusSize, readFavoriteCount } from "@/targets/lab/databases";
import { UNAVAILABLE_REMOTE_POSTS, UNCHANGED_REMOTE_FAVORITES } from "@/targets/lab/offline_remotes";
import { decodeBitmap, loadImage } from "@/adapters/browser/image/image_utilities";
import { BrowserClipboard } from "@/adapters/browser/ports/clipboard/browser_clipboard";
import { BrowserFileSaver } from "@/adapters/browser/ports/file_saver/browser_file_saver";
import { BrowserHostPage } from "@/adapters/browser/ports/host_page/browser_host_page";
import { BrowserLocalKeyedValues } from "@/adapters/browser/ports/local_keyed_values/browser_local_keyed_values";
import { BrowserNavigator } from "@/adapters/browser/ports/navigator/browser_navigator";
import { BrowserRandomSource } from "@/adapters/browser/ports/random_source/browser_random_source";
import { BrowserScheduler } from "@/adapters/browser/ports/scheduler/browser_scheduler";
import { BrowserSizeObserver } from "@/adapters/browser/ports/size_observer/browser_size_observer";
import { BrowserVisibilityObserver } from "@/adapters/browser/ports/visibility_observer/browser_visibility_observer";
import { Environment } from "@/core/boundary/environment";
import { IndexedDbClient } from "@/adapters/browser/indexed_db/indexed_db_client";
import { IndexedDbLocalFavorites } from "@/adapters/browser/ports/local_favorites/indexed_db_local_favorites";
import { IndexedDbLocalPosts } from "@/adapters/browser/ports/local_posts/indexed_db_local_posts";
import { IndexedDbLocalTagCategories } from "@/adapters/browser/ports/local_tag_categories/indexed_db_local_tag_categories";
import { MediaMinter } from "@/core/domain/media/media_minter";
import { NamespacedLocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/namespaced_local_keyed_values";
import { Rule34CdnClient } from "@/adapters/rule34_cdn/client/rule34_cdn_client";
import { Rule34CdnRemoteMedia } from "@/adapters/rule34_cdn/ports/remote_media/rule34_cdn_remote_media";
import { Rule34Client } from "@/adapters/rule34/client/rule34_client";
import { Rule34Document } from "@/adapters/rule34/document/rule34_document";
import { Rule34HostPage } from "@/adapters/rule34/ports/host_page/rule34_host_page";
import { Rule34RemotePages } from "@/adapters/rule34/ports/remote_pages/rule34_remote_pages";
import { Signal } from "@/core/utils/reactive/signal";
import { applyPendingPurge } from "@/targets/lab/real_data";
import { APP_STORAGE_SCHEMA } from "@/core/app/app_storage_schema";
import { createAppStorage } from "@/core/app/app_storage";
import { createStoredTree } from "@/core/utils/stored_value/stored_tree";
import { mountLabScreen } from "@/targets/lab/lab_screen";
import { readBrowserEnvironment } from "@/adapters/browser/environment/browser_environment_reader";
import { readRule34Environment } from "@/adapters/rule34/environment/rule34_environment_reader";

declare const SCRIPT_VERSION: string;

type LabBase = Pick<FavoritesAppDependencies, "scheduler" | "hostPage" | "localKeyedValues">;

function createFavoritesAppDependencies(environment: Environment, rule34Document: Rule34Document, labBase: LabBase): FavoritesAppDependencies {
  const { scheduler } = labBase;
  const randomSource = new BrowserRandomSource();
  const boundFetch = fetch.bind(globalThis);
  const rule34CdnClient = new Rule34CdnClient({ fetch: boundFetch, scheduler, loadImage, decodeBitmap });
  const mintMedia: MediaMinter = file => rule34CdnClient.mintMediaFromUrl(file);
  const rule34Client = new Rule34Client({ fetch: boundFetch, scheduler, randomSource, mintMedia, rule34Document });
  const indexedDbClient = new IndexedDbClient(LAB_INDEXED_DB_CONFIGURATION, mintMedia);
  return {
    ...labBase,
    randomSource,
    sizeObserver: new BrowserSizeObserver(),
    navigator: new BrowserNavigator(),
    fileSaver: new BrowserFileSaver(document),
    clipboard: new BrowserClipboard(navigator.clipboard),
    localFavorites: new IndexedDbLocalFavorites({ ownerId: environment.favoritesOwnerId }, indexedDbClient),
    localPosts: new IndexedDbLocalPosts(indexedDbClient),
    localTagCategories: new IndexedDbLocalTagCategories(indexedDbClient),
    remoteFavorites: UNCHANGED_REMOTE_FAVORITES,
    remotePosts: UNAVAILABLE_REMOTE_POSTS,
    remoteMedia: new Rule34CdnRemoteMedia(rule34CdnClient),
    remotePages: new Rule34RemotePages({ rule34Client, scheduler, randomSource }),
    visibilityObserver: new BrowserVisibilityObserver()
  };
}

function startApp(environment: Environment, favoritesAppDependencies: FavoritesAppDependencies, container: HTMLElement): void {
  composeFavoritesApp({
    userOwnsFavorites: environment.ownsFavorites,
    blacklistedTags: environment.blacklistedTags,
    favoritesOwnerId: environment.favoritesOwnerId,
    colorScheme: environment.colorScheme
  }, favoritesAppDependencies).mount(container);
}

async function main(): Promise<void> {
  const rule34Document = new Rule34Document();
  const hostEnvironment = readRule34Environment(rule34Document);

  if (hostEnvironment?.appMode !== "favorites") {
    return;
  }
  document.title = "FSG Lab";
  await applyPendingPurge();
  await applyPendingReset();
  const environment = { version: SCRIPT_VERSION, ...readBrowserEnvironment(), ...hostEnvironment, favoritesOwnerId: LAB_OWNER_ID };
  const scheduler = new BrowserScheduler();
  const hostPage = new Rule34HostPage({ appMode: environment.appMode }, { rule34Document, page: new BrowserHostPage() });
  const localKeyedValues = new NamespacedLocalKeyedValues(LAB_NAMESPACE, new BrowserLocalKeyedValues());
  const labContainer = hostPage.claimContent();
  const { nativeHeaderVisible } = createStoredTree(APP_STORAGE_SCHEMA.preferences, createAppStorage(localKeyedValues).preferences, ["favorites"]).favorites;

  hostPage.setHeaderVisible(nativeHeaderVisible.value);
  nativeHeaderVisible.changed.on(visible => hostPage.setHeaderVisible(visible));

  const postCount = new Signal<number | null>(null);
  const favoriteCount = new Signal<number | null>(null);

  mountLabScreen(labContainer, { colorScheme: environment.colorScheme }, {
    stepperScheduler: scheduler,
    postCount,
    favoriteCount,
    nativeHeaderVisible,
    onStart: () => {
      labContainer.remove();
      startApp(environment, createFavoritesAppDependencies(environment, rule34Document, { scheduler, hostPage, localKeyedValues }), hostPage.claimContent());
    }
  });
  postCount.value = await readCorpusSize();
  favoriteCount.value = await readFavoriteCount();
}

main().catch((error: unknown) => console.error("Lab failed to start", error));
