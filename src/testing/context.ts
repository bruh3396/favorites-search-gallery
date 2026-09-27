import { PreferenceOverrides, createPreferences } from "@/testing/preferences";
import { AppContext } from "@/app/context/context";
import { DomEvents } from "@/app/context/dom_events";
import { Environment } from "@/app/context/environment";
import { FeatureBridge } from "@/app/context/feature_bridge";
import { Shell } from "@/app/context/shell";
import { createEnvironment } from "@/testing/environment";
import { createEvents } from "@/app/context/events";
import { createFlags } from "@/app/context/flags";

interface AppContextOverrides {
  environment?: Partial<Environment>;
  preferences?: PreferenceOverrides;
  shell?: Shell;
}

export function createAppContext(overrides: AppContextOverrides = {}): AppContext {
  const environment = createEnvironment(overrides.environment);
  const preferences = createPreferences(overrides.preferences);
  return {
    environment,
    preferences,
    flags: createFlags(environment, preferences),
    events: createEvents(),
    featureBridge: new FeatureBridge(environment),
    domEvents: new DomEvents(),
    shell: overrides.shell ?? createUnavailableShell()
  };
}

function createUnavailableShell(): Shell {
  return new Proxy({}, {
    get: (_target, property): never => {
      throw new Error(`createAppContext: shell.${String(property)} was accessed; pass a shell override`);
    }
  }) as Shell;
}
