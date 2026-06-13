import { ON_MOBILE_DEVICE } from "@/lib/environment";
import { Preferences } from "@/app/context/preferences";
import { insertStyle } from "@/utils/dom/injector";

export function syncShowOnHoverFromGallery(value: boolean): void {
  const showOnHoverCheckbox = document.getElementById("show-on-hover");

  if (showOnHoverCheckbox !== null && showOnHoverCheckbox instanceof HTMLInputElement) {
    showOnHoverCheckbox.checked = value;
    Preferences.galleryPreviewEnabled.set(value);
  }
}

export function toggleOptionHotkeyHints(value: boolean): void {
  insertStyle(value ? "" : ".u-opt-hint {display:none;}", "opt-hint-visibility");
}

export function toggleFavoritesOptions(value: boolean): void {
  if (ON_MOBILE_DEVICE) {
    document.getElementById("left-favorites-panel-bottom-row")?.classList.toggle("u-hidden", !value);
    insertStyle(`
            #mobile-button-row {
              display: ${value ? "block" : "none"};
            }
            `, "options");
    return;
  }
  insertStyle(`
        .options-container {
          display: ${value ? "block" : "none"};
        }
        `, "options");
}
