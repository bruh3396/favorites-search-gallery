import { LAB_INDEXED_DB_CONFIGURATION, LAB_NAMESPACE, LAB_OWNER_ID, applyPendingReset, readCorpusSize, readFavoriteCount } from "@/targets/lab/databases";
import { Rule34Dependencies, Rule34DependenciesConfiguration, createFavoritesDependencies, createRule34Dependencies } from "@/targets/rule34/dependencies";
import { UNAVAILABLE_REMOTE_POSTS, UNCHANGED_REMOTE_FAVORITES } from "@/targets/lab/offline_remotes";
import { Environment } from "@/core/boundary/environment";
import { Rule34Document } from "@/adapters/rule34/document/rule34_document";
import { Signal } from "@/core/utils/reactive/signal";
import { applyPendingPurge } from "@/targets/lab/real_data";
import { composeFavoritesApp } from "@/core/app/favorites/favorites_app_composer";
import { APP_STORAGE_SCHEMA } from "@/core/app/app_storage_schema";
import { createAppStorage } from "@/core/app/app_storage";
import { createStoredTree } from "@/core/utils/stored_value/stored_tree";
import { mountLabScreen } from "@/targets/lab/lab_screen";
import { readBrowserEnvironment } from "@/adapters/browser/environment/browser_environment_reader";
import { readRule34Environment } from "@/adapters/rule34/environment/rule34_environment_reader";

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
    ...createFavoritesDependencies(LAB_CONFIGURATION, environment, dependencies, UNAVAILABLE_REMOTE_POSTS),
    remoteFavorites: UNCHANGED_REMOTE_FAVORITES
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
  const { nativeHeaderVisible } = createStoredTree(APP_STORAGE_SCHEMA.preferences, createAppStorage(dependencies.localKeyedValues).preferences, ["favorites"]).favorites;

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
