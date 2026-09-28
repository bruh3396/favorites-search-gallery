import { AppMode, Device, Environment } from "@/core/boundary/environment";
import { Preferences, createPreferences } from "@/app/context/preferences";
import { launchFeatures, selectFeatures } from "@/app/startup/features";
import { Host } from "@/core/boundary/ports/host";
import { Ports } from "@/core/boundary/ports/ports";
import { createAppContext } from "@/app/context/context";
import { setupRuntime } from "@/app/startup/runtime";

const RUNS_IN: Record<AppMode, (preferences: Preferences) => boolean> = {
  favorites: () => true,
  posts: (preferences) => preferences.postList.enabled.value
};

const CLAIM_VIEWPORT: Record<Device, (host: Host) => void> = {
  desktop: () => { },
  mobile: (host) => host.lockViewport()
};

export function startApp(environment: Environment, ports: Ports, root: HTMLElement): boolean {
  const preferences = createPreferences(environment, ports.keyValueStore);

  if (!RUNS_IN[environment.mode](preferences)) {
    return false;
  }
  const features = selectFeatures(environment, preferences.app.performanceProfile.value);
  const context = createAppContext(environment, ports, preferences, features);

  ports.host.takeOver();
  CLAIM_VIEWPORT[environment.device](ports.host);
  setupRuntime(context, root);
  launchFeatures(context);
  return true;
}
