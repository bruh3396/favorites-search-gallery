import { ON_MOBILE_DEVICE } from "../../../lib/global/flags/intrinsic_flags";
import { Preferences } from "../../../lib/global/preferences/preferences";
import { insertStyleHTML } from "../../../utils/dom/style";

export function updateShowOnHoverOptionTriggeredFromGallery(value: boolean): void {
  const showOnHoverCheckbox = document.getElementById("show-on-hover");

  if (showOnHoverCheckbox !== null && showOnHoverCheckbox instanceof HTMLInputElement) {
    showOnHoverCheckbox.checked = value;
    Preferences.showOnHoverEnabled.set(value);
  }
}

export function toggleOptionHotkeyHints(value: boolean): void {
  insertStyleHTML(value ? "" : ".option-hint {display:none;}", "option-hint-visibility");
}

export function toggleUI(value: boolean): void {
  const menu = document.getElementById("favorites-search-gallery-menu");
  const panels = document.getElementById("favorites-search-gallery-menu-panels");
  const header = document.getElementById("header");
  const container = document.getElementById("show-ui-container");
  const bottomPanel3 = document.getElementById("bottom-panel-3");

  if (menu === null || panels === null || container === null || bottomPanel3 === null) {
    return;
  }

  if (value) {
    if (header !== null) {
      header.style.display = "";
    }
    bottomPanel3.insertAdjacentElement("afterbegin", container);
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
    insertStyleHTML(`
            #mobile-button-row {
              display: ${value ? "block" : "none"};
            }
            `, "options");
    return;
  }
  insertStyleHTML(`
        .options-container {
          display: ${value ? "block" : "none"};
        }
        `, "options");
}
