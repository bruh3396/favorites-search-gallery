class FavoritesMenuController {
  static setup() {
    FavoritesMenuController.addEventListeners();
  }

  static addEventListeners() {
    FavoritesMenuController.changeColumnCountOnShiftScroll();
    Events.gallery.showOnHover.on(FavoritesMenuController.updateShowOnHoverOptionTriggeredFromGallery);
    Events.favorites.hintsToggled.on(FavoritesMenuController.toggleOptionHotkeyHints);
    Events.favorites.darkThemeToggled.on(Utils.toggleDarkTheme);
    Events.favorites.uiToggled.on(FavoritesMenuController.toggleUI);
    Events.favorites.optionsToggled.on(FavoritesMenuController.toggleOptions);
    Events.favorites.removeButtonsToggled.on(FavoritesMenuController.toggleAddOrRemoveButtons);
    Events.favorites.addButtonsToggled.on(FavoritesMenuController.toggleAddOrRemoveButtons);
    Events.favorites.downloadButtonsToggled.on(FavoritesMenuController.toggleDownloadButtons);
    Events.favorites.layoutChanged.on(FavoritesMenuController.changeLayout);
    Events.favorites.galleryMenuToggled.on(Utils.toggleGalleryMenu);
    Events.favorites.headerToggled.on(FavoritesMenuController.toggleHeader);
    Events.favorites.fancyHoveringToggled.on(FavoritesMenuController.toggleFancyThumbHovering);
    Events.favorites.clearButtonClicked.on(Utils.clearMainSearchBox);
    Events.gallery.enteredGallery.on(Utils.blurMainSearchBox);
  }

  /**
   *
   * @param {Boolean} value
   */
  static updateShowOnHoverOptionTriggeredFromGallery(value) {
    const showOnHoverCheckbox = document.getElementById("show-on-hover");

    if (showOnHoverCheckbox !== null && showOnHoverCheckbox instanceof HTMLInputElement) {
      showOnHoverCheckbox.checked = value;
      Preferences.showOnHover.set(value);
    }
  }

  static changeColumnCountOnShiftScroll() {
    let currentLayout = Preferences.layout.value;
    let timeout = setTimeout(Constants.doNothing, 0);

    Events.favorites.layoutChanged.on((newLayout => {
      currentLayout = newLayout;
    }));

    Events.global.wheel.on(async(wheelEvent) => {
      const event = wheelEvent.originalEvent;

      if (!event.shiftKey) {
        return;
      }
      const usingRowLayout = currentLayout === "row";
      const id = usingRowLayout ? "row-size" : "column-count";
      const input = document.getElementById(id);

      if (input === null || !(input instanceof HTMLInputElement)) {
        return;
      }
      const inGallery = await Utils.inGallery();

      if (inGallery) {
        return;
      }
      const addend = (-event.deltaY > 0 ? -1 : 1) * (usingRowLayout ? -1 : 1);

      Utils.forceHideCaptions(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        Utils.forceHideCaptions(false);
      }, 500);
      input.value = String(parseInt(input.value) + addend);
      input.dispatchEvent(new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true
      }));
      input.dispatchEvent(new Event("change", {
        bubbles: true
      }));
    }, {
      passive: true
    });
  }

  /**
   * @param {Boolean} value
   */
  static toggleFancyThumbHovering(value) {
    Utils.insertStyleHTML(value ? Utils.styles.fancyHovering : "", "fancy-image-hovering");
  }

  /**
   * @param {Boolean} value
   */
  static toggleOptionHotkeyHints(value) {
    Utils.insertStyleHTML(value ? "" : ".option-hint {display:none;}", "option-hint-visibility");
  }

  /**
   * @param {Boolean} value
   */
  static toggleUI(value) {
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

  /**
   * @param {Boolean} value
   */
  static toggleOptions(value) {
    if (Flags.onMobileDevice) {
      document.getElementById("left-favorites-panel-bottom-row")?.classList.toggle("hidden", !value);
      Utils.insertStyleHTML(`
            #mobile-button-row {
              display: ${value ? "block" : "none"};
            }
            `, "options");
      return;
    }
    Utils.insertStyleHTML(`
        .options-container {
          display: ${value ? "block" : "none"};
        }
        `, "options");
  }

  /**
   * @param {Boolean} value
   */
  static toggleAddOrRemoveButtons(value) {
    Utils.insertStyleHTML(`
        .remove-favorite-button, .add-favorite-button {
          visibility: ${value ? "visible" : "hidden"} !important;
        }
      `, "add-or-remove-button-visibility");
    Utils.forceHideCaptions(value);
  }

  /**
   * @param {Boolean} value
   */
  static toggleDownloadButtons(value) {
    Utils.insertStyleHTML(`
        .download-button {
          visibility: ${value ? "visible" : "hidden"} !important;
        }
      `, "download-button-visibility");
    Utils.forceHideCaptions(value);
  }

  /**
   * @param {FavoriteLayout} layout
   */
  static changeLayout(layout) {
    const rowSizeContainer = document.getElementById("row-size-container");
    const columnCountContainer = document.getElementById("column-count-container");
    const usingRowLayout = layout === "row";

    if (columnCountContainer !== null && rowSizeContainer !== null) {
      columnCountContainer.style.display = usingRowLayout ? "none" : "";
      rowSizeContainer.style.display = usingRowLayout ? "" : "none";
    }
  }

  /**
   * @param {Boolean} value
   */
  static toggleHeader(value) {
    Utils.insertStyleHTML(`#header {display: ${value ? "block" : "none"}}`, "header");
  }
}
