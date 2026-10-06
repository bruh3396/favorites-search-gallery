import { AppMode, Device, Environment } from "@/core/boundary/environment";
import { Feature, Features } from "@/app/context/features";
import { PERFORMANCE_PROFILES, PerformanceProfile } from "@/types/app";
import { AppContext } from "@/app/context/context";
import { startFavorites } from "@/features/favorites/favorites";
import { startGallery } from "@/features/gallery/gallery";
import { startPostListNavigator } from "@/features/post_list_navigator/post_list_navigator";
import { startPostOverlay } from "@/features/post_overlay/post_overlay";
import { startTooltip } from "@/features/tooltip/tooltip";

interface FeatureEntry {
  start: (context: AppContext) => unknown;
  modes: readonly AppMode[];
  devices: readonly Device[];
  profiles: readonly PerformanceProfile[];
}

interface Runtime {
  mode: AppMode;
  device: Device;
  profile: PerformanceProfile;
}

const ALL_MODES: readonly AppMode[] = ["favorites", "postList"];
const ALL_DEVICES: readonly Device[] = ["desktop", "mobile"];

const FEATURES: Record<Feature, FeatureEntry> = {
  favorites: { start: startFavorites, modes: ALL_MODES, devices: ALL_DEVICES, profiles: PERFORMANCE_PROFILES },
  postListNavigator: { start: startPostListNavigator, modes: ["postList"], devices: ALL_DEVICES, profiles: PERFORMANCE_PROFILES },
  gallery: { start: startGallery, modes: ALL_MODES, devices: ALL_DEVICES, profiles: ["normal"] },
  tooltip: { start: startTooltip, modes: ALL_MODES, devices: ["desktop"], profiles: ["normal", "low"] },
  postOverlay: { start: startPostOverlay, modes: ["favorites"], devices: ["desktop"], profiles: ["normal", "low"] }
};

export function selectFeatures({ mode, device }: Environment, profile: PerformanceProfile): Features {
  const features = Object.keys(FEATURES) as Feature[];
  return new Set(features.filter(feature => runsIn(FEATURES[feature], { mode, device, profile })));
}

export function launchFeatures(context: AppContext): void {
  for (const feature of context.features) {
    FEATURES[feature].start(context);
  }
}

function runsIn(entry: FeatureEntry, { mode, device, profile }: Runtime): boolean {
  return entry.modes.includes(mode) && entry.devices.includes(device) && entry.profiles.includes(profile);
}
