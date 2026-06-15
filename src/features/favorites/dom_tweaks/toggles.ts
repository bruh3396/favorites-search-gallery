import { ON_MOBILE_DEVICE } from "@/lib/environment";
import { insertStyle } from "@/utils/dom/injector";

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
