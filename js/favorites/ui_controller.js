/* eslint-disable object-property-newline */
/* eslint-disable object-curly-newline */
class FavoritesUIController {
  static hotkeys = {};

  static setup() {
    FavoritesUIController.setupMenuEvents();
    FavoritesUIController.setupCheckboxHotkeys();
    FavoritesUIController.setupGlobalListeners();
    FavoritesUIController.setupRatingFilter();
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

  static setupRatingFilter() {
    const ratingFilter = document.getElementById("allowed-ratings");

    if (ratingFilter === null) {
      return;
    }
    const allowedRatings = Utils.loadAllowedRatings();

    // eslint-disable-next-line no-bitwise
    ratingFilter.querySelector("#explicit-rating").checked = (allowedRatings & 4) === 4;
    // eslint-disable-next-line no-bitwise
    ratingFilter.querySelector("#questionable-rating").checked = (allowedRatings & 2) === 2;
    // eslint-disable-next-line no-bitwise
    ratingFilter.querySelector("#safe-rating").checked = (allowedRatings & 1) === 1;

    FavoritesUIController.changeAllowedRatings(ratingFilter);
    ratingFilter.onclick = (event) => {
      if (!Utils.hasTagName(event.target, "label")) {
        console.log(allowedRatings);
        ratingFilter.dispatchEvent(new CustomEvent("controller", {bubbles: true, detail: allowedRatings}));
        // FavoritesUIController.changeAllowedRatings(ratingFilter);
      }
    };
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
    FavoritesUIController.setupQuickSearchForTag();
    FavoritesUIController.changeColumnCountOnShiftScroll();
  }

  static setupQuickSearchForTag() {
    window.addEventListener("searchForTag", (event) => {
      const searchBox = SearchHistoryOld.state.searchBox;

      if (searchBox !== null) {
        searchBox.value = event.detail;
        FavoritesUIController.search({ctrlKey: false});
      }
    });
  }

  static changeColumnCountOnShiftScroll() {
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
      const delta = (event.wheelDelta ? event.wheelDelta : -event.deltaY);
      const columnAddend = delta > 0 ? -1 : 1;

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
    const action = event.target.dataset.action;

    if (action !== null && action !== undefined && FavoritesUIController[action] !== undefined) {
      FavoritesUIController[action](event);
    }
  }

  static reset() {
    Utils.deletePersistentData();
  }

  static navigateSearchHistory(event) {
    const searchBox = event.target;

    if (Utils.awesompleteIsVisible(searchBox)) {
      return;
    }
    event.preventDefault();
    const searchHistory = SearchHistoryOld.state.searchHistory;

    if (event.key === "ArrowUp") {
      SearchHistoryOld.incrementSearchHistoryIndex();
    } else {
      SearchHistoryOld.decrementSearchHistoryIndex();
    }
    const index = SearchHistoryOld.state.searchHistoryIndex;

    searchBox.value = searchHistory[index] || SearchHistoryOld.state.lastEditedSearchQuery;
  }

  /**
   * @param {CustomEvent} event
   */
  static toggleFancyThumbHovering(event) {
    Utils.insertStyleHTML(event.target.checked ? Utils.styles.fancyHovering : "", "fancy-image-hovering");
  }

  /**
   * @param {CustomEvent} event
   */
  static toggleOptionHotkeyHints(event) {
    const html = event.target.checked ? "" : ".option-hint {display:none;}";

    Utils.insertStyleHTML(html, "option-hint-visibility");
  }

  /**
   * @param {CustomEvent} event
   */
  static toggleDarkTheme(event) {
    Utils.toggleDarkTheme(event.target.checked);
  }

  static toggleStatisticHints(event) {
    const html = event.target.checked ? "" : ".statistic-hint {display:none;}";

    Utils.insertStyleHTML(html, "statistic-hint-visibility");
  }

  static changePerformanceProfile() {
    window.location.reload();
  }

  static toggleUI(event) {
    const checked = event.target.checked;
    const menu = document.getElementById("favorites-search-gallery-menu");
    const panels = document.getElementById("favorites-search-gallery-menu-panels");
    const header = document.getElementById("header");
    const container = document.getElementById("show-ui-container");
    const bottomPanel3 = document.getElementById("bottom-panel-3");

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
   * @param {HTMLElement} target
   */
  static changeAllowedRatings(target) {
    const explicit = target.querySelector("#explicit-rating");
    const questionable = target.querySelector("#questionable-rating");
    const safe = target.querySelector("#safe-rating");
    const allowedRatings = (4 * Number(explicit.checked)) + (2 * Number(questionable.checked)) + Number(safe.checked);

    Utils.setPreference("allowedRatings", allowedRatings);

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
    const visibility = event.target.checked ? "visible" : "hidden";

    Utils.insertStyleHTML(`
        .add-or-remove-button {
          visibility: ${visibility} !important;
        }
      `, "add-or-remove-button-visibility");
  }

  static search() {
    const searchBox = document.getElementById(Utils.mainSearchBoxId);

    if (searchBox === null || (!(searchBox instanceof HTMLTextAreaElement) && !(searchBox instanceof HTMLInputElement))) {
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
