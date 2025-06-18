import { PerformanceProfile } from "../../types/primitives/enums";
import { Preferences } from "../../store/local_storage/preferences";
import { isUserIsOnTheirOwnFavoritesPage } from "../../utils/misc/favorites_page_metadata";

export const ON_SEARCH_PAGE = location.href.includes("page=post&s=list");
export const ON_FAVORITES_PAGE = location.href.includes("page=favorites");
export const ON_POST_PAGE = location.href.includes("page=post&s=view");
export const USING_FIREFOX = navigator.userAgent.toLowerCase().includes("firefox");
export const ON_MOBILE_DEVICE = (/iPhone|iPad|iPod|Android/i).test(navigator.userAgent);
export const ON_DESKTOP_DEVICE = !ON_MOBILE_DEVICE;
export const USER_IS_ON_THEIR_OWN_FAVORITES_PAGE = isUserIsOnTheirOwnFavoritesPage();

export const GALLERY_DISABLED = (ON_MOBILE_DEVICE && ON_SEARCH_PAGE) || ON_POST_PAGE || Preferences.performanceProfile.value !== PerformanceProfile.HIGH;
export const TOOLTIP_DISABLED = ON_MOBILE_DEVICE || Preferences.performanceProfile.value === PerformanceProfile.LOW || ON_POST_PAGE;
export const FAVORITES_SEARCH_GALLERY_ENABLED = ON_FAVORITES_PAGE || (ON_SEARCH_PAGE && Preferences.searchPagesEnabled.value && !ON_MOBILE_DEVICE);
export const TAG_MODIFIER_DISABLED = ON_MOBILE_DEVICE || !ON_FAVORITES_PAGE;
export const SAVED_SEARCHES_DISABLED = !ON_FAVORITES_PAGE || ON_MOBILE_DEVICE;
export const CAPTIONS_DISABLED = !ON_FAVORITES_PAGE || ON_MOBILE_DEVICE || Preferences.performanceProfile.value === PerformanceProfile.LOW;
export const AWESOMPLETE_ENABLED = ON_FAVORITES_PAGE;

export const GALLERY_ENABLED = !GALLERY_DISABLED;
export const FAVORITES_SEARCH_GALLERY_DISABLED = !FAVORITES_SEARCH_GALLERY_ENABLED;
export const TOOLTIP_ENABLED = !TOOLTIP_DISABLED;
export const CAPTIONS_ENABLED = !CAPTIONS_DISABLED;
