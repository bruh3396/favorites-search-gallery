import { GALLERY_DISABLED, PERFORMANCE_PROFILE } from "../../../lib/environment/derived_environment";
import { ON_MOBILE_DEVICE } from "../../../lib/environment/environment";
import { PerformanceProfile } from "../../../types/common_types";
import { insertStyle } from "../../../utils/dom/injector";

export function styleSearchPageMenu(): void {
  const hiddenSelectors = new Set<string>();

  if (GALLERY_DISABLED) {
    hiddenSelectors.add("#search-page-upscale-thumbs");
    hiddenSelectors.add("#search-page-autoplay");
  }

  if (ON_MOBILE_DEVICE) {
    hiddenSelectors.add("#search-page-upscale-thumbs");
    hiddenSelectors.add("#search-page-performance-profile");
    hiddenSelectors.add("#search-page-autoplay");
    hiddenSelectors.add(".utility-button");
    hiddenSelectors.add("#search-page-add-favorite-buttons");
    hiddenSelectors.add("#search-page-gallery-menu");
  }

  if (PERFORMANCE_PROFILE !== PerformanceProfile.NORMAL) {
    hiddenSelectors.add("#search-page-upscale-thumbs");
  }

  if (hiddenSelectors.size > 0) {
    insertStyle(`
      ${[...hiddenSelectors].join(",\n")} {
        display: none !important;
      }
    `);
  }
}
