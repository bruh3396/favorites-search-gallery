import { AppMode, Environment } from "@/core/boundary/environment";
import { Preferences, createPreferences } from "@/app/context/preferences";
import { launchFeatures, selectFeatures } from "@/app/startup/features";
import { Ports } from "@/core/boundary/ports/ports";
import { createAppContext } from "@/app/context/context";
import { setupRuntime } from "@/app/startup/runtime";

const RUNS_IN: Record<AppMode, (preferences: Preferences) => boolean> = {
  favorites: () => true,
  posts: (preferences) => preferences.postList.enabled.value
};

export function startApp(environment: Environment, ports: Ports): boolean {
  const preferences = createPreferences(environment);

  if (!RUNS_IN[environment.mode](preferences)) {
    return false;
  }
  const features = selectFeatures(environment, preferences.app.performanceProfile.value);
  const context = createAppContext(environment, ports, preferences, features);

  ports.host.takeOver(environment.mode);
  setupRuntime(context);
  launchFeatures(context);
  return true;
}
