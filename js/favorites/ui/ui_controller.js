class FavoritesUIController {
  /** @type {Record<String, HTMLElement>} */
  static hotkeys = {};

  static setup() {
    FavoritesUIController.setupMenuEvents();
    // FavoritesUIController.setupHotkeys();
    FavoritesUIController.setupGlobalListeners();
  }

  static setupMenuEvents() {
    const menu = document.getElementById("favorites-search-gallery-menu");

    if (menu === null) {
      return;
    }

    menu.addEventListener("uiController", (event) => {
      // @ts-ignore
      if (!Utils.hasTagName(event.target, "label")) {
        FavoritesUIController.invokeAction(event);
      }
    });
    Events.favorites.layoutChanged.on(FavoritesUIController.changeLayout);
  }

  /**
   * @param {String} hotkey
   * @param {HTMLElement} element
   */
  static registerCheckboxHotkey(hotkey, element) {
    if (hotkey === "" || hotkey === null || hotkey === undefined) {
      return;
    }
    FavoritesUIController.hotkeys[hotkey.toLocaleLowerCase()] = element;
  }

  static setupHotkeys() {
    // const processCheckboxHotkey = async(/** @type {FavoritesKeyboardEvent} */ event) => {
    //   const hotkey = event.key;
    //   const target = FavoritesUIController.hotkeys[hotkey];

    //   if (!event.isHotkey || target === undefined || !(target instanceof HTMLInputElement)) {
    //     return;
    //   }

    //   const inGallery = await Utils.inGallery();

    //   if (inGallery) {
    //     return;
    //   }

    //   target.checked = !target.checked;
    //   // @ts-ignore
    //   FavoritesUIController.invokeAction({
    //     target
    //   });
    // };

    // const processGeneralHotkeyEvent = async(/** @type {FavoritesKeyboardEvent} */ event) => {
    //   const inGallery = await Utils.inGallery();

    //   if (inGallery || Types.isTypeableInput(event.originalEvent.target)) {
    //     return;
    //   }

    //   switch (event.key.toLowerCase()) {
    //     case "s":
    //       event.originalEvent.stopImmediatePropagation();
    //       event.originalEvent.stopPropagation();
    //       setTimeout(() => {
    //         Utils.focusMainSearchBox();
    //       }, 0);
    //       break;

    //     default:
    //       break;
    //   }
    // };

    // Events.global.keydown.on((event) => {
    //   processCheckboxHotkey(event);
    //   processGeneralHotkeyEvent(event);
    // });
  }

  static setupGlobalListeners() {
    FavoritesUIController.changeColumnCountOnShiftScroll();
    FavoritesUIController.updateShowOnHoverOptionTriggeredFromGallery();
  }

  static updateShowOnHoverOptionTriggeredFromGallery() {
    Events.gallery.showOnHover.on((value) => {
      const showOnHoverCheckbox = document.getElementById("show-on-hover");

      if (showOnHoverCheckbox !== null && showOnHoverCheckbox instanceof HTMLInputElement) {
        showOnHoverCheckbox.checked = value;
        Preferences.showOnHover.set(value);
      }
    });
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
   * @param {Event} event
   */
  static invokeAction(event) {
    if (!(event.target instanceof HTMLElement)) {
      return;
    }
    const action = event.target.dataset.action;

    // @ts-ignore
    if (action !== null && action !== undefined && FavoritesUIController[action] !== undefined) {
      // @ts-ignore
      FavoritesUIController[action](event);
    } else if (event.target instanceof HTMLInputElement) {
      event.target.dispatchEvent(new Event("change"));
    }
  }

  static reset() {
    Utils.deletePersistentData();
  }

  /**
   * @param {CustomEvent} event
   */
  static toggleFancyThumbHovering(event) {
    if (event.target instanceof HTMLInputElement) {
      Utils.insertStyleHTML(event.target.checked ? Utils.styles.fancyHovering : "", "fancy-image-hovering");
    }
  }

  /**
   * @param {CustomEvent} event
   */
  static toggleOptionHotkeyHints(event) {
    if (!(event.target instanceof HTMLInputElement)) {
      return;
    }
    const html = event.target.checked ? "" : ".option-hint {display:none;}";

    Utils.insertStyleHTML(html, "option-hint-visibility");
  }

  /**
   * @param {CustomEvent} event
   */
  static toggleDarkTheme(event) {
    if (event.target instanceof HTMLInputElement) {
      Utils.toggleDarkTheme(event.target.checked);
    }
  }

  /**
   * @param {CustomEvent} event
   */
  static toggleStatisticHints(event) {
    if (!(event.target instanceof HTMLInputElement)) {
      return;
    }
    const html = event.target.checked ? "" : ".statistic-hint {display:none;}";

    Utils.insertStyleHTML(html, "statistic-hint-visibility");
  }

  /**
   * @param {CustomEvent} event
   */
  static toggleUI(event) {
    if (!(event.target instanceof HTMLInputElement)) {
      return;
    }
    const checked = event.target.checked;
    const menu = document.getElementById("favorites-search-gallery-menu");
    const panels = document.getElementById("favorites-search-gallery-menu-panels");
    const header = document.getElementById("header");
    const container = document.getElementById("show-ui-container");
    const bottomPanel3 = document.getElementById("bottom-panel-3");

    if (menu === null || panels === null || container === null || bottomPanel3 === null) {
      return;
    }

    if (checked) {
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
    container.classList.toggle("ui-hidden", !checked);
  }

  /**
   * @param {CustomEvent} event
   */
  static toggleOptions(event) {
    if (!(event.target instanceof HTMLInputElement)) {
      return;
    }
    const value = event.target.checked;

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
   * @param {CustomEvent} event
   */
  static toggleAddOrRemoveButtons(event) {
    if (!(event.target instanceof HTMLInputElement)) {
      return;
    }
    const visibility = event.target.checked ? "visible" : "hidden";

    Utils.insertStyleHTML(`
        .add-or-remove-button {
          visibility: ${visibility} !important;
        }
      `, "add-or-remove-button-visibility");
    Utils.forceHideCaptions(event.target.checked);
  }

  /**
   * @param {CustomEvent} event
   */
  static search(event) {
    const searchBox = document.getElementById(Utils.mainSearchBoxId);

    if (searchBox === null || (!(searchBox instanceof HTMLTextAreaElement) && !(searchBox instanceof HTMLInputElement))) {
      return;
    }

    if (event.detail.rightClick || event.detail.ctrlKey) {
      Utils.openSearchPage(searchBox.value);
      return;
    }

    searchBox.dispatchEvent(new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true
    }));
  }

  static clear() {
    Utils.setMainSearchBoxValue("");
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
   * @param {CustomEvent} event
   */
  static toggleHeader(event) {
    if (!(event.target instanceof HTMLInputElement)) {
      return;
    }
    Utils.insertStyleHTML(`#header {display: ${event.target.checked ? "block" : "none"}}`, "header");
  }

  /**
   * @param {CustomEvent} event
   */
  static toggleGalleryMenu(event) {
    if (!(event.target instanceof HTMLInputElement)) {
      return;
    }
    Utils.toggleGalleryMenu(event.target.checked);
  }
}
