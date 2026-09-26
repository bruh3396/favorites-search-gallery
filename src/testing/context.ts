import { PreferenceOverrides, createPreferences } from "@/testing/preferences";
import { AppContext } from "@/app/context/context";
import { DomEvents } from "@/app/context/dom_events";
import { Environment } from "@/app/context/environment";
import { FeatureBridge } from "@/app/context/feature_bridge";
import { Shell } from "@/app/context/shell";
import { buildEvents } from "@/app/context/events";
import { buildFlags } from "@/app/context/flags";
import { createEnvironment } from "@/testing/environment";

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
    flags: buildFlags(environment, preferences),
    events: buildEvents(),
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
