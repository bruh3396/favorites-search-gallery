class FavoritesMenuDesktopUI {
  /* eslint-disable object-property-newline */
  /* eslint-disable object-curly-newline */
  template = {
    /** @type {ElementTemplateParams<MouseEvent>[]} */
    "button": [
      {id: "search-button", parentId: "left-favorites-panel-top-row", textContent: "Search", title: "Search favorites\nctrl+click/right-click: Search all of rule34 in a new tab", action: "search", enabled: true},
      {id: "shuffle-button", parentId: "left-favorites-panel-top-row", textContent: "Shuffle", title: "Randomize order of search results", enabled: true, eventEmitter: Events.favorites.shuffleButtonClicked},
      {id: "invert-button", parentId: "left-favorites-panel-top-row", textContent: "Invert", title: "Show results not matched by latest search", enabled: true, eventEmitter: Events.favorites.invertButtonClicked},
      {id: "clear-button", parentId: "left-favorites-panel-top-row", textContent: "Clear", title: "Empty the search box", action: "clear", enabled: true},
      {id: "download-button", parentId: "left-favorites-panel-top-row", textContent: "Download", title: "Download search results", enabled: false, eventEmitter: Events.favorites.downloadButtonClicked},
      {id: "subset-button", parentId: "left-favorites-panel-top-row", textContent: "Set Subset", title: "Make the current search results the entire set of results to search from", enabled: false, eventEmitter: Events.favorites.searchSubset},
      {id: "stop-subset-button", parentId: "left-favorites-panel-top-row", textContent: "Stop Subset", title: "Stop subset and return entire set of results to all favorites", enabled: false, eventEmitter: Events.favorites.stopSearchSubset},
      {id: "reset-button", parentId: "left-favorites-panel-top-row", textContent: "Reset", title: "Delete cached favorites and reset preferences", action: "reset", enabled: true}
    ],
    /** @type {ElementTemplateParams<Boolean>[]} */
    "checkboxOption": [
      {id: "options", parentId: "bottom-panel-1", textContent: "More Options", title: "Show more options", action: "toggleOptions", enabled: true, preference: Preferences.showOptions, hotkey: "O", invokeActionOnCreation: true, savePreference: true},
      {id: "show-ui", parentId: "show-ui-wrapper", textContent: "UI", title: "Toggle UI", action: "toggleUI", enabled: true, preference: Preferences.showUI, hotkey: "U", invokeActionOnCreation: true, savePreference: true},
      {id: "enhance-search-pages", parentId: "favorite-options", textContent: "Enhance Search Pages", title: "Enable gallery and other features on search pages", enabled: true, preference: Preferences.enableOnSearchPages, hotkey: "", invokeActionOnCreation: false, savePreference: true},
      {id: "infinite-scroll", parentId: "favorite-options", textContent: "Infinite Scroll", title: "Use infinite scroll (waterfall) instead of pages", enabled: true, preference: Preferences.infiniteScroll, hotkey: "", invokeActionOnCreation: false, savePreference: true, eventEmitter: Events.favorites.infiniteScrollToggled},
      {id: "show-remove-favorite-buttons", parentId: "favorite-options", textContent: "Remove Buttons", title: "Toggle remove favorite buttons", action: "toggleAddOrRemoveButtons", enabled: Flags.userIsOnTheirOwnFavoritesPage, preference: Preferences.showRemoveFavoriteButtons, hotkey: "R", invokeActionOnCreation: true, savePreference: true},
      {id: "show-add-favorite-buttons", parentId: "favorite-options", textContent: "Add Favorite Buttons", title: "Toggle add favorite buttons", action: "toggleAddOrRemoveButtons", enabled: !Flags.userIsOnTheirOwnFavoritesPage, preference: Preferences.showAddFavoriteButtons, hotkey: "R", invokeActionOnCreation: true, savePreference: true},
      {id: "exclude-blacklist", parentId: "favorite-options", textContent: "Exclude Blacklist", title: "Exclude favorites with blacklisted tags from search", enabled: Flags.userIsOnTheirOwnFavoritesPage, preference: Preferences.excludeBlacklist, hotkey: "", invokeActionOnCreation: false, savePreference: true, eventEmitter: Events.favorites.blacklistToggled},
      {id: "fancy-thumb-hovering", parentId: "favorite-options", textContent: "Fancy Hovering", title: "Enable fancy thumbnail hovering", action: "toggleFancyThumbHovering", enabled: false, preference: Preferences.fancyThumbHovering, hotkey: "", invokeActionOnCreation: true, savePreference: true},
      {id: "show-hints", parentId: "favorite-options", textContent: "Hotkey Hints", title: "Show hotkeys", action: "toggleOptionHotkeyHints", enabled: true, preference: Preferences.showHints, hotkey: "H", invokeActionOnCreation: true, savePreference: true},
      {id: "toggle-header", parentId: "dynamic-favorite-options", textContent: "Header", title: "Toggle site header", action: "toggleHeader", enabled: true, preference: Preferences.showHeader, hotkey: "", invokeActionOnCreation: true, savePreference: true},
      {id: "show-tooltips", parentId: "dynamic-favorite-options", textContent: "Tooltips", title: "Show tags when hovering over a thumbnail and see which ones were matched by a search", enabled: Flags.tooltipEnabled, preference: Preferences.showTooltip, hotkey: "T", invokeActionOnCreation: true, savePreference: true, eventEmitter: Events.favorites.tooltipsToggled},
      {id: "dark-theme", parentId: "favorite-options", textContent: "Dark Theme", title: "Toggle dark theme", action: "toggleDarkTheme", enabled: true, defaultValue: Utils.usingDarkTheme(), hotkey: "", invokeActionOnCreation: false, savePreference: false},
      {id: "show-on-hover", parentId: "dynamic-favorite-options", textContent: "Fullscreen on Hover", title: "View full resolution images or play videos and GIFs when hovering over a thumbnail", enabled: Flags.galleryEnabled, preference: Preferences.showOnHover, hotkey: "", invokeActionOnCreation: false, savePreference: true, eventEmitter: Events.favorites.showOnHoverToggled},
      {id: "show-captions", parentId: "dynamic-favorite-options", textContent: "Details", title: "Show details when hovering over thumbnail", enabled: Flags.captionsEnabled, preference: Preferences.showCaptions, hotkey: "D", invokeActionOnCreation: false, savePreference: true, eventEmitter: Events.favorites.captionsToggled},
      {id: "enable-autoplay", parentId: "dynamic-favorite-options", textContent: "Autoplay", title: "Enable autoplay in gallery", enabled: Flags.galleryEnabled, preference: Preferences.autoplayActive, hotkey: "", invokeActionOnCreation: false, savePreference: true, eventEmitter: Events.favorites.autoplayToggled},
      {id: "use-aliases", parentId: "dynamic-favorite-options", textContent: "Aliases", title: "Alias similar tags", enabled: false, preference: Preferences.tagAliasing, hotkey: "A", invokeActionOnCreation: false, savePreference: true},
      {id: "show-saved-search-suggestions", parentId: "dynamic-favorite-options", textContent: "Saved Suggestions", title: "Show saved search suggestions in autocomplete dropdown", enabled: false, preference: Preferences.savedSearchSuggestions, hotkey: "", invokeActionOnCreation: false, savePreference: true},
      {id: "show-saved-searches", parentId: "bottom-panel-2", textContent: "Saved Searches", title: "Show saved searches", enabled: true, preference: Preferences.showSavedSearches, hotkey: "", invokeActionOnCreation: true, savePreference: true, eventEmitter: Events.favorites.savedSearchesToggled},
      {id: "enable-gallery-menu", parentId: "dynamic-favorite-options", textContent: "Gallery Menu", title: "Show menu in gallery", action: "toggleGalleryMenu", enabled: Flags.galleryEnabled && Settings.galleryMenuEnabled, preference: Preferences.galleryMenuEnabled, hotkey: "", invokeActionOnCreation: false, savePreference: true}
    ],
    /** @type {(ElementTemplateParams<MetadataMetric> | ElementTemplateParams<FavoriteLayout> | ElementTemplateParams<PerformanceProfile>)[]} */
    "select": [
      {
        id: "sorting-method", parentId: "sort-inputs", title: "Change sorting order of search results", position: "beforeend", invokeActionOnCreation: false, preference: Preferences.sortingMethod, eventEmitter: Events.favorites.sortingMethodChanged,
        optionPairs:
        {
          default: "Default",
          score: "Score",
          width: "Width",
          height: "Height",
          creationTimestamp: "Date Uploaded",
          lastChangedTimestamp: "Date Changed",
          id: "ID",
          random: "Random"
        }
      },
      {
        id: "layout-select", parentId: "layout-container", title: "Change layout", position: "beforeend", invokeActionOnCreation: true, preference: Preferences.layout, eventEmitter: Events.favorites.layoutChanged,
        optionPairs:
        {
          column: "Waterfall",
          row: "River",
          square: "Square",
          grid: "Legacy"
        }
      },
      {
        id: "performance-profile", parentId: "performance-profile-container", title: "Improve performance by disabling features", position: "beforeend", invokeActionOnCreation: false, preference: Preferences.performanceProfile, eventEmitter: Events.favorites.performanceProfileChanged,
        optionPairs:
        {
          0: "Normal",
          1: "Low (no gallery)",
          2: "Potato (only search)"
        }
      }
    ],
    /** @type {ElementTemplateParams<Boolean>[]} */
    "checkbox": [{id: "sort-ascending", parentId: "sort-inputs", position: "beforeend", hotkey: "", invokeActionOnCreation: false, savePreference: true, preference: Preferences.sortAscending, eventEmitter: Events.favorites.sortAscendingToggled}],
    /** @type {ElementTemplateParams<Number>[]} */
    "numberComponent": [
      {id: "column-count", parentId: "column-count-container", position: "beforeend", preference: Preferences.columnCount, min: FavoritesSettings.columnCountBounds.min, max: FavoritesSettings.columnCountBounds.max, step: 1, pollingTime: 50, invokeActionOnCreation: true, eventEmitter: Events.favorites.columnCountChanged},
      {id: "row-size", parentId: "row-size-container", position: "beforeend", preference: Preferences.rowSize, min: FavoritesSettings.rowSizeBounds.min, max: FavoritesSettings.rowSizeBounds.max, step: 1, pollingTime: 50, invokeActionOnCreation: true, eventEmitter: Events.favorites.rowSizeChanged},
      {id: "results-per-page", parentId: "results-per-page-container", position: "beforeend", preference: Preferences.resultsPerPage, min: FavoritesSettings.resultsPerPageBounds.min, max: FavoritesSettings.resultsPerPageBounds.max, step: FavoritesSettings.resultsPerPageStep, pollingTime: 50, invokeActionOnCreation: false, eventEmitter: Events.favorites.resultsPerPageChanged}
    ]
  };

  constructor() {
    Utils.createDynamicElements(this.template);
    this.setupWhatsNewMenu();
    this.setupFindFavorite();
  }

  setupWhatsNewMenu() {
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

  setupFindFavorite() {
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
