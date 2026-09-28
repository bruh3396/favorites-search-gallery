import { Events, createEvents } from "@/app/context/events";
import { Flags, createFlags } from "@/app/context/flags";
import { Preferences, createPreferences } from "@/app/context/preferences";
import { DomEvents } from "@/app/context/dom_events";
import { Environment } from "@/core/boundary/environment";
import { FeatureBridge } from "@/app/context/feature_bridge";
import { Ports } from "@/core/boundary/ports";
import { Shell } from "@/app/context/shell";

export interface AppContext {
  environment: Environment;
  ports: Ports;
  preferences: Preferences;
  flags: Flags;
  events: Events;
  featureBridge: FeatureBridge;
  domEvents: DomEvents;
  shell: Shell;
}

export function createAppContext(environment: Environment, ports: Ports): AppContext {
  const preferences = createPreferences(environment);
  const flags = createFlags(environment, preferences);
  const events = createEvents();
  const featureBridge = new FeatureBridge(environment);
  const domEvents = new DomEvents();
  const shell = new Shell(environment);
  return { environment, ports, preferences, flags, events, featureBridge, domEvents, shell };
}
