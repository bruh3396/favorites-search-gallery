import { Environment, readEnvironment } from "@/app/context/environment";
import { DomEvents } from "@/app/context/dom_events";
import { Events } from "@/app/context/events";
import { FeatureBridge } from "@/app/context/feature_bridge";
import { Flags } from "@/app/context/flags";
import { Preferences } from "@/app/context/preferences";
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
  const preferences = new Preferences(environment);
  const flags = new Flags(environment, preferences);
  const events = new Events();
  const featureBridge = new FeatureBridge(environment);
  const domEvents = new DomEvents();
  const shell = new Shell(environment);
  return { environment, preferences, flags, events, featureBridge, domEvents, shell };
}
