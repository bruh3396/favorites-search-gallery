import { LAB_INDEXED_DB_CONFIGURATION, LAB_NAMESPACE, LAB_OWNER_ID, applyPendingReset, readCorpusSize, readFavoriteCount } from "@/targets/lab/databases";
import { Rule34Dependencies, Rule34DependenciesConfiguration, createFavoritesDependencies, createRule34Dependencies } from "@/targets/rule34/dependencies";
import { UNAVAILABLE_REMOTE_POSTS, UNCHANGED_REMOTE_FAVORITES } from "@/targets/lab/offline_remotes";
import { Environment } from "@/core/boundary/environment";
import { Signal } from "@/core/utils/reactive/signal";
import { Rule34Document } from "@/adapters/rule34/document/document";
import { applyPendingPurge } from "@/targets/lab/real_data";
import { composeFavoritesApp } from "@/core/app/favorites/composer";
import { createAppStorage } from "@/core/app/app_storage";
import { createFavoritesPreferences } from "@/core/app/preferences";
import { mountLabScreen } from "@/targets/lab/screen";
import { readBrowserEnvironment } from "@/adapters/browser/environment/environment";
import { readRule34Environment } from "@/adapters/rule34/environment/environment";

declare const SCRIPT_VERSION: string;

const LAB_CONFIGURATION: Rule34DependenciesConfiguration = {
  indexedDb: LAB_INDEXED_DB_CONFIGURATION,
  localKeyedValuesNamespace: LAB_NAMESPACE
};

function startApp(environment: Environment, dependencies: Rule34Dependencies): void {
  composeFavoritesApp({
    userOwnsFavorites: environment.ownsFavorites,
    blacklistedTags: environment.blacklistedTags,
    favoritesOwnerId: environment.favoritesOwnerId,
    colorScheme: environment.colorScheme
  }, {
    ...createFavoritesDependencies(LAB_CONFIGURATION, environment, dependencies),
    remoteFavorites: UNCHANGED_REMOTE_FAVORITES,
    remotePosts: UNAVAILABLE_REMOTE_POSTS
  }).mount(dependencies.hostPage.claimContent());
}

async function main(): Promise<void> {
  const rule34Document = new Rule34Document();
  const hostEnvironment = readRule34Environment(rule34Document);

  if (hostEnvironment?.mode !== "favorites") {
    return;
  }
  document.title = "FSG Lab";
  await applyPendingPurge();
  await applyPendingReset();
  const environment = { version: SCRIPT_VERSION, ...readBrowserEnvironment(), ...hostEnvironment, favoritesOwnerId: LAB_OWNER_ID };
  const dependencies = createRule34Dependencies(LAB_CONFIGURATION, environment, rule34Document);
  const labContainer = dependencies.hostPage.claimContent();
  const { nativeHeaderVisible } = createFavoritesPreferences(createAppStorage(dependencies.localKeyedValues).favoritesPreferences);

  dependencies.hostPage.setHeaderVisible(nativeHeaderVisible.value);
  nativeHeaderVisible.changed.on(visible => dependencies.hostPage.setHeaderVisible(visible));

  const postCount = new Signal<number | null>(null);
  const favoriteCount = new Signal<number | null>(null);

  mountLabScreen(labContainer, { colorScheme: environment.colorScheme }, {
    scheduler: dependencies.scheduler,
    postCount,
    favoriteCount,
    nativeHeaderVisible,
    onStart: () => {
      labContainer.remove();
      startApp(environment, dependencies);
    }
  });
  postCount.value = await readCorpusSize();
  favoriteCount.value = await readFavoriteCount();
}

main().catch((error: unknown) => console.error("Lab failed to start", error));
