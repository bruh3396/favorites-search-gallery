import { ON_FAVORITES_PAGE, ON_MOBILE_DEVICE, ON_POST_PAGE, ON_SEARCH_PAGE } from "./intrinsic_flags";
import { PerformanceProfile } from "../../../types/primitives/enums";
import { Preferences } from "../preferences/preferences";

export const GALLERY_DISABLED = ON_POST_PAGE || Preferences.performanceProfile.value !== PerformanceProfile.HIGH;
export const TOOLTIP_DISABLED = ON_MOBILE_DEVICE || Preferences.performanceProfile.value === PerformanceProfile.LOW || ON_POST_PAGE;
export const FAVORITES_SEARCH_GALLERY_ENABLED = ON_FAVORITES_PAGE || (ON_SEARCH_PAGE && Preferences.searchPagesEnabled.value);
export const TAG_MODIFIER_DISABLED = ON_MOBILE_DEVICE || !ON_FAVORITES_PAGE;
export const TAG_MODIFIER_ENABLED = !TAG_MODIFIER_DISABLED;
export const SAVED_SEARCHES_DISABLED = !ON_FAVORITES_PAGE || ON_MOBILE_DEVICE;
export const CAPTIONS_DISABLED = !ON_FAVORITES_PAGE || ON_MOBILE_DEVICE || Preferences.performanceProfile.value === PerformanceProfile.LOW;
export const AWESOMPLETE_ENABLED = ON_FAVORITES_PAGE;
export const GALLERY_ENABLED = !GALLERY_DISABLED;
export const FAVORITES_SEARCH_GALLERY_DISABLED = !FAVORITES_SEARCH_GALLERY_ENABLED;
export const TOOLTIP_ENABLED = !TOOLTIP_DISABLED;
export const CAPTIONS_ENABLED = !CAPTIONS_DISABLED;
