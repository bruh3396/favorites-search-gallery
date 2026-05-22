import { ON_MOBILE_DEVICE } from "../../../../lib/environment/environment";
import { Preferences } from "../../../../app/state/preferences";
import { insertStyle } from "../../../../lib/dom/injector";

export function syncShowOnHoverFromGallery(value: boolean): void {
  const showOnHoverCheckbox = document.getElementById("show-on-hover");

  if (showOnHoverCheckbox !== null && showOnHoverCheckbox instanceof HTMLInputElement) {
    showOnHoverCheckbox.checked = value;
    Preferences.showOnHover.set(value);
  }
}

export function toggleOptionHotkeyHints(value: boolean): void {
  insertStyle(value ? "" : ".u-opt-hint {display:none;}", "opt-hint-visibility");
}

export function toggleUi(value: boolean): void {
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
  container.classList.toggle("favorites-menu-show-ui--collapsed", !value);
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
