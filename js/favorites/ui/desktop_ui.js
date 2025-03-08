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
      {id: "show-remove-favorite-buttons", parentId: "favorite-options", textContent: "Remove Buttons", title: "Toggle remove favorite buttons", action: "toggleAddOrRemoveButtons", enabled: Utils.userIsOnTheirOwnFavoritesPage(), defaultValue: Defaults.showRemoveFavoriteButtons, hotkey: "R", invokeActionOnCreation: true, savePreference: true, handler: "uiController"},
      {id: "show-add-favorite-buttons", parentId: "favorite-options", textContent: "Add Favorite Buttons", title: "Toggle add favorite buttons", action: "toggleAddOrRemoveButtons", enabled: !Utils.userIsOnTheirOwnFavoritesPage(), defaultValue: Defaults.showAddFavoriteButtons, hotkey: "R", invokeActionOnCreation: true, savePreference: true, handler: "uiController"},
      {id: "exclude-blacklist", parentId: "favorite-options", textContent: "Exclude Blacklist", title: "Exclude favorites with blacklisted tags from search", action: "toggleBlacklist", enabled: Utils.userIsOnTheirOwnFavoritesPage(), defaultValue: Defaults.excludeBlacklist, hotkey: "", invokeActionOnCreation: false, savePreference: true},
      {id: "fancy-thumb-hovering", parentId: "favorite-options", textContent: "Fancy Hovering", title: "Enable fancy thumbnail hovering", action: "toggleFancyThumbHovering", enabled: false, defaultValue: false, hotkey: "", invokeActionOnCreation: true, savePreference: true, handler: "uiController"},
      {id: "show-hints", parentId: "favorite-options", textContent: "Hotkey Hints", title: "Show hotkeys", action: "toggleOptionHotkeyHints", enabled: true, defaultValue: Defaults.showHints, hotkey: "H", invokeActionOnCreation: true, savePreference: true, handler: "uiController"},
      {id: "toggle-header", parentId: "dynamic-favorite-options", textContent: "Header", title: "Toggle site header", action: "toggleHeader", enabled: false, defaultValue: Defaults.headerEnabled, hotkey: "", invokeActionOnCreation: true, savePreference: true, handler: "uiController"},
      {id: "dark-theme", parentId: "favorite-options", textContent: "Dark Theme", title: "Toggle dark theme", action: "toggleDarkTheme", enabled: true, defaultValue: Utils.usingDarkTheme(), hotkey: "", invokeActionOnCreation: false, savePreference: false, handler: "uiController"},
      {id: "show-on-hover", parentId: "dynamic-favorite-options", textContent: "Fullscreen on Hover", title: "View full resolution images or play videos and GIFs when hovering over a thumbnail", action: "toggleShowOnHover", enabled: Utils.galleryIsEnabled(), defaultValue: Defaults.showOnHover, hotkey: "", invokeActionOnCreation: false, savePreference: true, handler: "uiController"},
      {id: "enable-gallery-menu", parentId: "dynamic-favorite-options", textContent: "Gallery Sidebar", title: "Show sidebar in gallery", action: "toggleGalleryMenu", enabled: Utils.galleryIsEnabled(), defaultValue: Defaults.galleryMenuEnabled, hotkey: "", invokeActionOnCreation: false, savePreference: true, handler: "uiController"}
    ],
    "select": [
      {id: "sorting-method", parentId: "sort-container", title: "Change sorting order of search results", action: "updateSortingMethod", position: "beforeend", invokeActionOnCreation: false, optionPairs: [["default", "Default"], ["score", "Score"], ["width", "Width"], ["height", "Height"], ["creationTimestamp", "Date Uploaded"], ["lastChangedTimestamp", "Date Changed"], ["random", "Random"]]},
      {
        id: "layout-select", parentId: "layout-container", title: "Change layout", action: "changeLayout", position: "beforeend", invokeActionOnCreation: true,
        optionPairs: [
          ["masonry-lite", "Masonry v2"],
          ["row", "River"],
          // ["masonry", "Masonry"],
          ["square", "Square"],
          ["grid", "Legacy"]
        ], handler: "uiController"
      },
      {id: "performance-profile", parentId: "performance-profile-container", title: "Improve performance by disabling features", action: "changePerformanceProfile", position: "beforeend", invokeActionOnCreation: false, optionPairs: [["0", "Normal"], ["1", "Low (no gallery)"], ["2", "Potato (only search)"]], handler: "uiController"}
    ],
    "checkbox": [{id: "sort-ascending", parentId: "sort-container", action: "toggleSortAscending", position: "beforeend", hotkey: "", invokeActionOnCreation: false, savePreference: true, defaultValue: false}],
    "numberComponent": [
      {id: "column-count", parentId: "column-count-container", position: "beforeend", action: "updateColumnCount", defaultValue: Defaults.columnCount, min: 4, max: 20, step: 1, pollingTime: 50, invokeActionOnCreation: true},
      {id: "row-size", parentId: "row-size-container", position: "beforeend", action: "updateRowSize", defaultValue: Defaults.rowSize, min: 1, max: 10, step: 1, pollingTime: 50, invokeActionOnCreation: true},
      {id: "results-per-page", parentId: "results-per-page-container", position: "beforeend", action: "updateResultsPerPage", defaultValue: Defaults.resultsPerPage, min: 50, max: 7000, step: 50, pollingTime: 50, invokeActionOnCreation: false}
    ]
  };

  static create() {
    Utils.createDynamicElements(FavoritesMenuDesktopUI.template);
    FavoritesMenuDesktopUI.setupStaticElements();
  }

  static setupStaticElements() {
    FavoritesMenuDesktopUI.setupWhatsNewMenu();
    FavoritesMenuDesktopUI.setupFindFavorite();
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

  static setupFindFavorite() {
    const findFavoriteButton = document.getElementById("find-favorite-button");
    const findFavoriteInput = document.getElementById("find-favorite-input");

    if (!(findFavoriteButton instanceof HTMLButtonElement) || !(findFavoriteInput instanceof HTMLInputElement)) {
      return;
    }
    findFavoriteInput.value = Utils.getPreference("findFavorite", "");
    findFavoriteInput.dataset.action = "findFavorite";
    const findFavoriteFunction = () => {
      findFavoriteInput.dispatchEvent(new CustomEvent("controller", {detail: findFavoriteInput.value, bubbles: true}));
    };

    findFavoriteInput.onkeydown = (event) => {
      if (event.key === "Enter") {
        findFavoriteFunction();
      }
    };
    findFavoriteButton.onclick = () => {
      findFavoriteFunction();
    };
    findFavoriteInput.oninput = Utils.debounceAlways(() => {
      Utils.setPreference("findFavorite", findFavoriteInput.value);
    }, 1000);
    GlobalEvents.caption.on("idClicked", (/** @type {String} */ id) => {
      findFavoriteInput.value = id;
    });
  }
}
