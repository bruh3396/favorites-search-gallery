import { ON_DESKTOP_DEVICE, ON_FAVORITES_PAGE, ON_SEARCH_PAGE } from "./intrinsic_flags";
import { PerformanceProfile } from "../../../types/primitives/enums";
import { Preferences } from "../preferences/preferences";

export const FAVORITES_SEARCH_GALLERY_ENABLED = ON_FAVORITES_PAGE || (ON_SEARCH_PAGE && Preferences.searchPagesEnabled.value);
export const FAVORITES_SEARCH_GALLERY_DISABLED = !FAVORITES_SEARCH_GALLERY_ENABLED;

export const GALLERY_ENABLED = (ON_FAVORITES_PAGE || ON_SEARCH_PAGE) && (Preferences.performanceProfile.value === PerformanceProfile.NORMAL || Preferences.performanceProfile.value === PerformanceProfile.MEDIUM);
export const GALLERY_DISABLED = !GALLERY_ENABLED;

export const TOOLTIP_ENABLED = (ON_FAVORITES_PAGE || ON_SEARCH_PAGE) && ON_DESKTOP_DEVICE && Preferences.performanceProfile.value !== PerformanceProfile.POTATO;
export const TOOLTIP_DISABLED = !TOOLTIP_ENABLED;

export const TAG_MODIFIER_ENABLED = ON_FAVORITES_PAGE && ON_DESKTOP_DEVICE;
export const TAG_MODIFIER_DISABLED = !TAG_MODIFIER_ENABLED;

export const CAPTIONS_ENABLED = ON_FAVORITES_PAGE && ON_DESKTOP_DEVICE && Preferences.performanceProfile.value !== PerformanceProfile.POTATO;
export const CAPTIONS_DISABLED = !CAPTIONS_ENABLED;

export const SAVED_SEARCHES_ENABLED = ON_FAVORITES_PAGE && ON_DESKTOP_DEVICE;
export const SAVED_SEARCHES_DISABLED = !SAVED_SEARCHES_ENABLED;

export const AWESOMPLETE_ENABLED = ON_FAVORITES_PAGE;
export const AWESOMPLETE_DISABLED = !AWESOMPLETE_ENABLED;
