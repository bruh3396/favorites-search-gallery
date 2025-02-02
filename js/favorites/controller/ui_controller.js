class FavoritesUIController {
  /* eslint-disable object-property-newline */
  /* eslint-disable object-curly-newline */
  static hotkeys = {};

  static setup() {
    FavoritesUIController.setupMenuEvents();
    FavoritesUIController.setupCheckboxHotkeys();
    FavoritesUIController.setupGlobalListeners();
  }

  static setupMenuEvents() {
    const menu = document.getElementById("favorites-search-gallery-menu");

    if (menu === null) {
      return;
    }

    menu.addEventListener("uiController", (event) => {
      if (!Utils.hasTagName(event.target, "label")) {
        FavoritesUIController.invokeAction(event);
      }
    });
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

  static setupCheckboxHotkeys() {
    document.addEventListener("keydown", (event) => {
      const hotkey = event.key.toLowerCase();
      const target = FavoritesUIController.hotkeys[hotkey];

      if (!Utils.isHotkeyEvent(event) || target === undefined) {
        return;
      }
      target.checked = !target.checked;
      FavoritesUIController.invokeAction({target});
    });
  }

  static setupGlobalListeners() {
    FavoritesUIController.updateColumnCountOnShiftScroll();
  }

  static updateColumnCountOnShiftScroll() {
    const cooldown = new Cooldown(500, true);

    cooldown.onDebounceEnd = () => {
      Utils.forceHideCaptions(false);
    };
    cooldown.onCooldownEnd = () => {
      if (!cooldown.debouncing) {
        Utils.forceHideCaptions(false);
      }
    };
    window.addEventListener("wheel", (event) => {
      const columnInput = document.getElementById("column-count");

      if (columnInput === null || !(columnInput instanceof HTMLInputElement)) {
        return;
      }

      if (!event.shiftKey) {
        return;
      }
      const columnAddend = -event.deltaY > 0 ? -1 : 1;

      if (cooldown.ready) {
        Utils.forceHideCaptions(true);
      }
      columnInput.value = String(parseInt(columnInput.value) + columnAddend);
      columnInput.dispatchEvent(new KeyboardEvent("keydown", {key: "Enter", bubbles: true}));
      columnInput.dispatchEvent(new Event("change", {bubbles: true}));
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

    if (action !== null && action !== undefined && FavoritesUIController[action] !== undefined) {
      FavoritesUIController[action](event);
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

  static changePerformanceProfile() {
    window.location.reload();
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

    if (Utils.onMobileDevice()) {
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
  static changeAllowedRatings(event) {
    const explicit = event.target.querySelector("#explicit-rating");
    const questionable = event.target.querySelector("#questionable-rating");
    const safe = event.target.querySelector("#safe-rating");
    const allowedRatings = (4 * Number(explicit.checked)) + (2 * Number(questionable.checked)) + Number(safe.checked);

    Utils.setPreference("allowedRatings", allowedRatings);
    event.target.dispatchEvent(new CustomEvent("controller", {bubbles: true, detail: allowedRatings}));

    switch (allowedRatings) {
      case 4:
        explicit.nextElementSibling.style.pointerEvents = "none";
        break;

      case 2:
        questionable.nextElementSibling.style.pointerEvents = "none";
        break;

      case 1:
        safe.nextElementSibling.style.pointerEvents = "none";
        break;

      default:
        for (const element of [explicit, questionable, safe]) {
          element.nextElementSibling.removeAttribute("style");
        }
        break;
    }
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
   * @returns
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
}
