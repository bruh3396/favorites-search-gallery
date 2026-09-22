import { Environment } from "@/app/context/environment";
import { Preferences } from "@/app/context/preferences";

export type Flags = ReturnType<typeof buildFlags>;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types
export function buildFlags(environment: Environment, preferences: Preferences) {
  const { onFavoritesPage, onPostListPage, onDesktopDevice } = environment;
  const performanceProfile = preferences.app.performanceProfile.value;
  const isFavoritesSearchGalleryEnabled = onFavoritesPage || (onPostListPage && preferences.postList.enabled.value);
  const isGalleryEnabled = (onFavoritesPage || onPostListPage) && performanceProfile === "normal";
  const isTooltipEnabled = (onFavoritesPage || onPostListPage) && onDesktopDevice && performanceProfile !== "potato";
  const isPostOverlayEnabled = onFavoritesPage && onDesktopDevice && performanceProfile !== "potato";
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
