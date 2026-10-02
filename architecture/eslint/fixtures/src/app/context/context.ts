import type { Events } from "@/app/context/events";
import type { FeatureBridge } from "@/app/context/feature_bridge";

export const value = 1;

export interface AppContext {
  events: Events;
  bridge: FeatureBridge;
}
