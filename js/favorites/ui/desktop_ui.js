class FavoritesMenuDesktopUI {
  /* eslint-disable object-property-newline */
  /* eslint-disable object-curly-newline */
  static template = {
    "button": [
      {id: "search-button", parentId: "left-favorites-panel-top-row", textContent: "Search", title: "Search favorites\nctrl+click/right-click: Search all of rule34 in a new tab", action: "search", enabled: true, handler: "uiController"},
      {id: "shuffle-button", parentId: "left-favorites-panel-top-row", textContent: "Shuffle", title: "Randomize order of search results", action: "shuffleSearchResults", enabled: true},
      {id: "invert-button", parentId: "left-favorites-panel-top-row", textContent: "Invert", title: "Show results not matched by latest search", action: "invertSearchResults", enabled: true},
      {id: "clear-button", parentId: "left-favorites-panel-top-row", textContent: "Clear", title: "Empty the search box", action: "clear", enabled: true, handler: "uiController"},
      {id: "reset-button", parentId: "left-favorites-panel-top-row", textContent: "Reset", title: "Delete cached favorites and reset preferences", action: "reset", enabled: true, handler: "uiController"}
    ],
    "checkboxOption": [
      {id: "options", parentId: "bottom-panel-1", textContent: "More Options", title: "Show more options", action: "toggleOptions", enabled: true, defaultValue: false, hotkey: "O", invokeActionOnCreation: true, savePreference: true, handler: "uiController"},
      {id: "show-ui", parentId: "show-ui-wrapper", textContent: "UI", title: "Toggle UI", action: "toggleUI", enabled: true, defaultValue: true, hotkey: "U", invokeActionOnCreation: true, savePreference: true, handler: "uiController"},
      {id: "enhance-search-pages", parentId: "favorite-options", textContent: "Enhance Search Pages", title: "Enable gallery and other features on search pages", action: "not needed", enabled: true, defaultValue: false, hotkey: "", invokeActionOnCreation: false, savePreference: true},
      {id: "show-remove-favorite-buttons", parentId: "favorite-options", textContent: "Remove Buttons", title: "Toggle remove favorite buttons", action: "toggleAddOrRemoveButtons", enabled: Utils.userIsOnTheirOwnFavoritesPage(), defaultValue: false, hotkey: "R", invokeActionOnCreation: true, savePreference: true, handler: "uiController"},
      {id: "show-add-favorite-buttons", parentId: "favorite-options", textContent: "Add Favorite Buttons", title: "Toggle add favorite buttons", action: "toggleAddOrRemoveButtons", enabled: !Utils.userIsOnTheirOwnFavoritesPage(), defaultValue: true, hotkey: "R", invokeActionOnCreation: true, savePreference: true, handler: "uiController"},
      {id: "exclude-blacklist", parentId: "favorite-options", textContent: "Exclude Blacklist", title: "Exclude favorites with blacklisted tags from search", action: "toggleBlacklist", enabled: Utils.userIsOnTheirOwnFavoritesPage(), defaultValue: false, hotkey: "", invokeActionOnCreation: false, savePreference: true},
      {id: "fancy-thumb-hovering", parentId: "favorite-options", textContent: "Fancy Hovering", title: "Enable fancy thumbnail hovering", action: "toggleFancyThumbHovering", enabled: true, defaultValue: false, hotkey: "", invokeActionOnCreation: true, savePreference: true, handler: "uiController"},
      {id: "statistic-hint", parentId: "favorite-options", textContent: "Show Statistics", title: "Show statistics for each favorite", action: "none", enabled: false, defaultValue: false, hotkey: "S", invokeActionOnCreation: false, savePreference: true},
      {id: "show-hints", parentId: "favorite-options", textContent: "Hotkey Hints", title: "Show hotkeys", action: "toggleOptionHotkeyHints", enabled: true, defaultValue: false, hotkey: "H", invokeActionOnCreation: true, savePreference: true, handler: "uiController"},
      {id: "toggle-header", parentId: "dynamic-favorite-options", textContent: "Header", title: "Toggle site header", action: "toggleHeader", enabled: false, defaultValue: true, hotkey: "", invokeActionOnCreation: true, savePreference: true, handler: "uiController"},
      {id: "dark-theme", parentId: "favorite-options", textContent: "Dark Theme", title: "Toggle dark theme", action: "toggleDarkTheme", enabled: true, defaultValue: Utils.usingDarkTheme(), hotkey: "", invokeActionOnCreation: false, savePreference: false, handler: "uiController"}
    ],
    "select": [
      {id: "sorting-method", parentId: "sort-container", title: "Change sorting order of search results", action: "updateSortingMethod", position: "beforeend", invokeActionOnCreation: false, optionPairs: [["default", "Default"], ["score", "Score"], ["width", "Width"], ["height", "Height"], ["creationTimestamp", "Date Uploaded"], ["lastChangedTimestamp", "Date Changed"], ["random", "Random"]]},
      {id: "layout-select", parentId: "layout-container", title: "Change layout", action: "changeLayout", position: "beforeend", invokeActionOnCreation: true, optionPairs: [["row", "River"], ["masonry", "Masonry"], ["square", "Square"], ["grid", "Legacy"]], handler: "uiController"},
      {id: "performance-profile", parentId: "performance-profile-container", title: "Improve performance by disabling features", action: "changePerformanceProfile", position: "beforeend", invokeActionOnCreation: false, optionPairs: [["0", "Normal"], ["1", "Low (no gallery)"], ["2", "Potato (only search)"]], handler: "uiController"}
    ],
    "checkbox": [{id: "sort-ascending", parentId: "sort-container", action: "toggleSortAscending", position: "beforeend", hotkey: "", invokeActionOnCreation: false, savePreference: true, defaultValue: false}],
    "numberComponent": [
      {id: "column-count", parentId: "column-count-container", position: "beforeend", action: "updateColumnCount", defaultValue: 6, min: 4, max: 20, step: 1, pollingTime: 50, invokeActionOnCreation: true},
      {id: "row-size", parentId: "row-size-container", position: "beforeend", action: "updateRowSize", defaultValue: 7, min: 1, max: 10, step: 1, pollingTime: 50, invokeActionOnCreation: true},
      {id: "results-per-page", parentId: "results-per-page-container", position: "beforeend", action: "updateResultsPerPage", defaultValue: 150, min: 50, max: 500, step: 50, pollingTime: 50, invokeActionOnCreation: false}
    ]
  };

  static create() {
    Utils.createDynamicElements(FavoritesMenuDesktopUI.template);
    FavoritesMenuDesktopUI.setupStaticElements();
  }

  static setupStaticElements() {
    this.setupWhatsNewMenu();
  }

  static setupWhatsNewMenu() {
    if (Utils.onMobileDevice()) {
      return;
    }
    const whatsNew = document.getElementById("whats-new-link");

    if (whatsNew === null) {
      return;
    }
    whatsNew.onclick = () => {
      if (whatsNew.classList.contains("persistent")) {
        whatsNew.classList.remove("persistent");
        whatsNew.classList.add("hidden");
      } else {
        whatsNew.classList.add("persistent");
      }
      return false;
    };

    whatsNew.onblur = () => {
      whatsNew.classList.remove("persistent");
      whatsNew.classList.add("hidden");
    };

    whatsNew.onmouseenter = () => {
      whatsNew.classList.remove("hidden");
    };

    whatsNew.onmouseleave = () => {
      whatsNew.classList.add("hidden");
    };
  }
}
