import { GALLERY_DISABLED, PERFORMANCE_PROFILE } from "@/app/context/flags";
import { ON_MOBILE_DEVICE } from "@/lib/environment";
import { Preferences } from "@/app/context/preferences";
import { insertStyle } from "@/utils/dom/injector";

export function hideUnusedOptions(): void {
  const hiddenSelectors = new Set<string>();

  if (GALLERY_DISABLED) {
    hiddenSelectors.add("#post-list-upscale-thumbs");
    hiddenSelectors.add("#post-list-autoplay");
  }

  if (ON_MOBILE_DEVICE) {
    hiddenSelectors.add("#post-list-upscale-thumbs");
    hiddenSelectors.add("#post-list-performance-profile");
    hiddenSelectors.add("#post-list-autoplay");
    hiddenSelectors.add("#post-list-gallery-menu");
  }

  if (PERFORMANCE_PROFILE !== "normal") {
    hiddenSelectors.add("#post-list-upscale-thumbs");
  }

  if (PERFORMANCE_PROFILE === "potato") {
    hiddenSelectors.add("#post-list-tooltip");
  }

  if (!Preferences.postListFavoriteIndicator.value) {
    for (const id of ["post-list-favorite-indicator-style", "post-list-gallery-favorite-style"]) {
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
