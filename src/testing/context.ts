import { PreferenceOverrides, createPreferences } from "@/testing/preferences";
import { ApiClient } from "@/adapters/api/client/client";
import { ApiRemotePosts } from "@/adapters/api/ports/remote_posts/remote_posts";
import { AppContext } from "@/app/context/context";
import { DomEvents } from "@/app/context/dom_events";
import { Environment } from "@/core/boundary/environment";
import { Feature } from "@/core/context/features";
import { FeatureBridge } from "@/app/context/feature_bridge";
import { MemoryHost } from "@/adapters/memory/ports/host/host";
import { MemoryKeyValueStore } from "@/adapters/memory/ports/key_value_store/key_value_store";
import { MemoryRemoteMedia } from "@/adapters/memory/ports/remote_media/remote_media";
import { MemoryRemoteTagCategories } from "@/adapters/memory/ports/remote_tag_categories/remote_tag_categories";
import { Ports } from "@/core/boundary/ports/ports";
import { Rule34RemoteFavorites } from "@/adapters/rule34/ports/remote_favorites/remote_favorites";
import { Rule34Navigation } from "@/adapters/rule34/ports/navigation/navigation";
import { Rule34RemotePosts } from "@/adapters/rule34/ports/remote_posts/remote_posts";
import { Rule34SiteClient } from "@/adapters/rule34/client/site/client";
import { Shell } from "@/app/context/shell";
import { createEnvironment } from "@/testing/environment";
import { createEvents } from "@/app/context/events";
import { mintMedia } from "@/adapters/rule34/client/media/locator";

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
    ports: createPorts(environment, overrides.ports),
    preferences,
    features: new Set(overrides.features ?? ALL_FEATURES),
    events: createEvents(),
    featureBridge: new FeatureBridge(environment),
    domEvents: new DomEvents(),
    shell: overrides.shell ?? createUnavailableShell()
  };
}

function createPorts(environment: Environment, overrides: Partial<Ports> = {}): Ports {
  const rule34SiteClient = new Rule34SiteClient();
  return {
    remoteFavorites: new Rule34RemoteFavorites(rule34SiteClient, environment.favoritesOwnerId, null, 0),
    remotePosts: new ApiRemotePosts(new ApiClient(), new Rule34RemotePosts(rule34SiteClient), url => mintMedia(url, "")),
    remoteTagCategories: new MemoryRemoteTagCategories(),
    remoteMedia: new MemoryRemoteMedia(),
    navigation: new Rule34Navigation(rule34SiteClient),
    host: new MemoryHost(),
    keyValueStore: new MemoryKeyValueStore(),
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
