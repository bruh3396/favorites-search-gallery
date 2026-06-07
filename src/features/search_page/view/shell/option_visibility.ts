import { GALLERY_DISABLED, PERFORMANCE_PROFILE } from "@/app/context/flags";
import { ON_MOBILE_DEVICE } from "@/lib/environment";
import { Preferences } from "@/app/context/preferences";
import { insertStyle } from "@/utils/dom/injector";

export function hideUnusedOptions(): void {
  const hiddenSelectors = new Set<string>();

  if (GALLERY_DISABLED) {
    hiddenSelectors.add("#search-page-upscale-thumbs");
    hiddenSelectors.add("#search-page-autoplay");
  }

  if (ON_MOBILE_DEVICE) {
    hiddenSelectors.add("#search-page-upscale-thumbs");
    hiddenSelectors.add("#search-page-performance-profile");
    hiddenSelectors.add("#search-page-autoplay");
    hiddenSelectors.add(".post-action-btn");
    hiddenSelectors.add("#search-page-add-favorite-buttons");
    hiddenSelectors.add("#search-page-gallery-menu");
  }

  if (PERFORMANCE_PROFILE !== "normal") {
    hiddenSelectors.add("#search-page-upscale-thumbs");
  }

  if (PERFORMANCE_PROFILE === "potato") {
    hiddenSelectors.add("#search-page-tooltip");
  }

  if (!Preferences.searchPageFavoriteIndicator.value) {
    for (const id of ["search-page-favorite-indicator-style", "search-page-gallery-favorite-style"]) {
      document.getElementById(id)?.style.setProperty("display", "none");
    }
  }

  if (hiddenSelectors.size > 0) {
    insertStyle(`
      ${[...hiddenSelectors].join(",\n")} {
        display: none !important;
      }
    `);
  }
}
