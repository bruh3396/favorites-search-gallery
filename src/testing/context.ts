import { PreferenceOverrides, createPreferences } from "@/testing/preferences";
import { AppContext } from "@/app/context/context";
import { DomEvents } from "@/app/context/dom_events";
import { Environment } from "@/core/boundary/environment";
import { Feature } from "@/core/context/features";
import { FeatureBridge } from "@/app/context/feature_bridge";
import { MemoryClient } from "@/adapters/memory/client/client";
import { MemoryHostPage } from "@/adapters/memory/ports/host_page/host_page";
import { MemoryLocalFavorites } from "@/adapters/memory/ports/local_favorites/local_favorites";
import { MemoryLocalKeyedValues } from "@/adapters/memory/ports/local_keyed_values/local_keyed_values";
import { MemoryLocalPosts } from "@/adapters/memory/ports/local_posts/local_posts";
import { MemoryLocalTagCategories } from "@/adapters/memory/ports/local_tag_categories/local_tag_categories";
import { MemoryNavigation } from "@/adapters/memory/ports/navigation/navigation";
import { MemoryRemoteFavorites } from "@/adapters/memory/ports/remote_favorites/remote_favorites";
import { MemoryRemoteMedia } from "@/adapters/memory/ports/remote_media/remote_media";
import { MemoryRemotePosts } from "@/adapters/memory/ports/remote_posts/remote_posts";
import { MemoryRemoteTagCategories } from "@/adapters/memory/ports/remote_tag_categories/remote_tag_categories";
import { MemoryScheduler } from "@/adapters/memory/ports/scheduler/scheduler";
import { Ports } from "@/core/boundary/ports/ports";
import { Shell } from "@/app/context/shell";
import { createEnvironment } from "@/testing/environment";
import { createEvents } from "@/app/context/events";

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
  return {
    environment,
    ports: createPorts(overrides.ports),
    preferences,
    features: new Set(overrides.features ?? ALL_FEATURES),
    events: createEvents(),
    featureBridge: new FeatureBridge(environment),
    domEvents: new DomEvents(),
    shell: overrides.shell ?? createUnavailableShell()
  };
}

function createPorts(overrides: Partial<Ports> = {}): Ports {
  const remote = new MemoryClient([]);
  const scheduler = new MemoryScheduler();
  return {
    remoteFavorites: new MemoryRemoteFavorites(remote),
    remotePosts: new MemoryRemotePosts(remote),
    remoteTagCategories: new MemoryRemoteTagCategories(),
    remoteMedia: new MemoryRemoteMedia(),
    navigation: new MemoryNavigation(),
    hostPage: new MemoryHostPage(),
    localFavorites: new MemoryLocalFavorites(),
    localKeyedValues: new MemoryLocalKeyedValues(),
    localPosts: new MemoryLocalPosts(),
    localTagCategories: new MemoryLocalTagCategories(),
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
