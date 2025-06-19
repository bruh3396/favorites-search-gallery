import { FANCY_HOVERING_HTML } from "../../../assets/html";
import { FavoriteLayout } from "../../../types/primitives/primitives";
import { FavoritesWheelEvent } from "../../../types/events/wheel_event";
import { ON_MOBILE_DEVICE } from "../../../lib/globals/flags";
import { Preferences } from "../../../store/local_storage/preferences";
import { getCurrentLayout } from "../view/favorites_view";
import { insertStyleHTML } from "../../../utils/dom/style";
import { isForwardNavigationKey } from "../../../types/primitives/equivalence";

export function updateShowOnHoverOptionTriggeredFromGallery(value: boolean): void {
  const showOnHoverCheckbox = document.getElementById("show-on-hover");

  if (showOnHoverCheckbox !== null && showOnHoverCheckbox instanceof HTMLInputElement) {
    showOnHoverCheckbox.checked = value;
    Preferences.showOnHoverEnabled.set(value);
  }
}

export function toggleFancyThumbHovering(value: boolean): void {
  insertStyleHTML(value ? FANCY_HOVERING_HTML : "", "fancy-image-hovering");
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

export function toggleAddOrRemoveButtons(value: boolean): void {
  insertStyleHTML(`
        .remove-favorite-button, .add-favorite-button {
          visibility: ${value ? "visible" : "hidden"} !important;
        }
      `, "add-or-remove-button-visibility");
  // forceHideCaptions(value);
}

export function toggleDownloadButtons(value: boolean): void {
  insertStyleHTML(`
        .download-button {
          visibility: ${value ? "visible" : "hidden"} !important;
        }
      `, "download-button-visibility");
  // Utils.forceHideCaptions(value);
}

export function hideUnusedLayoutSizer(layout: FavoriteLayout): void {
  const rowSizeContainer = document.getElementById("row-size-container");
  const columnCountContainer = document.getElementById("column-count-container");
  const usingRowLayout = layout === "row";

  if (columnCountContainer !== null && rowSizeContainer !== null) {
    columnCountContainer.style.display = usingRowLayout ? "none" : "";
    rowSizeContainer.style.display = usingRowLayout ? "" : "none";
  }
}

export function toggleHeader(value: boolean): void {
  insertStyleHTML(`#header {display: ${value ? "block" : "none"}}`, "header");
}

export function reloadWindow(): void {
  window.location.reload();
}

export function changeColumnCountOnShiftScroll(wheelEvent: FavoritesWheelEvent): void {
  const event = wheelEvent.originalEvent;

  if (!event.shiftKey) {
    return;
  }
  const usingRowLayout = getCurrentLayout() === "row";
  const id = usingRowLayout ? "row-size" : "column-count";
  const input = document.getElementById(id);

  if (input === null || !(input instanceof HTMLInputElement)) {
    return;
  }
  // const inGallery = await Utils.inGallery();

  // if (inGallery) {
  //   return;
  // }

  // Utils.forceHideCaptions(true);
  // clearTimeout(timeout);
  // timeout = setTimeout(() => {
  //   Utils.forceHideCaptions(false);
  // }, 500);
  input.value = String(parseInt(input.value) + (isForwardNavigationKey(wheelEvent.direction) ? 1 : -1));
  input.dispatchEvent(new KeyboardEvent("keydown", {
    key: "Enter",
    bubbles: true
  }));
  input.dispatchEvent(new Event("change", {
    bubbles: true
  }));
}
