import { ColorScheme, Environment } from "@/core/boundary/environment";
import { DEFAULT_INDEXED_DB_CONFIGURATION, IndexedDbClient, IndexedDbClientConfiguration } from "@/adapters/browser/indexed_db/client";
import { EmptyState, EmptyStateAction } from "@/core/ui/components/empty_state/empty_state";
import { FavoritesAppDependencies, composeFavoritesApp } from "@/core/app/favorites/composer";
import { PostUnavailableError, RemotePosts } from "@/core/boundary/ports/remote_posts/remote_posts";
import { decodeBitmap, loadImage } from "@/adapters/browser/image/image";
import { deleteDatabases, listDatabaseNames, pickJsonFile, writeLegacySnapshot } from "@/targets/lab/snapshot";
import { h, render } from "@/core/ui/h/h";
import { BrowserFileSaver } from "@/adapters/browser/ports/file_saver/file_saver";
import { BrowserHostPage } from "@/adapters/browser/ports/host_page/host_page";
import { BrowserLocalKeyedValues } from "@/adapters/browser/ports/local_keyed_values/local_keyed_values";
import { BrowserMorpher } from "@/adapters/browser/ports/morpher/morpher";
import { BrowserNavigator } from "@/adapters/browser/ports/navigator/navigator";
import { BrowserPageVisibility } from "@/adapters/browser/ports/page_visibility/page_visibility";
import { BrowserRandomSource } from "@/adapters/browser/ports/random_source/random_source";
import { BrowserScheduler } from "@/adapters/browser/ports/scheduler/scheduler";
import { BrowserSizeObserver } from "@/adapters/browser/ports/size_observer/size_observer";
import { BrowserVisibilityObserver } from "@/adapters/browser/ports/visibility_observer/visibility_observer";
import { INSTRUMENT_FONT } from "@/core/ui/fonts/instrument";
import { IndexedDbLocalFavorites } from "@/adapters/browser/ports/local_favorites/local_favorites";
import { IndexedDbLocalPosts } from "@/adapters/browser/ports/local_posts/local_posts";
import { IndexedDbLocalTagCategories } from "@/adapters/browser/ports/local_tag_categories/local_tag_categories";
import LAB_CSS from "@/targets/lab/lab.css?inline";
import { Media } from "@/core/domain/media/media";
import { NamespacedLocalKeyedValues } from "@/core/boundary/ports/local_keyed_values/namespaced_local_keyed_values";
import { RemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/remote_favorite_actions";
import { RemoteFavorites } from "@/core/boundary/ports/remote_favorites/remote_favorites";
import { Rule34CdnClient } from "@/adapters/rule34_cdn/client/client";
import { Rule34CdnRemoteMedia } from "@/adapters/rule34_cdn/ports/remote_media/remote_media";
import { Rule34Client } from "@/adapters/rule34/client/client";
import { Rule34Document } from "@/adapters/rule34/document/document";
import { Rule34HostPage } from "@/adapters/rule34/ports/host_page/host_page";
import { Rule34RemotePages } from "@/adapters/rule34/ports/remote_pages/remote_pages";
import { Signal } from "@/core/utils/reactive/signal";
import UI_CSS from "@/core/ui/styles.css?inline";
import { mountAppRoot } from "@/core/ui/app_root/app_root";
import { readBrowserEnvironment } from "@/adapters/browser/environment/environment";
import { readRule34Environment } from "@/adapters/rule34/environment/environment";

declare const SCRIPT_VERSION: string;

const LabClass = {
  bar: "fsg-LabBar",
  button: "fsg-LabBar-button"
} as const;

const SETUP_MESSAGE = "No lab data yet. Load a legacy snapshot and the real migration moves it into the lab.";
const LAB_NAMESPACE = "fsg-lab";
const RESET_FLAG = `${LAB_NAMESPACE}-reset`;
const LAB_INDEXED_DB_CONFIGURATION: IndexedDbClientConfiguration = {
  databaseName: LAB_NAMESPACE,
  legacyDatabaseNames: {
    favorites: `${LAB_NAMESPACE}-FavoritesV2`,
    posts: `${LAB_NAMESPACE}-Posts`,
    tagCategories: `${LAB_NAMESPACE}-TagCategories`
  }
};
const LAB_DATABASE_NAMES = [LAB_INDEXED_DB_CONFIGURATION.databaseName, ...Object.values(LAB_INDEXED_DB_CONFIGURATION.legacyDatabaseNames)];

const UNCHANGED_REMOTE_FAVORITES: RemoteFavorites = {
  fetchCount: () => Promise.resolve(null),
  fetchAll: () => Promise.resolve(),
  findNew: () => Promise.resolve([]),
  findRemoved: () => Promise.resolve([])
};
const UNAVAILABLE_REMOTE_POSTS: RemotePosts = {
  fetch: post => Promise.reject(new PostUnavailableError(post.id))
};
const BLOCKED_REMOTE_FAVORITE_ACTIONS: RemoteFavoriteActions = {
  add: () => Promise.resolve("blocked"),
  remove: () => Promise.resolve("blocked")
};

function createLabDependencies(environment: Environment, rule34Document: Rule34Document): FavoritesAppDependencies {
  const scheduler = new BrowserScheduler();
  const randomSource = new BrowserRandomSource();
  const boundFetch = fetch.bind(globalThis);
  const rule34Cdn = new Rule34CdnClient({ fetch: boundFetch, scheduler, loadImage, decodeBitmap });
  const mintMedia = (file: { url: string; tags: string }): Media | null => rule34Cdn.mintMedia(file);
  const rule34 = new Rule34Client({ fetch: boundFetch, scheduler, randomSource, mintMedia, rule34Document });
  const indexedDb = new IndexedDbClient(LAB_INDEXED_DB_CONFIGURATION, mintMedia);
  return {
    scheduler,
    randomSource,
    localKeyedValues: new NamespacedLocalKeyedValues(LAB_NAMESPACE, new BrowserLocalKeyedValues()),
    sizeObserver: new BrowserSizeObserver(),
    morpher: new BrowserMorpher(),
    navigator: new BrowserNavigator(),
    fileSaver: new BrowserFileSaver(document),
    pageVisibility: new BrowserPageVisibility(document),
    localFavorites: new IndexedDbLocalFavorites({ ownerId: environment.favoritesOwnerId }, indexedDb),
    localPosts: new IndexedDbLocalPosts(indexedDb),
    localTagCategories: new IndexedDbLocalTagCategories(indexedDb),
    remoteFavorites: UNCHANGED_REMOTE_FAVORITES,
    remoteFavoriteActions: BLOCKED_REMOTE_FAVORITE_ACTIONS,
    remotePosts: UNAVAILABLE_REMOTE_POSTS,
    remoteMedia: new Rule34CdnRemoteMedia(rule34Cdn),
    remotePages: new Rule34RemotePages(rule34),
    visibilityObserver: new BrowserVisibilityObserver()
  };
}

function mountLabRoot(container: HTMLElement, colorScheme: ColorScheme): HTMLElement {
  return mountAppRoot(container, { colorScheme, font: INSTRUMENT_FONT, styles: [UI_CSS, LAB_CSS] });
}

function startApp(environment: Environment, rule34Document: Rule34Document, hostPage: Rule34HostPage): void {
  composeFavoritesApp({
    userOwnsFavorites: environment.ownsFavorites,
    blacklistedTags: environment.blacklistedTags,
    favoritesOwnerId: environment.favoritesOwnerId,
    colorScheme: environment.colorScheme
  }, createLabDependencies(environment, rule34Document)).mount(hostPage.claimContent());
}

function showSetup(colorScheme: ColorScheme, hostPage: Rule34HostPage): void {
  const root = mountLabRoot(hostPage.claimContent(), colorScheme);
  const message = new Signal(SETUP_MESSAGE);
  const action = new Signal<EmptyStateAction | null>(null);
  const load = { label: "Load legacy snapshot", onClick: (): void => {
    loadLegacySnapshot(message, action).catch((error: unknown) => {
      message.value = `Couldn't load the snapshot: ${String(error)}`;
      action.value = load;
    });
  } };

  action.value = load;
  root.append(render(document, () => h(EmptyState, { isShown: new Signal(true), message, action })).result);
}

async function loadLegacySnapshot(message: Signal<string>, action: Signal<EmptyStateAction | null>): Promise<void> {
  const snapshot = await pickJsonFile();

  if (snapshot === null) {
    return;
  }
  message.value = "Writing the snapshot…";
  action.value = null;
  await writeLegacySnapshot(snapshot, DEFAULT_INDEXED_DB_CONFIGURATION.legacyDatabaseNames, LAB_INDEXED_DB_CONFIGURATION.legacyDatabaseNames);
  location.reload();
}

function mountResetBar(colorScheme: ColorScheme): void {
  const host = document.createElement("div");
  const button = document.createElement("button");

  document.body.append(host);
  const root = mountLabRoot(host, colorScheme);

  root.classList.add(LabClass.bar);
  button.className = LabClass.button;
  button.type = "button";
  button.textContent = "Reset lab";
  button.onclick = (): void => {
    sessionStorage.setItem(RESET_FLAG, "1");
    location.reload();
  };
  root.append(button);
}

async function main(): Promise<void> {
  const rule34Document = new Rule34Document();
  const hostEnvironment = readRule34Environment(rule34Document);

  if (hostEnvironment?.mode !== "favorites") {
    return;
  }

  if (sessionStorage.getItem(RESET_FLAG) !== null) {
    sessionStorage.removeItem(RESET_FLAG);
    await deleteDatabases(LAB_DATABASE_NAMES);
  }
  const present = await listDatabaseNames();
  const hostPage = new Rule34HostPage({ mode: hostEnvironment.mode }, { rule34Document, page: new BrowserHostPage() });

  if (!LAB_DATABASE_NAMES.some(name => present.has(name))) {
    showSetup(hostEnvironment.colorScheme, hostPage);
    return;
  }
  startApp({ version: SCRIPT_VERSION, ...readBrowserEnvironment(), ...hostEnvironment }, rule34Document, hostPage);
  mountResetBar(hostEnvironment.colorScheme);
}

main().catch((error: unknown) => console.error("Lab failed to start", error));
