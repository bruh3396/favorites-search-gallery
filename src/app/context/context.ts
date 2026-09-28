import { Events, createEvents } from "@/app/context/events";
import { DomEvents } from "@/app/context/dom_events";
import { Environment } from "@/core/boundary/environment";
import { FeatureBridge } from "@/app/context/feature_bridge";
import { Features } from "@/core/context/features";
import { Ports } from "@/core/boundary/ports/ports";
import { Preferences } from "@/app/context/preferences";
import { Shell } from "@/app/context/shell";

export interface AppContext {
  environment: Environment;
  ports: Ports;
  preferences: Preferences;
  features: Features;
  events: Events;
  featureBridge: FeatureBridge;
  domEvents: DomEvents;
  shell: Shell;
}

export function createAppContext(environment: Environment, ports: Ports, preferences: Preferences, features: Features): AppContext {
  const events = createEvents();
  const featureBridge = new FeatureBridge(environment);
  const domEvents = new DomEvents();
  const shell = new Shell(environment);
  return { environment, ports, preferences, features, events, featureBridge, domEvents, shell };
}
