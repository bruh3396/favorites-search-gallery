class FavoritesMenuMobileUI {
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
    "toggleSwitch": [
      {id: "show-remove-favorite-buttons", parentId: "favorite-options", textContent: "Remove Buttons", title: "Toggle remove favorite buttons", action: "toggleAddOrRemoveButtons", enabled: Flags.userIsOnTheirOwnFavoritesPage, preference: Preferences.showRemoveFavoriteButtons, hotkey: "R", invokeActionOnCreation: true, savePreference: true, handler: "uiController"},
      {id: "show-add-favorite-buttons", parentId: "favorite-options", textContent: "Add Favorite Buttons", title: "Toggle add favorite buttons", action: "toggleAddOrRemoveButtons", enabled: !Flags.userIsOnTheirOwnFavoritesPage, preference: Preferences.showAddFavoriteButtons, hotkey: "R", invokeActionOnCreation: true, savePreference: true, handler: "uiController"},
      {id: "exclude-blacklist", parentId: "favorite-options", textContent: "Exclude Blacklist", title: "Exclude favorites with blacklisted tags from search", action: "toggleBlacklist", enabled: Flags.userIsOnTheirOwnFavoritesPage, preference: Preferences.excludeBlacklist, hotkey: "", invokeActionOnCreation: false, savePreference: true},
      {id: "dark-theme", parentId: "favorite-options", textContent: "Dark Theme", title: "Toggle dark theme", action: "toggleDarkTheme", enabled: true, defaultValue: Utils.usingDarkTheme(), hotkey: "", invokeActionOnCreation: false, savePreference: false, handler: "uiController"}
    ],
    "select": [
      {
        id: "sorting-method", parentId: "sort-container", title: "Change sorting order of search results", action: "updateSortingMethod", position: "beforeend", invokeActionOnCreation: false, preference: Preferences.sortingMethod,
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
        id: "results-per-page", parentId: "results-per-page-container", title: "Change results per page", action: "none", position: "beforeend", invokeActionOnCreation: true, handler: "uiController", preference: Preferences.resultsPerPage,
        optionPairs:
          [
            ["50", "50"],
            ["100", "100"],
            ["200", "200"],
            ["500", "500"],
            ["1000", "1000"],
            ["2000", "2000"],
            ["5000", "5000"]
          ]
      },
      {
        id: "column-count", parentId: "column-count-container", title: "Change column count", action: "none", position: "beforeend", invokeActionOnCreation: true, handler: "uiController", preference: Preferences.columnCount,
        optionPairs:
          [
            ["1", "1"],
            ["2", "3"],
            ["3", "3"],
            ["4", "4"],
            ["5", "5"],
            ["6", "6"],
            ["7", "7"],
            ["8", "8"],
            ["9", "9"],
            ["10", "10"]
          ]
      },
      {
        id: "layout-select", parentId: "layout-container", title: "Change layout", action: "changeLayout", position: "beforeend", invokeActionOnCreation: true, preference: Preferences.favoriteLayout,
        optionPairs: [
          ["column", "Column"],
          ["row", "River"],
          ["grid", "Grid"]
        ],
        handler: "uiController"
      }
    ],
    "checkbox": [{id: "sort-ascending", parentId: "sort-container", action: "toggleSortAscending", position: "beforeend", hotkey: "", invokeActionOnCreation: false, savePreference: true, preference: Preferences.sortAscending}]
  };

  static create() {
    FavoritesMenuMobileUI.addStyles();
    Utils.createDynamicElements(FavoritesMenuMobileUI.template);
  }

  static addStyles() {
    Utils.insertStyleHTML(`
      #left-favorites-panel-bottom-row {
        height: ${FavoritesMenu.settings.mobileMenuExpandedHeight}px;
      }
          `, "left-bottom-row");
  }

  static setupStickyMenu() {
    const header = document.getElementById("header");
    const headerHeight = header === null ? 0 : header.getBoundingClientRect().height;

    window.addEventListener("scroll", async() => {
      if (window.scrollY > headerHeight && document.getElementById("sticky-header-fsg-style") === null) {
        Utils.insertStyleHTML(
          `
          #favorites-search-gallery-menu {
              position: fixed;
              margin-top: 0;
          }`,
          "sticky-header"
        );
        this.updateOptionContentMargin();
        await Utils.sleep(1);
        document.getElementById("favorites-search-gallery-content").classList.add("sticky");

      } else if (window.scrollY <= headerHeight && document.getElementById("sticky-header-fsg-style") !== null) {
        document.getElementById("sticky-header-fsg-style").remove();
        document.getElementById("favorites-search-gallery-content").classList.remove("sticky");
        this.removeOptionContentMargin();
      }
    }, {
      passive: true
    });
  }

}
