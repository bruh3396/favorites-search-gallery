import { decodeBitmap, loadImage } from "@/adapters/browser/image/image_utilities";
import { BrowserClipboard } from "@/adapters/browser/ports/clipboard/browser_clipboard";
import { BrowserConfirmer } from "@/adapters/browser/ports/confirmer/browser_confirmer";
import { BrowserFileSaver } from "@/adapters/browser/ports/file_saver/browser_file_saver";
import { BrowserLocalKeyedValues } from "@/adapters/browser/ports/local_keyed_values/browser_local_keyed_values";
import { BrowserNavigator } from "@/adapters/browser/ports/navigator/browser_navigator";
import { BrowserRandomSource } from "@/adapters/browser/ports/random_source/browser_random_source";
import { BrowserScheduler } from "@/adapters/browser/ports/scheduler/browser_scheduler";
import { BrowserSizeObserver } from "@/adapters/browser/ports/size_observer/browser_size_observer";
import { BrowserViewport } from "@/adapters/browser/ports/viewport/browser_viewport";
import { BrowserVisibilityObserver } from "@/adapters/browser/ports/visibility_observer/browser_visibility_observer";
import { CorpusFile } from "@/targets/lab/storage/corpus_file";
import { IndexedDbClient } from "@/adapters/browser/indexed_db/indexed_db_client";
import { IndexedDbLocalFavorites } from "@/adapters/browser/ports/local_favorites/indexed_db_local_favorites";
import { IndexedDbLocalPosts } from "@/adapters/browser/ports/local_posts/indexed_db_local_posts";
import { IndexedDbLocalSnippets } from "@/adapters/browser/ports/local_snippets/indexed_db_local_snippets";
import { IndexedDbLocalTagCategories } from "@/adapters/browser/ports/local_tag_categories/indexed_db_local_tag_categories";
import { MediaMinter } from "@/core/domain/media/media_minter";
import { MemoryHostPage } from "@/adapters/memory/ports/host_page/memory_host_page";
import { Rule34CdnClient } from "@/adapters/rule34_cdn/client/rule34_cdn_client";
import { Rule34CdnRemoteMedia } from "@/adapters/rule34_cdn/ports/remote_media/rule34_cdn_remote_media";
import { Rule34Client } from "@/adapters/rule34/client/rule34_client";
import { Rule34Document } from "@/adapters/rule34/document/rule34_document";
import { Rule34RemotePages } from "@/adapters/rule34/ports/remote_pages/rule34_remote_pages";
import { UnavailableRemotePosts } from "@/core/boundary/ports/remote_posts/unavailable_remote_posts";
import { claimBodyContent } from "@/adapters/browser/document/body_content_claimer";
import { composeBenchmarksPanel } from "@/targets/lab/benchmarks/benchmarks_panel_composer";
import { composeFavoritesApp } from "@/core/app/favorites/favorites_app_composer";
import { composeFavoritesPanel } from "@/targets/lab/favorites/favorites_panel_composer";
import { composeLab } from "@/targets/lab/lab_composer";
import { composeStoragePanel } from "@/targets/lab/storage/storage_panel_composer";
import { createBranchStoredValueStorage } from "@/core/utils/storage/branch_stored_value_storage";

declare const SCRIPT_VERSION: string;

function startFavoritesApp(container: HTMLElement, indexedDbClient: IndexedDbClient, rule34Document: Rule34Document): void {
  const scheduler = new BrowserScheduler();
  const randomSource = new BrowserRandomSource();
  const boundFetch = fetch.bind(globalThis);
  const rule34CdnClient = new Rule34CdnClient({ fetch: boundFetch, scheduler, loadImage, decodeBitmap });
  const mintMedia: MediaMinter = file => rule34CdnClient.mintMediaFromUrl(file);
  const rule34Client = new Rule34Client({ fetch: boundFetch, scheduler, mintMedia, rule34Document });

  composeFavoritesApp({
    userOwnsFavorites: true,
    userLoggedIn: true,
    blacklistedTags: [],
    favoritesOwnerId: "lab",
    colorScheme: "dark",
    scriptVersion: SCRIPT_VERSION
  }, {
    scheduler,
    randomSource,
    storedValueStorage: createBranchStoredValueStorage("fsg-lab", new BrowserLocalKeyedValues()),
    hostPage: new MemoryHostPage(),
    sizeObserver: new BrowserSizeObserver(),
    viewport: new BrowserViewport(),
    navigator: new BrowserNavigator(),
    fileSaver: new BrowserFileSaver(document),
    clipboard: new BrowserClipboard(navigator.clipboard),
    confirmer: new BrowserConfirmer(),
    localFavorites: new IndexedDbLocalFavorites({ ownerId: "lab" }, indexedDbClient),
    localPosts: new IndexedDbLocalPosts(indexedDbClient),
    localSnippets: new IndexedDbLocalSnippets(indexedDbClient),
    localTagCategories: new IndexedDbLocalTagCategories(indexedDbClient),
    remoteFavorites: {
      fetchCount: () => Promise.resolve(0),
      fetchAll: () => Promise.resolve(),
      findNew: () => Promise.resolve([]),
      findMissing: () => Promise.resolve([]),
      add: () => Promise.resolve("added"),
      remove: () => Promise.resolve(true)
    },
    remotePosts: new UnavailableRemotePosts(),
    remoteMedia: new Rule34CdnRemoteMedia(rule34CdnClient),
    remotePages: new Rule34RemotePages({ rule34Client, scheduler, randomSource }),
    visibilityObserver: new BrowserVisibilityObserver()
  }).mount(container);
}

function main(): void {
  const rule34Document = new Rule34Document();
  const indexedDbClient = new IndexedDbClient({ databaseName: "fsg-lab" });
  const corpusLocalFavorites = new IndexedDbLocalFavorites({ ownerId: "corpus" }, indexedDbClient);
  const labLocalFavorites = new IndexedDbLocalFavorites({ ownerId: "lab" }, indexedDbClient);
  const localPosts = new IndexedDbLocalPosts(indexedDbClient);
  const labContainer = claimBodyContent();

  rule34Document.clearNativePage();
  rule34Document.setHeaderVisible(false);
  composeLab({
    renderFavoritesPanel: composeFavoritesPanel({
      scheduler: new BrowserScheduler(),
      corpusLocalFavorites,
      labLocalFavorites,
      startFavoritesApp: (container): void => startFavoritesApp(container, indexedDbClient, rule34Document)
    }),
    renderStoragePanel: composeStoragePanel({
      confirmer: new BrowserConfirmer(),
      fileSaver: new BrowserFileSaver(document),
      mainIndexedDbClient: new IndexedDbClient({ databaseName: "favorites-search-gallery" }),
      corpusFile: new CorpusFile({ chunkSize: 10_000 }, {
        localPosts,
        corpusLocalFavorites,
        labLocalFavorites
      })
    }),
    renderBenchmarksPanel: composeBenchmarksPanel({ indexedDbClient })
  }).mount(labContainer);
}

main();
