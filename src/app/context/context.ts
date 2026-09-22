import { Environment, readEnvironment } from "@/app/context/environment";
import { Events, buildEvents } from "@/app/context/events";
import { Flags, buildFlags } from "@/app/context/flags";
import { Preferences, buildPreferences } from "@/app/context/preferences";
import { DomEvents } from "@/app/context/dom_events";
import { FeatureBridge } from "@/app/context/feature_bridge";
import { Shell } from "@/app/context/shell";

export interface AppContext {
  environment: Environment;
  preferences: Preferences;
  flags: Flags;
  events: Events;
  featureBridge: FeatureBridge;
  domEvents: DomEvents;
  shell: Shell;
}

export function createAppContext(): AppContext {
  const environment = readEnvironment();
  const preferences = buildPreferences(environment);
  const flags = buildFlags(environment, preferences);
  const events = buildEvents();
  const featureBridge = new FeatureBridge(environment);
  const domEvents = new DomEvents();
  const shell = new Shell(environment);
  return { environment, preferences, flags, events, featureBridge, domEvents, shell };
}
