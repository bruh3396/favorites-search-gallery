import { Environment } from "@/core/boundary/environment";
import { Preferences } from "@/app/context/preferences";

export type Flags = ReturnType<typeof createFlags>;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types
export function createFlags(environment: Environment, preferences: Preferences) {
  const inFavoritesMode = environment.mode === "favorites";
  const onDesktopDevice = environment.device === "desktop";
  const performanceProfile = preferences.app.performanceProfile.value;
  const isFavoritesSearchGalleryEnabled = inFavoritesMode || preferences.postList.enabled.value;
  const isGalleryEnabled = performanceProfile === "normal";
  const isTooltipEnabled = onDesktopDevice && performanceProfile !== "potato";
  const isPostOverlayEnabled = inFavoritesMode && onDesktopDevice && performanceProfile !== "potato";
  return {
    performanceProfile,
    imagusSupportEnabled: performanceProfile === "low" || performanceProfile === "potato",

    favoritesSearchGalleryEnabled: isFavoritesSearchGalleryEnabled,
    favoritesSearchGalleryDisabled: !isFavoritesSearchGalleryEnabled,

    galleryEnabled: isGalleryEnabled,
    galleryDisabled: !isGalleryEnabled,

    tooltipEnabled: isTooltipEnabled,
    tooltipDisabled: !isTooltipEnabled,

    postOverlayEnabled: isPostOverlayEnabled,
    postOverlayDisabled: !isPostOverlayEnabled
  };
}
