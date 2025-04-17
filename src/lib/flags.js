import {isUserIsOnTheirOwnFavoritesPage} from "../utils/metadata";

export const onSearchPage = location.href.includes("page=post&s=list");
export const onFavoritesPage = location.href.includes("page=favorites");
export const onPostPage = location.href.includes("page=post&s=view");
export const usingFirefox = navigator.userAgent.toLowerCase().includes("firefox");
export const onMobileDevice = (/iPhone|iPad|iPod|Android/i).test(navigator.userAgent);
export const onDesktopDevice = !onMobileDevice;
export const userIsOnTheirOwnFavoritesPage = isUserIsOnTheirOwnFavoritesPage();

export const galleryDisabled = (onMobileDevice && onSearchPage) || Preferences.performanceProfile.value > 0 || Flags.onPostPage;
export const tooltipDisabled = Flags.onMobileDevice || Preferences.performanceProfile.value > 1 || Flags.onPostPage;
export const favoritesSearchGalleryEnabled = Flags.onFavoritesPage || (Flags.onSearchPage && Preferences.enableOnSearchPages.value);
export const tagModifierDisabled = Flags.onMobileDevice || !Flags.onFavoritesPage;
export const savedSearchesDisabled = !Flags.onFavoritesPage || Flags.onMobileDevice;
export const captionsDisabled = !Flags.onFavoritesPage || Flags.onMobileDevice || Preferences.performanceProfile.value > 1;
export const awesompleteDisabled = !Flags.onFavoritesPage;

export const favoritesSearchGalleryDisabled = !Flags.favoritesSearchGalleryEnabled;
export const galleryEnabled = !Flags.galleryDisabled;
export const tooltipEnabled = !Flags.tooltipDisabled;
export const captionsEnabled = !Flags.captionsDisabled;
