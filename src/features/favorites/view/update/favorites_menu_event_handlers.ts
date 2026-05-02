import { Events } from "../../../../lib/communication/events";
import { ON_MOBILE_DEVICE } from "../../../../lib/environment/environment";
import { Preferences } from "../../../../lib/preferences/preferences";
import { Storage } from "../../../../lib/core/storage/storage_instance";
import { insertStyle } from "../../../../utils/dom/injector";

export function syncShowOnHoverFromGallery(value: boolean): void {
  const showOnHoverCheckbox = document.getElementById("show-on-hover");

  if (showOnHoverCheckbox !== null && showOnHoverCheckbox instanceof HTMLInputElement) {
    showOnHoverCheckbox.checked = value;
    Preferences.showOnHover.set(value);
  }
}

export function toggleOptionHotkeyHints(value: boolean): void {
  insertStyle(value ? "" : ".option-hint {display:none;}", "option-hint-visibility");
}

export function toggleUI(value: boolean): void {
  const menu = document.getElementById("favorites-search-gallery-menu");
  const panels = document.getElementById("favorites-search-gallery-menu-panels");
  const header = document.getElementById("header");
  const container = document.getElementById("show-ui-container");
  const bottomPanel4 = document.getElementById("bottom-panel-4");

  if (menu === null || panels === null || container === null || bottomPanel4 === null) {
    return;
  }

  if (value) {
    if (header !== null) {
      header.style.display = "";
    }
    bottomPanel4.insertAdjacentElement("afterbegin", container);
    panels.style.display = "flex";
    menu.removeAttribute("style");
  } else {
    menu.appendChild(container);

    if (header !== null) {
      header.style.display = "none";
    }
    panels.style.display = "none";
    menu.style.background = getComputedStyle(document.body).background;
  }
  container.classList.toggle("ui-hidden", !value);
}

export function toggleFavoritesOptions(value: boolean): void {
  if (ON_MOBILE_DEVICE) {
    document.getElementById("left-favorites-panel-bottom-row")?.classList.toggle("hidden", !value);
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

const DESKTOP_RESET_PROMPT_SUFFIX = "\nTag modifications and saved searches will be preserved.";
const RESET_PROMPT = `Are you sure you want to reset? This will delete all cached favorites, and preferences.${ON_MOBILE_DEVICE ? "" : DESKTOP_RESET_PROMPT_SUFFIX}`;
const persistentLocalStorageKeys = new Set(["customTags", "savedSearches"]);

function clearLocalStorage(): void {
  Storage.keys()
    .filter(key => !persistentLocalStorageKeys.has(key))
    .forEach(key => Storage.remove(key));
}

export function tryResetting(): void {
  if (confirm(RESET_PROMPT)) {
    clearLocalStorage();
    Events.favorites.resetConfirmed.emit();
  }
}
