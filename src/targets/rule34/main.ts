import { AppMode, Environment } from "@/core/boundary/environment";
import {
  DEFAULT_RULE34_DEPENDENCIES_CONFIGURATION,
  Rule34Dependencies,
  createFavoritesDependencies,
  createRule34Dependencies
} from "@/targets/rule34/dependencies";
import { BrowserFileSaver } from "@/adapters/browser/ports/file_saver/browser_file_saver";
import { FallbackRemotePosts } from "@/core/boundary/ports/remote_posts/fallback_remote_posts";
import { FrozenCobaltClient } from "@/adapters/frozen_cobalt/client/frozen_cobalt_client";
import { FrozenCobaltRemotePosts } from "@/adapters/frozen_cobalt/ports/remote_posts/frozen_cobalt_remote_posts";
import { Rule34RemotePosts } from "@/adapters/rule34/ports/remote_posts/rule34_remote_posts";
import { BrowserNavigator } from "@/adapters/browser/ports/navigator/browser_navigator";
import { BrowserSizeObserver } from "@/adapters/browser/ports/size_observer/browser_size_observer";
import { BrowserVisibilityObserver } from "@/adapters/browser/ports/visibility_observer/browser_visibility_observer";
import { Rule34CdnRemoteMedia } from "@/adapters/rule34_cdn/ports/remote_media/rule34_cdn_remote_media";
import { Rule34Document } from "@/adapters/rule34/document/rule34_document";
import { Rule34RemotePages } from "@/adapters/rule34/ports/remote_pages/rule34_remote_pages";
import { Rule34RemotePostList } from "@/adapters/rule34/ports/remote_post_list/rule34_remote_post_list";
import { composeFavoritesApp } from "@/core/app/favorites/favorites_app_composer";
import { composePostListApp } from "@/core/app/post_list/post_list_app_composer";
import { APP_STORAGE_SCHEMA } from "@/core/app/app_storage_schema";
import { createAppStorage } from "@/core/app/app_storage";
import { createStoredTree } from "@/core/utils/stored_value/stored_tree";
import { readBrowserEnvironment } from "@/adapters/browser/environment/browser_environment_reader";
import { readRule34Environment } from "@/adapters/rule34/environment/rule34_environment_reader";

declare const SCRIPT_VERSION: string;
declare const USE_LOCAL_SERVER: boolean;

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

function createFrozenCobaltClient(
  environment: Environment,
  { fetch, scheduler, rule34Document }: Pick<Rule34Dependencies, "fetch" | "scheduler" | "rule34Document">
): FrozenCobaltClient {
  return new FrozenCobaltClient({
    origin: USE_LOCAL_SERVER ? "http://localhost:8787" : "https://frozencobalt.stream",
    identity: { userId: rule34Document.readUserId(), version: environment.version, platform: environment.device }
  }, { scheduler, fetch });
}

function startFavoritesApp(environment: Environment, dependencies: Rule34Dependencies): void {
  const { mintMedia, rule34, scheduler, randomSource } = dependencies;
  const frozenCobalt = createFrozenCobaltClient(environment, dependencies);
  const remotePosts = new FallbackRemotePosts({
    primary: new FrozenCobaltRemotePosts({ frozenCobalt, mintMedia, scheduler, randomSource }),
    fallback: new Rule34RemotePosts({ rule34, scheduler, randomSource })
  });

  frozenCobalt.ping();
  composeFavoritesApp({
    userOwnsFavorites: environment.ownsFavorites,
    blacklistedTags: environment.blacklistedTags,
    favoritesOwnerId: environment.favoritesOwnerId,
    colorScheme: environment.colorScheme
  }, createFavoritesDependencies(DEFAULT_RULE34_DEPENDENCIES_CONFIGURATION, environment, dependencies, remotePosts))
    .mount(dependencies.hostPage.claimContent());
}

function startPostListApp(environment: Environment, {
  hostPage, rule34, rule34Cdn, rule34Document, randomSource, localKeyedValues, scheduler
}: Rule34Dependencies): void {
  const { app: appPreferences } = createStoredTree(APP_STORAGE_SCHEMA.preferences, createAppStorage(localKeyedValues).preferences, ["app"]);

  if (!appPreferences.postListEnabled.peek()) {
    return;
  }
  const remotePostList = new Rule34RemotePostList({ rule34, rule34Document, scheduler, randomSource });

  composePostListApp({ colorScheme: environment.colorScheme }, {
    scheduler,
    visibilityObserver: new BrowserVisibilityObserver(),
    sizeObserver: new BrowserSizeObserver(),
    remoteMedia: new Rule34CdnRemoteMedia(rule34Cdn),
    remotePages: new Rule34RemotePages(rule34),
    remotePostList,
    localKeyedValues,
    navigator: new BrowserNavigator(),
    fileSaver: new BrowserFileSaver(document)
  }).mount(hostPage.claimContent());
}

function main(): void {
  const rule34Document = new Rule34Document();
  const environment = readEnvironment(rule34Document);
  const dependencies = createRule34Dependencies(DEFAULT_RULE34_DEPENDENCIES_CONFIGURATION, environment, rule34Document);

  APPS[environment.mode](environment, dependencies);
}

main();
