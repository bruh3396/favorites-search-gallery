class FavoritesMenuDesktopUI {
  /* eslint-disable object-property-newline */
  /* eslint-disable object-curly-newline */
  static template = {
    "button": [
      {id: "search-button", parentId: "left-favorites-panel-top-row", textContent: "Search", title: "Search favorites\nctrl+click/right-click: Search all of rule34 in a new tab", action: "search", enabled: true, handler: "uiController"},
      {id: "shuffle-button", parentId: "left-favorites-panel-top-row", textContent: "Shuffle", title: "Randomize order of search results", action: "shuffleSearchResults", enabled: true},
      {id: "invert-button", parentId: "left-favorites-panel-top-row", textContent: "Invert", title: "Show results not matched by latest search", action: "invertSearchResults", enabled: true},
      {id: "clear-button", parentId: "left-favorites-panel-top-row", textContent: "Clear", title: "Empty the search box", action: "clear", enabled: true, handler: "uiController"},
      {id: "download-button", parentId: "left-favorites-panel-top-row", textContent: "Download", title: "Download search results", action: "downloadSearchResults", enabled: true, handler: "controller"},
      {id: "reset-button", parentId: "left-favorites-panel-top-row", textContent: "Reset", title: "Delete cached favorites and reset preferences", action: "reset", enabled: true, handler: "uiController"}
    ],
    "checkboxOption": [
      {id: "options", parentId: "bottom-panel-1", textContent: "More Options", title: "Show more options", action: "toggleOptions", enabled: true, preference: Preferences.showOptions, hotkey: "O", invokeActionOnCreation: true, savePreference: true, handler: "uiController"},
      {id: "show-ui", parentId: "show-ui-wrapper", textContent: "UI", title: "Toggle UI", action: "toggleUI", enabled: true, preference: Preferences.showUI, hotkey: "U", invokeActionOnCreation: true, savePreference: true, handler: "uiController"},
      {id: "infinite-scroll", parentId: "favorite-options", textContent: "Infinite Scroll", title: "Use infinite scroll (waterfall) instead of pages", action: "toggleInfiniteScroll", enabled: true, preference: Preferences.infiniteScroll, hotkey: "", invokeActionOnCreation: false, savePreference: true},
      {id: "enhance-search-pages", parentId: "favorite-options", textContent: "Enhance Search Pages", title: "Enable gallery and other features on search pages", action: "not needed", enabled: true, preference: Preferences.enableOnSearchPages, hotkey: "", invokeActionOnCreation: false, savePreference: true},
      {id: "show-remove-favorite-buttons", parentId: "favorite-options", textContent: "Remove Buttons", title: "Toggle remove favorite buttons", action: "toggleAddOrRemoveButtons", enabled: Flags.userIsOnTheirOwnFavoritesPage, preference: Preferences.showRemoveFavoriteButtons, hotkey: "R", invokeActionOnCreation: true, savePreference: true, handler: "uiController"},
      {id: "show-add-favorite-buttons", parentId: "favorite-options", textContent: "Add Favorite Buttons", title: "Toggle add favorite buttons", action: "toggleAddOrRemoveButtons", enabled: !Flags.userIsOnTheirOwnFavoritesPage, preference: Preferences.showAddFavoriteButtons, hotkey: "R", invokeActionOnCreation: true, savePreference: true, handler: "uiController"},
      {id: "exclude-blacklist", parentId: "favorite-options", textContent: "Exclude Blacklist", title: "Exclude favorites with blacklisted tags from search", action: "toggleBlacklist", enabled: Flags.userIsOnTheirOwnFavoritesPage, preference: Preferences.excludeBlacklist, hotkey: "", invokeActionOnCreation: false, savePreference: true},
      {id: "fancy-thumb-hovering", parentId: "favorite-options", textContent: "Fancy Hovering", title: "Enable fancy thumbnail hovering", action: "toggleFancyThumbHovering", enabled: false, preference: Preferences.fancyThumbHovering, hotkey: "", invokeActionOnCreation: true, savePreference: true, handler: "uiController"},
      {id: "show-hints", parentId: "favorite-options", textContent: "Hotkey Hints", title: "Show hotkeys", action: "toggleOptionHotkeyHints", enabled: true, preference: Preferences.showHints, hotkey: "H", invokeActionOnCreation: true, savePreference: true, handler: "uiController"},
      {id: "toggle-header", parentId: "dynamic-favorite-options", textContent: "Header", title: "Toggle site header", action: "toggleHeader", enabled: false, preference: Preferences.showHeader, hotkey: "", invokeActionOnCreation: true, savePreference: true, handler: "uiController"},
      {id: "show-tooltips", parentId: "dynamic-favorite-options", textContent: "Tooltips", title: "Show tags when hovering over a thumbnail and see which ones were matched by a search", action: "toggleTooltips", enabled: Flags.tooltipEnabled, preference: Preferences.showTooltip, hotkey: "t", invokeActionOnCreation: true, savePreference: true, handler: "uiController"},
      {id: "dark-theme", parentId: "favorite-options", textContent: "Dark Theme", title: "Toggle dark theme", action: "toggleDarkTheme", enabled: true, defaultValue: Utils.usingDarkTheme(), hotkey: "", invokeActionOnCreation: false, savePreference: false, handler: "uiController"},
      {id: "show-on-hover", parentId: "dynamic-favorite-options", textContent: "Fullscreen on Hover", title: "View full resolution images or play videos and GIFs when hovering over a thumbnail", action: "toggleShowOnHover", enabled: Flags.galleryEnabled, preference: Preferences.showOnHover, hotkey: "", invokeActionOnCreation: false, savePreference: true, handler: "uiController"},
      {id: "use-aliases", parentId: "dynamic-favorite-options", textContent: "Aliases", title: "Alias similar tags", action: "toggleAliasing", enabled: true, preference: Preferences.tagAliasing, hotkey: "A", invokeActionOnCreation: false, savePreference: true, handler: "uiController"},
      {id: "enable-gallery-menu", parentId: "dynamic-favorite-options", textContent: "Gallery Menu", title: "Show menu in gallery", action: "toggleGalleryMenu", enabled: Flags.galleryEnabled && Settings.galleryMenuEnabled, preference: Preferences.galleryMenuEnabled, hotkey: "", invokeActionOnCreation: false, savePreference: true, handler: "uiController"}
    ],
    "select": [
      {
        id: "sorting-method", parentId: "sort-container", title: "Change sorting order of search results", action: "setSortingMethod", position: "beforeend", invokeActionOnCreation: false, preference: Preferences.sortingMethod,
        optionPairs: [
          ["default", "Default"],
          ["score", "Score"],
          ["width", "Width"],
          ["height", "Height"],
          ["creationTimestamp", "Date Uploaded"],
          ["lastChangedTimestamp", "Date Changed"],
          ["random", "Random"]
        ]
      },
      {
        id: "layout-select", parentId: "layout-container", title: "Change layout", action: "changeLayout", position: "beforeend", invokeActionOnCreation: true, preference: Preferences.layout,
        optionPairs: [
          ["column", "Waterfall"],
          ["row", "River"],
          ["square", "Square"],
          ["grid", "Legacy"]
        ], handler: "uiController"
      },
      {
        id: "performance-profile", parentId: "performance-profile-container", title: "Improve performance by disabling features", action: "changePerformanceProfile", position: "beforeend", invokeActionOnCreation: false, preference: Preferences.performanceProfile,
        optionPairs: [
          ["0", "Normal"],
          ["1", "Low (no gallery)"],
          ["2", "Potato (only search)"]
        ],
        handler: "uiController"
      }
    ],
    "checkbox": [{id: "sort-ascending", parentId: "sort-container", action: "toggleSortAscending", position: "beforeend", hotkey: "", invokeActionOnCreation: false, savePreference: true, preference: Preferences.sortAscending}],
    "numberComponent": [
      {id: "column-count", parentId: "column-count-container", position: "beforeend", action: "updateColumnCount", preference: Preferences.columnCount, min: Settings.minColumnCount, max: Settings.maxColumnCount, step: 1, pollingTime: 50, invokeActionOnCreation: true},
      {id: "row-size", parentId: "row-size-container", position: "beforeend", action: "updateRowSize", preference: Preferences.rowSize, min: Settings.minRowSize, max: Settings.maxRowSize, step: 1, pollingTime: 50, invokeActionOnCreation: true},
      {id: "results-per-page", parentId: "results-per-page-container", position: "beforeend", action: "updateResultsPerPage", preference: Preferences.resultsPerPage, min: Settings.minResultsPerPage, max: Settings.maxResultsPerPage, step: Settings.resultsPerPageStep, pollingTime: 50, invokeActionOnCreation: false}
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
    if (Flags.onMobileDevice) {
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
    findFavoriteInput.value = Preferences.favoriteFinder.value;
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
      Preferences.favoriteFinder.set(findFavoriteInput.value);
    }, 1000);
    Events.caption.idClicked.on((id) => {
      findFavoriteInput.value = id;
    });
  }
}
