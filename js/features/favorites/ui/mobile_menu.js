class FavoritesMobileMenu {
  /* eslint-disable object-property-newline */
  /* eslint-disable object-curly-newline */
  template = {
    /** @type {ElementTemplateParams<any>[]} */
    "button": [
      {id: "search-button", parentId: "left-favorites-panel-top-row", textContent: "Search", title: "Search favorites\nctrl+click/right-click: Search all of rule34 in a new tab", enabled: true},
      {id: "shuffle-button", parentId: "left-favorites-panel-top-row", textContent: "Shuffle", title: "Randomize order of search results", enabled: true},
      {id: "invert-button", parentId: "left-favorites-panel-top-row", textContent: "Invert", title: "Show results not matched by latest search", enabled: true},
      {id: "clear-button", parentId: "left-favorites-panel-top-row", textContent: "Clear", title: "Empty the search box", enabled: true},
      {id: "reset-button", parentId: "left-favorites-panel-top-row", textContent: "Reset", title: "Delete cached favorites and reset preferences", enabled: true}
    ],
    /** @type {ElementTemplateParams<Boolean>[]} */
    "toggleSwitch": [
      {id: "show-remove-favorite-buttons", parentId: "favorite-options", textContent: "Remove Buttons", title: "Toggle remove favorite buttons", enabled: Flags.userIsOnTheirOwnFavoritesPage, preference: Preferences.showRemoveFavoriteButtons, hotkey: "R", invokeActionOnCreation: true, savePreference: true},
      {id: "show-add-favorite-buttons", parentId: "favorite-options", textContent: "Add Favorite Buttons", title: "Toggle add favorite buttons", enabled: !Flags.userIsOnTheirOwnFavoritesPage, preference: Preferences.showAddFavoriteButtons, hotkey: "R", invokeActionOnCreation: true, savePreference: true},
      {id: "exclude-blacklist", parentId: "favorite-options", textContent: "Exclude Blacklist", title: "Exclude favorites with blacklisted tags from search", enabled: Flags.userIsOnTheirOwnFavoritesPage, preference: Preferences.excludeBlacklist, hotkey: "", invokeActionOnCreation: false, savePreference: true},
      {id: "sort-ascending", parentId: "sort-inputs", position: "beforeend", hotkey: "", invokeActionOnCreation: false, savePreference: true, preference: Preferences.sortAscending, useContainer: false},
      {id: "dark-theme", parentId: "favorite-options", textContent: "Dark Theme", title: "Toggle dark theme", enabled: true, defaultValue: Utils.usingDarkTheme(), hotkey: "", invokeActionOnCreation: false, savePreference: false}
    ],
    /** @type {(ElementTemplateParams<MetadataMetric> | ElementTemplateParams<FavoriteLayout> | ElementTemplateParams<Number>)[]} */
    "select": [
      {
        id: "sorting-method", parentId: "sort-inputs", title: "Change sorting order of search results", position: "afterbegin", invokeActionOnCreation: false, preference: Preferences.sortingMethod, event: Events.favorites.sortingMethodChanged,
        optionPairs:
        {
          default: "Default",
          score: "Score",
          width: "Width",
          height: "Height",
          creationTimestamp: "Date Uploaded",
          lastChangedTimestamp: "Date Changed",
          random: "Random",
          id: "ID"
        }
      },
      {
        id: "results-per-page", parentId: "results-per-page-container", title: "Change results per page", position: "beforeend", invokeActionOnCreation: true, preference: Preferences.resultsPerPage, event: Events.favorites.resultsPerPageChanged,
        optionPairs:
        {
          5: "5",
          10: "10",
          20: "20",
          50: "50",
          100: "100",
          200: "200",
          500: "500",
          1000: "1000"
        }
      },
      {
        id: "column-count", parentId: "column-count-container", title: "Change column count", position: "beforeend", invokeActionOnCreation: true, preference: Preferences.columnCount, event: Events.favorites.columnCountChanged,
        optionPairs:
        {
          1: "1",
          2: "2",
          3: "3",
          4: "4",
          5: "5",
          6: "6",
          7: "7",
          8: "8",
          9: "9",
          10: "10"
        }
      },
      {
        id: "layout-select", parentId: "layout-container", title: "Change layout", position: "beforeend", invokeActionOnCreation: true, preference: Preferences.layout, enabled: false,
        optionPairs:
        {
          row: "River",
          square: "Square",
          grid: "Grid",
          column: "Waterfall"
        }

      }
    ],
    "checkbox": []
  };

  constructor() {
    Utils.createDynamicElements(this.template);
    this.setupSearchBar();
  }

  setupStickyMenu() {
    // const header = document.getElementById("header");
    // const headerHeight = header === null ? 0 : header.getBoundingClientRect().height;

    window.addEventListener("scroll", async() => {
      // if (window.scrollY > headerHeight && document.getElementById("sticky-header-fsg-style") === null) {
      //   Utils.insertStyleHTML(
      //     `
      //     #favorites-search-gallery-menu {
      //         position: fixed;
      //         margin-top: 0;
      //     }`,
      //     "sticky-header"
      //   );
      //   this.updateOptionContentMargin();
      //   await Utils.sleep(1);
      //   document.getElementById("favorites-search-gallery-content").classList.add("sticky");

      // } else if (window.scrollY <= headerHeight && document.getElementById("sticky-header-fsg-style") !== null) {
      //   document.getElementById("sticky-header-fsg-style").remove();
      //   document.getElementById("favorites-search-gallery-content").classList.remove("sticky");
      //   this.removeOptionContentMargin();
      // }
    }, {
      passive: true
    });
  }

   setupSearchBar() {
    this.setupOptions();
    this.setupResetButton();
  }

   setupOptions() {
    const optionsCheckbox = document.getElementById("options-checkbox");
    const options = document.getElementById("left-favorites-panel-bottom-row");

    if (optionsCheckbox === null || options === null) {
      return;
    }
    optionsCheckbox.onclick = () => {
      options.classList.toggle("hidden");
    };
  }

   setupResetButton() {
    // const resetButton = document.getElementById("reset-button");

    // if (resetButton === null) {
    //   return;
    // }
    // // console.log({resetButton});
    // resetButton.onclick = () => {
    //   // console.log("Reset button clicked");
    //   Utils.deletePersistentData();
    // };
  }
}
