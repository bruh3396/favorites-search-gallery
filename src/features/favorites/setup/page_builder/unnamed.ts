import {insertStyleHTML, toggleDarkTheme} from "../../../../utils/dom/style";
import {Events} from "../../../../lib/functional/events";
import {FANCY_HOVERING_HTML} from "../../../../assets/html";
import {FavoriteLayout} from "../../../../types/primitives/primitives";
import {ON_MOBILE_DEVICE} from "../../../../lib/functional/flags";
import {Preferences} from "../../../../store/preferences/preferences";
// import {doNothing} from "../../config/constants";

function updateShowOnHoverOptionTriggeredFromGallery(value: boolean): void {
  const showOnHoverCheckbox = document.getElementById("show-on-hover");

  if (showOnHoverCheckbox !== null && showOnHoverCheckbox instanceof HTMLInputElement) {
    showOnHoverCheckbox.checked = value;
    Preferences.showOnHover.set(value);
  }
}

function changeColumnCountOnShiftScroll(): void {
  // let currentLayout = Preferences.layout.value;
  // let timeout = setTimeout(doNothing, 0);

  // Events.favorites.layoutChanged.on((newLayout => {
  //   currentLayout = newLayout;
  // }));

  // Events.global.wheel.on(async(wheelEvent) => {
  //   const event = wheelEvent.originalEvent;

  //   if (!event.shiftKey) {
  //     return;
  //   }
  //   const usingRowLayout = currentLayout === "row";
  //   const id = usingRowLayout ? "row-size" : "column-count";
  //   const input = document.getElementById(id);

  //   if (input === null || !(input instanceof HTMLInputElement)) {
  //     return;
  //   }
  //   const inGallery = await Utils.inGallery();

  //   if (inGallery) {
  //     return;
  //   }
  //   const addend = (-event.deltaY > 0 ? -1 : 1) * (usingRowLayout ? -1 : 1);

  //   Utils.forceHideCaptions(true);
  //   clearTimeout(timeout);
  //   timeout = setTimeout(() => {
  //     Utils.forceHideCaptions(false);
  //   }, 500);
  //   input.value = String(parseInt(input.value) + addend);
  //   input.dispatchEvent(new KeyboardEvent("keydown", {
  //     key: "Enter",
  //     bubbles: true
  //   }));
  //   input.dispatchEvent(new Event("change", {
  //     bubbles: true
  //   }));
  // }, {
  //   passive: true
  // });
}

function toggleFancyThumbHovering(value: boolean): void {
  insertStyleHTML(value ? FANCY_HOVERING_HTML : "", "fancy-image-hovering");
}

function toggleOptionHotkeyHints(value: boolean): void {
  insertStyleHTML(value ? "" : ".option-hint {display:none;}", "option-hint-visibility");
}

function toggleUI(value: boolean): void {
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

function toggleOptions(value: boolean): void {
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

function toggleAddOrRemoveButtons(value: boolean): void {
  insertStyleHTML(`
        .remove-favorite-button, .add-favorite-button {
          visibility: ${value ? "visible" : "hidden"} !important;
        }
      `, "add-or-remove-button-visibility");
  // forceHideCaptions(value);
}

function toggleDownloadButtons(value: boolean): void {
  insertStyleHTML(`
        .download-button {
          visibility: ${value ? "visible" : "hidden"} !important;
        }
      `, "download-button-visibility");
  // Utils.forceHideCaptions(value);
}

function changeLayout(layout: FavoriteLayout): void {
  const rowSizeContainer = document.getElementById("row-size-container");
  const columnCountContainer = document.getElementById("column-count-container");
  const usingRowLayout = layout === "row";

  if (columnCountContainer !== null && rowSizeContainer !== null) {
    columnCountContainer.style.display = usingRowLayout ? "none" : "";
    rowSizeContainer.style.display = usingRowLayout ? "" : "none";
  }
}

function toggleHeader(value: boolean): void {
  insertStyleHTML(`#header {display: ${value ? "block" : "none"}}`, "header");
}

export function setupFavoritesMenuEvents(): void {
  changeColumnCountOnShiftScroll();
  Events.gallery.showOnHover.on(updateShowOnHoverOptionTriggeredFromGallery);
  Events.favorites.hintsToggled.on(toggleOptionHotkeyHints);
  Events.favorites.darkThemeToggled.on(toggleDarkTheme);
  Events.favorites.uiToggled.on(toggleUI);
  Events.favorites.optionsToggled.on(toggleOptions);
  Events.favorites.removeButtonsToggled.on(toggleAddOrRemoveButtons);
  Events.favorites.addButtonsToggled.on(toggleAddOrRemoveButtons);
  Events.favorites.downloadButtonsToggled.on(toggleDownloadButtons);
  Events.favorites.layoutChanged.on(changeLayout);
  // Events.favorites.galleryMenuToggled.on(Utils.toggleGalleryMenu);
  Events.favorites.headerToggled.on(toggleHeader);
  Events.favorites.fancyHoveringToggled.on(toggleFancyThumbHovering);
  // Events.favorites.clearButtonClicked.on(Utils.clearMainSearchBox);
  // Events.gallery.enteredGallery.on(Utils.blurMainSearchBox);
}
