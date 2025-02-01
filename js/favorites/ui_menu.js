class FavoritesMenuUI {
  static setup() {
    if (Utils.onMobileDevice()) {
      FavoritesMenuMobileUI.create();
    } else {
      FavoritesMenuDesktopUI.create();
    }
  }
}

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
      {id: "show-ui", parentId: "show-ui-wrapper", textContent: "UI", title: "Toggle UI", action: "toggleUI", enabled: true, defaultValue: true, hotkey: "U", invokeActionOnCreation: true, savePreference: true},
      {id: "enhance-search-pages", parentId: "favorite-options", textContent: "Enhance Search Pages", title: "Enable gallery and other features on search pages", action: "not needed", enabled: true, defaultValue: false, hotkey: "", invokeActionOnCreation: false, savePreference: true},
      {id: "show-remove-favorite-buttons", parentId: "favorite-options", textContent: "Remove Buttons", title: "Toggle remove favorite buttons", action: "toggleAddOrRemoveButtons", enabled: Utils.userIsOnTheirOwnFavoritesPage(), defaultValue: false, hotkey: "R", invokeActionOnCreation: true, savePreference: true, handler: "uiController"},
      {id: "show-add-favorite-buttons", parentId: "favorite-options", textContent: "Add Favorite Buttons", title: "Toggle add favorite buttons", action: "toggleAddOrRemoveButtons", enabled: !Utils.userIsOnTheirOwnFavoritesPage(), defaultValue: true, hotkey: "R", invokeActionOnCreation: true, savePreference: true, handler: "uiController"},
      {id: "exclude-blacklist", parentId: "favorite-options", textContent: "Exclude Blacklist", title: "Exclude favorites with blacklisted tags from search", action: "toggleBlacklist", enabled: Utils.userIsOnTheirOwnFavoritesPage(), defaultValue: false, hotkey: "", invokeActionOnCreation: false, savePreference: true},
      {id: "fancy-thumb-hovering", parentId: "favorite-options", textContent: "Fancy Hovering", title: "Enable fancy thumbnail hovering", action: "toggleFancyThumbHovering", enabled: true, defaultValue: false, hotkey: "", invokeActionOnCreation: true, savePreference: true, handler: "uiController"},
      {id: "statistic-hint", parentId: "favorite-options", textContent: "Show Statistics", title: "Show statistics for each favorite", action: "none", enabled: false, defaultValue: false, hotkey: "S", invokeActionOnCreation: false, savePreference: true},
      {id: "show-hints", parentId: "favorite-options", textContent: "Hotkey Hints", title: "Show hotkeys", action: "toggleOptionHotkeyHints", enabled: true, defaultValue: false, hotkey: "H", invokeActionOnCreation: true, savePreference: true, handler: "uiController"},
      {id: "dark-theme", parentId: "favorite-options", textContent: "Dark Theme", title: "Toggle dark theme", action: "toggleDarkTheme", enabled: true, defaultValue: Utils.usingDarkTheme(), hotkey: "", invokeActionOnCreation: false, savePreference: false, handler: "uiController"}
    ],
    "select": [
      {id: "sorting-method", parentId: "sort-container", title: "Change sorting order of search results", action: "onSortingParametersChanged", position: "beforeend", invokeActionOnCreation: false, optionPairs: [["default", "Default"], ["score", "Score"], ["width", "Width"], ["height", "Height"], ["creationTimestamp", "Date Uploaded"], ["lastChangedTimestamp", "Date Changed"], ["random", "Random"]]},
      {id: "layout-select", parentId: "layout-container", title: "Change layout", action: "changeLayout", position: "beforeend", invokeActionOnCreation: true, optionPairs: [["masonry", "Masonry (Vertical)"], ["row", "Row (Horizontal)"], ["grid", "Grid (Legacy)"]]},
      {id: "performance-profile", parentId: "performance-profile-container", title: "Improve performance by disabling features", action: "changePerformanceProfile", position: "beforeend", invokeActionOnCreation: false, optionPairs: [["0", "Normal"], ["1", "Low (no gallery)"], ["2", "Potato (only search)"]], handler: "uiController"}
    ],
    "checkbox": [{id: "sort-ascending", parentId: "sort-container", action: "onSortingParametersChanged", position: "beforeend", hotkey: "", invokeActionOnCreation: false, savePreference: true, defaultValue: false}],
    "numberComponent": [
      {id: "column-count", parentId: "column-count-container", position: "beforeend", action: "changeColumnCount", defaultValue: 6, min: 1, max: 20, step: 1, pollingTime: 50, invokeActionOnCreation: true},
      {id: "results-per-page", parentId: "results-per-page-container", position: "beforeend", action: "changeResultsPerPage", defaultValue: 20, min: 50, max: 500, step: 50, pollingTime: 50, invokeActionOnCreation: false}
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

class FavoritesMenuMobileUI {
  static template = {
  };

  static create() {
    FavoritesMenuMobileUI.addStyles();
    Utils.createDynamicElements(FavoritesMenuMobileUI.template);
  }

  static addStyles() {
    Utils.insertStyleHTML(`
      #performance-profile-container,
      #show-hints-container,
      #whats-new-link,
      #show-ui-div,
      #search-header,
      #left-favorites-panel-top-row  {
        display: none !important;
      }

      #favorites-pagination-container>button {
        &:active, &:focus {
          background-color: slategray;
        }

        &:hover {
          background-color: transparent;
        }
      }

      .thumb,
      .favorite {
        >div>canvas {
          display: none;
        }
      }

      #more-options-label {
        margin-left: 6px;
      }

      .checkbox {
        margin-bottom: 8px;

        input[type="checkbox"] {
          margin-right: 10px;
        }
      }

      #mobile-container {
        position: fixed !important;
        z-index: 30;
        width: 100vw;
        top: 0px;
        left: 0px;
      }

      #favorites-search-gallery-menu-panels {
        display: block !important;
      }

      #right-favorites-panel {
        margin-left: 0px !important;
      }

      #left-favorites-panel-bottom-row {
        margin: 4px 0px 0px 0px !important;
      }

      #additional-favorite-options-container {
        margin-right: 5px;
      }

      #favorites-search-gallery-content {
        grid-gap: 1.2cqw;
      }

      #favorites-search-gallery-menu {
        padding: 7px 5px 5px 5px;
        top: 0;
        left: 0;
        width: 100vw;


        &.fixed {
          position: fixed;
          margin-top: 0;
        }
      }

      #favorites-load-status-label {
        display: inline;
      }

      textarea {
        border-radius: 0px;
        height: 50px;
        padding: 8px 0px 8px 10px !important;
      }

      body {
        width: 100% !important;
      }

      #favorites-pagination-container>button {
        text-align: center;
        font-size: 16px;
        height: 30px;
      }

      #goto-page-input {
        top: -1px;
        position: relative;
        height: 25px;
        width: 1em !important;
        text-align: center;
        font-size: 16px;
      }

      #goto-page-button {
        display: none;
        height: 36px;
        position: absolute;
        margin-left: 5px;
      }

      #additional-favorite-options {
        .number {
          display: none;
        }
      }

      #results-per-page-container {
        margin-bottom: 10px;
      }

      #bottom-panel-3,
      #bottom-panel-4 {
        flex: none !important;
      }

      #bottom-panel-2 {
        padding-top: 8px;
      }

      #rating-container {
        position: relative;
        left: -5px;
        top: -2px;
        display: none;
      }

      #favorites-pagination-container>button {
        &[disabled] {
          opacity: 0.25;
          pointer-events: none;
        }
      }

      html {
        -webkit-tap-highlight-color: transparent;
        -webkit-text-size-adjust: 100%;
      }

      #additional-favorite-options {
        select {
          width: 120px;
        }
      }

      .add-or-remove-button {
        filter: none;
        width: 60%;
      }

      #left-favorites-panel-bottom-row {
        height: ${FavoritesMenu.settings.mobileMenuExpandedHeight}px;
        overflow: hidden;
        transition: height 0.2s ease;
        -webkit-transition: height 0.2s ease;
        -moz-transition: height 0.2s ease;
        -ms-transition: height 0.2s ease;
        -o-transition: height 0.2s ease;
        transition: height 0.2s ease;

        &.hidden {
          height: 0px;
        }
      }

      #favorites-search-gallery-content.sticky {
        transition: margin 0.2s ease;
      }

      #autoplay-settings-menu {
        >div {
          font-size: 14px !important;
        }
      }

      #results-columns-container {
        margin-top: -6px;
      }
          `, "mobile");
    Utils.insertStyleHTML(`
        #mobile-toolbar-row {
            display: flex;
            align-items: center;
            background: none;

            svg {
                fill: black;
                -webkit-transition: none;
                transition: none;
                transform: scale(0.85);
            }

            input[type="checkbox"]:checked + label {
                svg {
                    fill: #0075FF;
                }
                color: #0075FF;
            }

            .dark-green-gradient {
              svg {
                fill: white;
              }
            }
        }
        .search-bar-container {
            align-content: center;
            width: 100%;
            height: 40px;
            border-radius: 50px;
            padding-left: 10px;
            padding-right: 10px;
            flex: 1;
            background: white;

            &.dark-green-gradient {
              background: #303030;
            }
        }

        .search-bar-items {
            display: flex;
            align-items: center;
            height: 100%;
            width: 100%;

            > div {
                flex: 0;
                min-width: 40px;
                width: 100%;
                height: 100%;
                display: block;
                align-content: center;
            }
        }

        .search-icon-container {
            flex: 0;
            min-width: 40px;
        }

        .search-bar-input-container {
            flex: 1 !important;
            display: flex;
            width: 100%;
            height: 100%;
        }

        .search-bar-input {
            flex: 1;
            border: none;
            box-sizing: content-box;
            height: 100%;
            padding: 0;
            margin: 0;
            outline: none !important;
            border: none !important;
            font-size: 14px !important;
            width: 100%;

            &:focus, &:focus-visible {
                background: none !important;
                border: none !important;
                outline: none !important;
            }
        }

        .search-clear-container {
            visibility: hidden;

            svg {
              transition: none !important;
              transform: scale(0.6) !important;
            }
        }

        .circle-icon-container {
            padding: 0;
            margin: 0;
            align-content: center;
            border-radius: 50%;

            &:active {
                background-color: #0075FF;
            }
        }

        #options-checkbox {
            display: none;
        }

        .mobile-toolbar-checkbox-label {
            width: 100%;
            height: 100%;
            display: block;
        }

        #reset-button {
          transition: none !important;
          height: 100%;

          >svg {
            transition: none !important;
            transform: scale(0.65);
          }

          &:active {
            svg {
              fill: #0075FF;
            }
          }
        }

        #help-button {
          height: 100%;

          >svg {
            transform: scale(0.75);
          }
        }

        .
        `, "mobile-toolbar");
  }

}
