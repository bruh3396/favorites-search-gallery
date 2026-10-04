import { PreferenceOverrides, createPreferences } from "@/testing/preferences";
import { AppContext } from "@/app/context/context";
import { DomEvents } from "@/app/context/dom_events";
import { Environment } from "@/core/boundary/environment";
import { Feature } from "@/core/context/features";
import { FeatureBridge } from "@/app/context/feature_bridge";
import { GatedRemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/gated_remote_favorite_actions";
import { MemoryClient } from "@/adapters/memory/client/client";
import { MemoryHostPage } from "@/adapters/memory/ports/host_page/host_page";
import { MemoryLocalFavorites } from "@/adapters/memory/ports/local_favorites/local_favorites";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { MemoryLocalPosts } from "@/adapters/memory/ports/local_posts/local_posts";
import { MemoryLocalTagCategories } from "@/adapters/memory/ports/local_tag_categories/local_tag_categories";
import { MemoryNavigator } from "@/adapters/memory/ports/navigator/navigator";
import { MemoryRandomSource } from "@/adapters/memory/ports/random_source/random_source";
import { MemoryRemoteFavoriteActions } from "@/adapters/memory/ports/remote_favorite_actions/remote_favorite_actions";
import { MemoryRemoteFavorites } from "@/adapters/memory/ports/remote_favorites/remote_favorites";
import { MemoryRemoteMedia } from "@/adapters/memory/ports/remote_media/remote_media";
import { MemoryRemotePages } from "@/adapters/memory/ports/remote_pages/remote_pages";
import { MemoryRemotePosts } from "@/adapters/memory/ports/remote_posts/remote_posts";
import { MemoryRemoteSearchResults } from "@/adapters/memory/ports/remote_search_results/remote_search_results";
import { MemoryRemoteTagCategories } from "@/adapters/memory/ports/remote_tag_categories/remote_tag_categories";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { Ports } from "@/core/boundary/ports/ports";
import { Shell } from "@/app/context/shell";
import { createEnvironment } from "@/testing/environment";
import { createEvents } from "@/app/context/events";
import { createMilestones } from "@/app/context/milestones";

const ALL_FEATURES: Feature[] = ["favorites", "postListNavigator", "gallery", "tooltip", "postOverlay"];

interface AppContextOverrides {
  environment?: Partial<Environment>;
  ports?: Partial<Ports>;
  preferences?: PreferenceOverrides;
  features?: Feature[];
  shell?: Shell;
}

export function createAppContext(overrides: AppContextOverrides = {}): AppContext {
  const environment = createEnvironment(overrides.environment);
  const preferences = createPreferences(overrides.preferences);
  const milestones = createMilestones();
  const ports = createPorts(overrides.ports);
  const remoteFavoriteActions = new GatedRemoteFavoriteActions({
    remoteFavoriteActions: ports.remoteFavoriteActions,
    isOpen: (): boolean => !environment.ownsFavorites || milestones.favorites.favoritesLoaded.reached
  });
  return {
    environment,
    ports: { ...ports, remoteFavoriteActions },
    preferences,
    features: new Set(overrides.features ?? ALL_FEATURES),
    events: createEvents(),
    milestones,
    featureBridge: new FeatureBridge(environment),
    domEvents: new DomEvents(),
    shell: overrides.shell ?? createUnavailableShell()
  };
}

function createPorts(overrides: Partial<Ports> = {}): Ports {
  const remote = new MemoryClient([]);
  const scheduler = new MemoryScheduler();
  return {
    remoteFavoriteActions: new MemoryRemoteFavoriteActions(remote),
    remoteFavorites: new MemoryRemoteFavorites(remote),
    remotePosts: new MemoryRemotePosts(remote),
    remoteSearchResults: new MemoryRemoteSearchResults({ pageSize: 42, initialPageIndex: 0 }, remote),
    remoteTagCategories: new MemoryRemoteTagCategories(),
    remoteMedia: new MemoryRemoteMedia(),
    remotePages: new MemoryRemotePages(),
    navigator: new MemoryNavigator(),
    hostPage: new MemoryHostPage(),
    localFavorites: new MemoryLocalFavorites(),
    localKeyedValues: new MemoryLocalKeyedValues(),
    localPosts: new MemoryLocalPosts(),
    localTagCategories: new MemoryLocalTagCategories(),
    randomSource: new MemoryRandomSource(),
    scheduler,
    ...overrides
  };
}

function createUnavailableShell(): Shell {
  return new Proxy({}, {
    get: (_target, property): never => {
      throw new Error(`createAppContext: shell.${String(property)} was accessed; pass a shell override`);
    }
  }) as Shell;
}
