import { PreferenceOverrides, createPreferences } from "@/testing/preferences";
import { ApiClient } from "@/adapters/api/client/client";
import { ApiPostSource } from "@/adapters/api/ports/post_source/post_source";
import { Rule34SiteClient } from "@/adapters/rule34/client/site/client";
import { Rule34PostSource } from "@/adapters/rule34/ports/post_source/post_source";
import { AppContext } from "@/app/context/context";
import { DomEvents } from "@/app/context/dom_events";
import { Environment } from "@/core/boundary/environment";
import { Feature } from "@/core/context/features";
import { FeatureBridge } from "@/app/context/feature_bridge";
import { MemoryHost } from "@/adapters/memory/ports/host/host";
import { MemoryMediaSource } from "@/adapters/memory/ports/media_source/media_source";
import { MemoryTagSource } from "@/adapters/memory/ports/tag_source/tag_source";
import { Ports } from "@/core/boundary/ports/ports";
import { Rule34FavoritesEditor } from "@/adapters/rule34/ports/favorites_editor/favorites_editor";
import { Rule34FavoritesSource } from "@/adapters/rule34/ports/favorites_source/favorites_source";
import { Rule34Navigation } from "@/adapters/rule34/ports/navigation/navigation";
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
    favoritesSource: new Rule34FavoritesSource(rule34SiteClient, environment.favoritesId, null, 0),
    favoritesEditor: new Rule34FavoritesEditor(rule34SiteClient),
    postSource: new ApiPostSource(new ApiClient(), new Rule34PostSource(rule34SiteClient)),
    tagSource: new MemoryTagSource(),
    mediaSource: new MemoryMediaSource(),
    navigation: new Rule34Navigation(rule34SiteClient),
    host: new MemoryHost(),
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
