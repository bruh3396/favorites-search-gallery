import { AppMode, Environment } from "@/core/boundary/environment";
import {
  DEFAULT_RULE34_DEPENDENCIES_CONFIGURATION,
  Rule34Dependencies,
  createFavoritesDependencies,
  createRule34Dependencies
} from "@/targets/rule34/dependencies";
import { BrowserVisibilityObserver } from "@/adapters/browser/ports/visibility_observer/visibility_observer";
import { BrowserSizeObserver } from "@/adapters/browser/ports/size_observer/size_observer";
import { BrowserNavigator } from "@/adapters/browser/ports/navigator/navigator";
import { BrowserFileSaver } from "@/adapters/browser/ports/file_saver/file_saver";
import { Rule34CdnRemoteMedia } from "@/adapters/rule34_cdn/ports/remote_media/remote_media";
import { Rule34Document } from "@/adapters/rule34/document/document";
import { Rule34RemotePages } from "@/adapters/rule34/ports/remote_pages/remote_pages";
import { Rule34RemoteSearchResults } from "@/adapters/rule34/ports/remote_search_results/remote_search_results";
import { composeFavoritesApp } from "@/core/app/favorites/composer";
import { composePostListApp } from "@/core/app/post_list/composer";
import { readBrowserEnvironment } from "@/adapters/browser/environment/environment";
import { readRule34Environment } from "@/adapters/rule34/environment/environment";

declare const SCRIPT_VERSION: string;

type StartApp = (environment: Environment, dependencies: Rule34Dependencies) => void;

const APPS: Record<AppMode, StartApp> = {
  favorites: startFavoritesApp,
  postList: startPostListApp
};

function readEnvironment(rule34Document: Rule34Document): Environment {
  const hostEnvironment = readRule34Environment(rule34Document);

  if (hostEnvironment === null) {
    throw new Error(`Unsupported page: ${location.href}`);
  }
  return { version: SCRIPT_VERSION, ...readBrowserEnvironment(), ...hostEnvironment };
}

function startFavoritesApp(environment: Environment, dependencies: Rule34Dependencies): void {
  composeFavoritesApp({
    userOwnsFavorites: environment.ownsFavorites,
    blacklistedTags: environment.blacklistedTags,
    favoritesOwnerId: environment.favoritesOwnerId,
    colorScheme: environment.colorScheme
  }, createFavoritesDependencies(DEFAULT_RULE34_DEPENDENCIES_CONFIGURATION, environment, dependencies)).mount(dependencies.hostPage.claimContent());
}

function startPostListApp(environment: Environment, {
  hostPage, rule34, rule34Cdn, rule34Document, randomSource, localKeyedValues, scheduler
}: Rule34Dependencies): void {
  const remoteSearchResults = new Rule34RemoteSearchResults({ rule34, rule34Document, scheduler, randomSource });

  composePostListApp({ colorScheme: environment.colorScheme }, {
    scheduler,
    visibilityObserver: new BrowserVisibilityObserver(),
    sizeObserver: new BrowserSizeObserver(),
    remoteMedia: new Rule34CdnRemoteMedia(rule34Cdn),
    remotePages: new Rule34RemotePages(rule34),
    remoteSearchResults,
    localKeyedValues,
    navigator: new BrowserNavigator(),
    fileSaver: new BrowserFileSaver(document)
  }).mount(hostPage.claimContent());
}

function main(): void {
  const rule34Document = new Rule34Document();
  const environment = readEnvironment(rule34Document);

  APPS[environment.mode](environment, createRule34Dependencies(DEFAULT_RULE34_DEPENDENCIES_CONFIGURATION, environment, rule34Document));
}

main();
