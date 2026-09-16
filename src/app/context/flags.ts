import { Environment } from "@/app/context/environment";
import { PerformanceProfile } from "@/types/app";
import { Preferences } from "@/app/context/preferences";

export class Flags {
  public readonly performanceProfile: PerformanceProfile;
  public readonly imagusSupportEnabled: boolean;
  public readonly favoritesSearchGalleryEnabled: boolean;
  public readonly favoritesSearchGalleryDisabled: boolean;
  public readonly galleryEnabled: boolean;
  public readonly galleryDisabled: boolean;
  public readonly tooltipEnabled: boolean;
  public readonly tooltipDisabled: boolean;
  public readonly postOverlayEnabled: boolean;
  public readonly postOverlayDisabled: boolean;

  constructor(environment: Environment, preferences: Preferences) {
    const { onFavoritesPage, onPostListPage, onDesktopDevice } = environment;
    const performanceProfile = preferences.app.performanceProfile.value;

    this.performanceProfile = performanceProfile;
    this.imagusSupportEnabled = performanceProfile === "low" || performanceProfile === "potato";

    this.favoritesSearchGalleryEnabled = onFavoritesPage || (onPostListPage && preferences.postList.enabled.value);
    this.favoritesSearchGalleryDisabled = !this.favoritesSearchGalleryEnabled;

    this.galleryEnabled = (onFavoritesPage || onPostListPage) && (performanceProfile === "normal" || performanceProfile === "medium");
    this.galleryDisabled = !this.galleryEnabled;

    this.tooltipEnabled = (onFavoritesPage || onPostListPage) && onDesktopDevice && performanceProfile !== "potato";
    this.tooltipDisabled = !this.tooltipEnabled;

    this.postOverlayEnabled = onFavoritesPage && onDesktopDevice && performanceProfile !== "potato";
    this.postOverlayDisabled = !this.postOverlayEnabled;
  }
}
