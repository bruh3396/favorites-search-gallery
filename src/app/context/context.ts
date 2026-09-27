import { Environment, readEnvironment } from "@/app/context/environment";
import { Events, createEvents } from "@/app/context/events";
import { Flags, createFlags } from "@/app/context/flags";
import { Preferences, createPreferences } from "@/app/context/preferences";
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
  const preferences = createPreferences(environment);
  const flags = createFlags(environment, preferences);
  const events = createEvents();
  const featureBridge = new FeatureBridge(environment);
  const domEvents = new DomEvents();
  const shell = new Shell(environment);
  return { environment, preferences, flags, events, featureBridge, domEvents, shell };
}
