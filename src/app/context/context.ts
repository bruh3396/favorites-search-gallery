import { Events, createEvents } from "@/app/context/events";
import { Milestones, createMilestones } from "@/app/context/milestones";
import { DomEvents } from "@/app/context/dom_events";
import { Environment } from "@/core/boundary/environment";
import { FeatureBridge } from "@/app/context/feature_bridge";
import { Features } from "@/core/context/features";
import { GatedRemoteFavoriteActions } from "@/core/boundary/ports/remote_favorite_actions/gated_remote_favorite_actions";
import { Ports } from "@/core/boundary/ports/ports";
import { Preferences } from "@/app/context/preferences";
import { Shell } from "@/app/context/shell";

export interface AppContext {
  environment: Environment;
  ports: Ports;
  preferences: Preferences;
  features: Features;
  events: Events;
  milestones: Milestones;
  featureBridge: FeatureBridge;
  domEvents: DomEvents;
  shell: Shell;
}

export interface AppContextConfiguration {
  environment: Environment;
  features: Features;
}

export interface AppContextDependencies {
  ports: Ports;
  preferences: Preferences;
}

export function createAppContext(
  { environment, features }: AppContextConfiguration,
  { ports, preferences }: AppContextDependencies
): AppContext {
  const events = createEvents();
  const milestones = createMilestones();
  const featureBridge = new FeatureBridge(environment);
  const domEvents = new DomEvents();
  const shell = new Shell();
  const remoteFavoriteActions = new GatedRemoteFavoriteActions({
    remoteFavoriteActions: ports.remoteFavoriteActions,
    isOpen: (): boolean => !environment.ownsFavorites || milestones.favorites.favoritesLoaded.reached
  });
  return { environment, ports: { ...ports, remoteFavoriteActions }, preferences, features, events, milestones, featureBridge, domEvents, shell };
}
