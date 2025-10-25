import { GALLERY_DISABLED } from "../../../lib/global/flags/derived_flags";
import { ON_MOBILE_DEVICE } from "../../../lib/global/flags/intrinsic_flags";
import { PerformanceProfile } from "../../../types/common_types";
import { Preferences } from "../../../lib/global/preferences/preferences";
import { insertStyleHTML } from "../../../utils/dom/style";

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

  if (Preferences.performanceProfile.value !== PerformanceProfile.NORMAL) {
    hiddenSelectors.add("#search-page-upscale-thumbs");
  }

  if (hiddenSelectors.size > 0) {
    insertStyleHTML(`
      ${[...hiddenSelectors].join(",\n")} {
        display: none !important;
      }
    `);
  }
}
