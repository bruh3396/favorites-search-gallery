import { PreferenceOverrides, createPreferences } from "@/testing/preferences";
import { ApiClient } from "@/adapters/api/client/client";
import { ApiPostSource } from "@/adapters/api/post_source/post_source";
import { Rule34Client } from "@/adapters/rule34/client/client";
import { Rule34PostSource } from "@/adapters/rule34/post_source/post_source";
import { AppContext } from "@/app/context/context";
import { DomEvents } from "@/app/context/dom_events";
import { Environment } from "@/core/boundary/environment";
import { FeatureBridge } from "@/app/context/feature_bridge";
import { MemoryHost } from "@/adapters/memory/host/host";
import { MemoryTagSource } from "@/adapters/memory/tag_source/tag_source";
import { MemoryTelemetry } from "@/adapters/memory/telemetry/telemetry";
import { Ports } from "@/core/boundary/ports";
import { Rule34FavoritesEditor } from "@/adapters/rule34/favorites_editor/favorites_editor";
import { Rule34FavoritesSource } from "@/adapters/rule34/favorites_source/favorites_source";
import { Rule34Navigation } from "@/adapters/rule34/navigation/navigation";
import { Shell } from "@/app/context/shell";
import { createEnvironment } from "@/testing/environment";
import { createEvents } from "@/app/context/events";
import { createFlags } from "@/app/context/flags";

interface AppContextOverrides {
  environment?: Partial<Environment>;
  ports?: Partial<Ports>;
  preferences?: PreferenceOverrides;
  shell?: Shell;
}

export function createAppContext(overrides: AppContextOverrides = {}): AppContext {
  const environment = createEnvironment(overrides.environment);
  const preferences = createPreferences(overrides.preferences);
  return {
    environment,
    ports: createPorts(environment, overrides.ports),
    preferences,
    flags: createFlags(environment, preferences),
    events: createEvents(),
    featureBridge: new FeatureBridge(environment),
    domEvents: new DomEvents(),
    shell: overrides.shell ?? createUnavailableShell()
  };
}

function createPorts(environment: Environment, overrides: Partial<Ports> = {}): Ports {
  const rule34 = new Rule34Client();
  return {
    favoritesSource: new Rule34FavoritesSource(rule34, environment.favoritesId, null, 0),
    favoritesEditor: new Rule34FavoritesEditor(rule34),
    postSource: new ApiPostSource(new ApiClient(), new Rule34PostSource(rule34)),
    tagSource: new MemoryTagSource(),
    navigation: new Rule34Navigation(rule34),
    host: new MemoryHost(),
    telemetry: new MemoryTelemetry(),
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
