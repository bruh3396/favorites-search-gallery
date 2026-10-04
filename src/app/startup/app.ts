import { AppMode, Device, Environment } from "@/core/boundary/environment";
import { Preferences, createPreferences } from "@/app/context/preferences";
import { launchFeatures, selectFeatures } from "@/app/startup/features";
import { HostPage } from "@/core/boundary/ports/host_page/host_page";
import { Ports } from "@/core/boundary/ports/ports";
import { createAppContext } from "@/app/context/context";
import { createLocalKeyedValues } from "@/app/context/local_keyed_values";
import { selectPreferenceDefaults } from "@/app/context/preference_defaults";
import { setupRuntime } from "@/app/startup/runtime";

const RUNS_IN: Record<AppMode, (preferences: Preferences) => boolean> = {
  favorites: () => true,
  postList: (preferences) => preferences.postList.enabled.value
};

const CLAIM_VIEWPORT: Record<Device, (hostPage: HostPage) => void> = {
  desktop: () => { },
  mobile: (hostPage) => hostPage.lockViewport()
};

interface ContentHost {
  claimContent: () => HTMLElement;
}

export function startApp(environment: Environment, targetPorts: Ports, contentHost: ContentHost): boolean {
  const ports: Ports = { ...targetPorts, localKeyedValues: createLocalKeyedValues(targetPorts.localKeyedValues) };
  const preferences = createPreferences(selectPreferenceDefaults(environment), ports.localKeyedValues);

  if (!RUNS_IN[environment.mode](preferences)) {
    return false;
  }
  const features = selectFeatures(environment, preferences.app.performanceProfile.value);
  const context = createAppContext({ environment, features }, { ports, preferences });
  const content = contentHost.claimContent();

  CLAIM_VIEWPORT[environment.device](ports.hostPage);
  setupRuntime(context, content);
  launchFeatures(context);
  return true;
}
