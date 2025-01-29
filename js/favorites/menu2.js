/* eslint-disable object-property-newline */
/* eslint-disable object-curly-newline */
class FavoritesMenuState {
  static state = {
    get searchQuery() {
      return this.searchBox === null ? "" : this.searchBox.value;
    },
    searchHistory: [],
    searchHistoryIndex: -1,
    lastEditedSearchQuery: "",
    searchBox: null
  };

  static settings = {
    maxSearchHistoryLength: 50
  };

  static loadState() {
    FavoritesMenuState.loadSearchHistory();
    FavoritesMenuState.loadLastEditedSearchQuery();
  }

  static loadSearchHistory() {
    FavoritesMenuState.state.searchHistory = JSON.parse(localStorage.getItem("searchHistory")) || [];
  }

  static loadLastEditedSearchQuery() {
    FavoritesMenuState.state.lastEditedSearchQuery = localStorage.getItem("lastEditedSearchQuery") || "";
  }

  static getLatestSearchQuery() {

  }

  /**
   * @param {String} searchQuery
   */
  static addSearchToHistory(searchQuery) {
    if (Utils.isEmptyString(searchQuery)) {
      return;
    }
    const searchHistory = FavoritesMenuState.state.searchHistory;
    const cleanedSearchQuery = Utils.removeExtraWhiteSpace(searchQuery);
    const searchHistoryWithoutQuery = searchHistory.filter(search => search !== cleanedSearchQuery);
    const searchHistoryWithQueryAtFront = [searchQuery].concat(searchHistoryWithoutQuery);
    const truncatedSearchHistory = searchHistoryWithQueryAtFront.slice(0, FavoritesMenuState.settings.maxSearchHistoryLength);

    FavoritesMenuState.state.searchHistory = truncatedSearchHistory;
  }

  static saveSearchHistory() {
    localStorage.setItem("searchHistory", JSON.stringify(FavoritesMenuState.state.searchHistory));
  }

  static updateLastEditedSearchQuery(searchQuery) {
    FavoritesMenuState.state.lastEditedSearchQuery = searchQuery;
    localStorage.setItem("lastEditedSearchQuery", FavoritesMenuState.state.lastEditedSearchQuery);
  }

  static resetSearchHistoryIndex() {
    FavoritesMenuState.state.searchHistoryIndex = -1;
  }

  static incrementSearchHistoryIndex() {
    const nextIndex = FavoritesMenuState.state.searchHistoryIndex + 1;

    if (nextIndex < FavoritesMenuState.state.searchHistory.length) {
      FavoritesMenuState.state.searchHistoryIndex = nextIndex;
    }
  }

  static decrementSearchHistoryIndex() {
    const previousIndex = FavoritesMenuState.state.searchHistoryIndex - 1;

    FavoritesMenuState.state.searchHistoryIndex = Math.max(previousIndex, -1);
  }
}

class UIFactory {
  static createButton({id, parentId, position = "afterbegin", textContent, title, action}) {
    document.getElementById(parentId)
      .insertAdjacentHTML(position, `<button id="${id}" title="${title}" data-action="${action}">${textContent}</button>`);
  }

  static createCheckboxOption({id, parentId, position = "afterbegin", textContent, title, action, defaultValue, hotkey, invokeActionOnCreation, savePreference}) {
    const labelId = `${id}-label`;

    document.getElementById(parentId)
      .insertAdjacentHTML(
        position,
        `<div id="${id}-container">
            <label id="${labelId}" class="checkbox" title="${title}">
              <span> ${textContent}</span>
              ${hotkey === "" ? "" : `<span class="option-hint"> (${hotkey})</span>`}
            </label>
          </div>`
      );

    UIFactory.createCheckbox({id, parentId: labelId, title, action, position: "afterbegin", hotkey, defaultValue, invokeActionOnCreation, savePreference});
  }

  static createCheckbox({id, parentId, position, action, defaultValue, hotkey, invokeActionOnCreation, savePreference}) {
    document.getElementById(parentId)
      .insertAdjacentHTML(
        position,
        `<input id="${id}" type="checkbox" data-action="${action}">`
      );
    const preferenceName = Utils.convertDashedToCamelCase(id);
    const checkbox = document.getElementById(id);

    checkbox.checked = Utils.getPreference(preferenceName, defaultValue);

    if (savePreference) {
      checkbox.addEventListener("change", (event) => {
        Utils.setPreference(preferenceName, event.target.checked);
      });
    }
    FavoritesMenuEventHandler.registerCheckboxHotkey(hotkey, checkbox);

    if (invokeActionOnCreation) {
      checkbox.dispatchEvent(new Event("click", {bubbles: true}));
    }
  }

  static createMainSearchBox({id, parentId, placeholder, position}) {
    document.getElementById(parentId)
      .insertAdjacentHTML(
        position,
        `<textarea id="${id}" placeholder="${placeholder}" name="tags" spellcheck="false">${FavoritesMenuState.state.lastEditedSearchQuery}</textarea>`
      );
    const searchBox = document.getElementById(id);

    FavoritesMenuState.state.searchBox = searchBox;

    searchBox.addEventListener("updatedProgrammatically", () => {
      FavoritesMenuState.updateLastEditedSearchQuery(searchBox.value);
    });
    searchBox.addEventListener("keyup", (event) => {
      if (event.key.length === 1 || event.key === "Backspace" || event.key === "Delete") {
        FavoritesMenuState.updateLastEditedSearchQuery(searchBox.value);
      }
    });
    searchBox.addEventListener("keydown", (event) => {
      switch (event.key) {
        case "Enter":
          FavoritesMenuEventHandler.searchFromBox(event);
          break;

        case "ArrowUp":

        case "ArrowDown":
          FavoritesMenuEventHandler.navigateSearchHistory(event);
          break;

        default:
          FavoritesMenuState.resetSearchHistoryIndex();
          break;
      }
    });
  }

  static createSelect({id, parentId, optionPairs, title, action, position, invokeActionOnCreation}) {
    const optionsHTML = optionPairs
      .map(([value, text]) => `<option value="${value}">${text}</option>`)
      .join("\n");
    const selectHTML = `
      <select id="${id}" title="${title}" data-action="${action}">
        ${optionsHTML}
      </select>`;

    document.getElementById(parentId).insertAdjacentHTML(position, selectHTML);
    const select = document.getElementById(id);
    const preferenceName = Utils.convertDashedToCamelCase(id);

    select.value = Utils.getPreference(preferenceName, optionPairs[0][0]);

    if (invokeActionOnCreation) {
      select.dispatchEvent(new Event("execute", {bubbles: true}));
    }

    select.onchange = () => {
      FavoritesMenuEventHandler.invokeAction({target: select});
      Utils.setPreference(preferenceName, select.value);
    };
  }

  static createNumberComponent({id, parentId, position, action, defaultValue, min, max, step, pollingTime, invokeActionOnCreation}) {
    const preferenceName = Utils.convertDashedToCamelCase(id);
    const numberComponentId = `${id}-number`;

    defaultValue = Utils.getPreference(preferenceName, defaultValue);
    const html = `
      <span class="number" id="${numberComponentId}">
        <hold-button class="number-arrow-down" pollingtime="${pollingTime}">
          <span>&lt;</span>
        </hold-button>
        <input id="${id}" data-action="${action}" type="number" min="${min}" max="${max}" step="${step}" defaultValue="${Utils.getPreference(preferenceName, defaultValue)}">
        <hold-button class="number-arrow-up" pollingtime="${pollingTime}">
          <span>&gt;</span>
        </hold-button>
      </span>
    `;

    document.getElementById(parentId)
      .insertAdjacentHTML(position, html);

    const numberComponent = new NumberComponent(document.getElementById(numberComponentId));
    const numberInput = numberComponent.input;

    numberInput.value = defaultValue;
    numberInput.dispatchEvent(new KeyboardEvent("keydown", {key: "Enter", bubbles: true}));

    if (invokeActionOnCreation) {
      numberInput.dispatchEvent(new Event("execute", {bubbles: true}));
    }

    numberInput.onchange = () => {
      numberInput.dispatchEvent(new Event("execute", {bubbles: true}));
      Utils.setPreference(preferenceName, parseFloat(numberInput.value));
    };
  }

  static createMobileSearchBar({id, parentId, placeholder, position}) {
    const html = `
      <div id="mobile-toolbar-row" class="light-green-gradient">
          <div class="search-bar-container light-green-gradient">
              <div class="search-bar-items">
                  <div>
                      <div class="circle-icon-container">
                          <svg class="search-icon" id="search-button" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                            <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/>
                          </svg>
                      </div>
                  </div>
                  <div class="search-bar-input-container">
                      <input type="text" id="${id}" class="search-bar-input" needs-autocomplete placeholder="${placeholder}">
                  </div>
                  <div class="toolbar-button search-clear-container">
                      <div class="circle-icon-container">
                          <svg id="clear-button" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                            <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/>
                          </svg>
                      </div>
                  </div>
                  <div>
                      <input type="checkbox" id="options-checkbox">
                      <label for="options-checkbox" class="mobile-toolbar-checkbox-label">
                        <svg id="options-menu-icon" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="#5f6368">
                          <path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z"/>
                        </svg>
                      </label>
                  </div>
                  <div>
                        <div id="reset-button">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor">
                            <path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-84 31.5-156.5T197-763l56 56q-44 44-68.5 102T160-480q0 134 93 227t227 93q134 0 227-93t93-227q0-67-24.5-125T707-707l56-56q54 54 85.5 126.5T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm-40-360v-440h80v440h-80Z"/>
                          </svg>
                        </div>
                  </div>
                  <div style="display: none;">
                        <div id="">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor">
                            <path d="M424-320q0-81 14.5-116.5T500-514q41-36 62.5-62.5T584-637q0-41-27.5-68T480-732q-51 0-77.5 31T365-638l-103-44q21-64 77-111t141-47q105 0 161.5 58.5T698-641q0 50-21.5 85.5T609-475q-49 47-59.5 71.5T539-320H424Zm56 240q-33 0-56.5-23.5T400-160q0-33 23.5-56.5T480-240q33 0 56.5 23.5T560-160q0 33-23.5 56.5T480-80Z"/>
                          </svg>
                        </div>
                  </div>
              </div>
          </div>
      </div>
        `;

    document.getElementById(parentId).insertAdjacentHTML(position, html);
    const searchBar = document.getElementById(id);

    searchBar.addEventListener("input", () => {
      const clearButtonContainer = document.querySelector(".search-clear-container");

      if (clearButtonContainer === null) {
        return;
      }
      const clearButtonIsHidden = getComputedStyle(clearButtonContainer).visibility === "hidden";
      const searchBarIsEmpty = searchBar.value === "";
      const styleId = "search-clear-button-visibility";

      if (searchBarIsEmpty && !clearButtonIsHidden) {
        Utils.insertStyleHTML(".search-clear-container {visibility: hidden}", styleId);
      } else if (!searchBarIsEmpty && clearButtonIsHidden) {
        Utils.insertStyleHTML(".search-clear-container {visibility: visible}", styleId);
      }
    });
  }
}

class FavoritesMenuUI {
  static setup() {
    FavoritesMenuUI.setupRatingFilter();
  }

  static createDynamicElements(template) {
    for (const [elementType, elements] of Object.entries(template)) {
      for (const element of elements.reverse()) {
        if (element.enabled !== false) {
          UIFactory[`create${Utils.capitalize(elementType)}`](element);
        }
      }
    }
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

    FavoritesMenuEventHandler.changeAllowedRatings(ratingFilter);
    ratingFilter.onclick = (event) => {
      if (!Utils.hasTagName(event.target, "label")) {
        FavoritesMenuEventHandler.changeAllowedRatings(ratingFilter);
      }
    };
  }
}

class FavoritesMenuDesktopUI {
  static template = {
    "button": [
      {id: "search-button", parentId: "left-favorites-panel-top-row", textContent: "Search", title: "Search favorites\nctrl+click/right-click: Search all of rule34 in a new tab", action: "search", enabled: true},
      {id: "shuffle-button", parentId: "left-favorites-panel-top-row", textContent: "Shuffle", title: "Randomize order of search results", action: "shuffle", enabled: true},
      {id: "invert-button", parentId: "left-favorites-panel-top-row", textContent: "Invert", title: "Show results not matched by latest search", action: "invert", enabled: true},
      {id: "clear-button", parentId: "left-favorites-panel-top-row", textContent: "Clear", title: "Empty the search box", action: "clear", enabled: true},
      {id: "reset-button", parentId: "left-favorites-panel-top-row", textContent: "Reset", title: "Delete cached favorites and reset preferences", action: "reset", enabled: true}
    ],
    "checkboxOption": [
      {id: "options", parentId: "bottom-panel-1", textContent: "More Options", title: "Show more options", action: "toggleOptions", enabled: true, defaultValue: false, hotkey: "O", invokeActionOnCreation: true, savePreference: true},
      {id: "show-ui", parentId: "show-ui-wrapper", textContent: "UI", title: "Toggle UI", action: "toggleUI", enabled: true, defaultValue: true, hotkey: "U", invokeActionOnCreation: true, savePreference: true},
      {id: "enhance-search-pages", parentId: "favorite-options", textContent: "Enhance Search Pages", title: "Enable gallery and other features on search pages", action: "none", enabled: true, defaultValue: false, hotkey: "", invokeActionOnCreation: false, savePreference: true},
      {id: "show-remove-favorite-buttons", parentId: "favorite-options", textContent: "Remove Buttons", title: "Toggle remove favorite buttons", action: "toggleAddOrRemoveButtons", enabled: Utils.userIsOnTheirOwnFavoritesPage(), defaultValue: false, hotkey: "R", invokeActionOnCreation: true, savePreference: true},
      {id: "show-add-favorite-buttons", parentId: "favorite-options", textContent: "Add Favorite Buttons", title: "Toggle add favorite buttons", action: "toggleAddOrRemoveButtons", enabled: !Utils.userIsOnTheirOwnFavoritesPage(), defaultValue: true, hotkey: "R", invokeActionOnCreation: true, savePreference: true},
      {id: "exclude-blacklist", parentId: "favorite-options", textContent: "Exclude Blacklist", title: "Exclude favorites with blacklisted tags from search", action: "toggleBlacklist", enabled: Utils.userIsOnTheirOwnFavoritesPage(), defaultValue: false, hotkey: "", invokeActionOnCreation: false, savePreference: true},
      {id: "fancy-thumb-hovering", parentId: "favorite-options", textContent: "Fancy Hovering", title: "Enable fancy thumbnail hovering", action: "toggleFancyThumbHovering", enabled: true, defaultValue: false, hotkey: "", invokeActionOnCreation: true, savePreference: true},
      {id: "statistic-hint", parentId: "favorite-options", textContent: "Show Statistics", title: "Show statistics for each favorite", action: "none", enabled: false, defaultValue: false, hotkey: "S", invokeActionOnCreation: false, savePreference: true},
      {id: "show-hints", parentId: "favorite-options", textContent: "Hotkey Hints", title: "Show hotkeys", action: "toggleOptionHotkeyHints", enabled: true, defaultValue: false, hotkey: "H", invokeActionOnCreation: true, savePreference: true},
      {id: "dark-theme", parentId: "favorite-options", textContent: "Dark Theme", title: "Toggle dark theme", action: "toggleDarkTheme", enabled: true, defaultValue: Utils.usingDarkTheme(), hotkey: "", invokeActionOnCreation: false, savePreference: false}
    ],
    "mainSearchBox": [{id: "favorites-search-box", parentId: "left-favorites-panel-top-row", placeholder: "Search favorites", position: "afterend"}],
    "select": [
      {
        id: "sorting-method", parentId: "sort-container", title: "Change sorting order of search results", action: "changeSortingParameters", position: "beforeend", invokeActionOnCreation: false,
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
        id: "layout-select", parentId: "layout-container", title: "Change layout", action: "changeLayout", position: "beforeend", invokeActionOnCreation: true,
        optionPairs: [
          ["masonry", "Vertical"],
          ["row", "Horizontal"],
          ["grid", "Grid"]
        ]
      },
      {
        id: "performance-profile", parentId: "performance-profile-container", title: "Improve performance by disabling features", action: "changePerformanceProfile", position: "beforeend", invokeActionOnCreation: false,
        optionPairs: [
          ["0", "Normal"],
          ["1", "Low (no gallery)"],
          ["2", "Potato (only search)"]
        ]
      }
    ],
    "checkbox": [
      {id: "sort-ascending", parentId: "sort-container", action: "changeSortingParameters", position: "beforeend", hotkey: "", invokeActionOnCreation: false, savePreference: true}
      // {id: "sort-ascending", parentId: "sort-container", action: "changeSortingParameters", position: "beforeend", hotkey: "", invokeActionOnCreation: false, savePreference: true}
    ],
    "numberComponent": [
      {id: "column-count", parentId: "column-count-container", position: "beforeend", action: "changeColumnCount", defaultValue: 6, min: 4, max: 20, step: 1, pollingTime: 50, invokeActionOnCreation: true},
      {id: "results-per-page", parentId: "results-per-page-container", position: "beforeend", action: "changeResultsPerPage", defaultValue: 20, min: 50, max: 500, step: 50, pollingTime: 50, invokeActionOnCreation: false}
    ]
  };

  static createUI() {
    FavoritesMenuUI.createDynamicElements(FavoritesMenuDesktopUI.template);
    FavoritesMenuDesktopUI.setupStaticElements();
  }

  static setupStaticElements() {
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
    "mobileSearchBar": [{id: "favorites-search-box", parentId: "left-favorites-panel-top-row", placeholder: "Search Favorites", position: "afterend"}]
  };

  static createUI() {
    FavoritesMenuMobileUI.addStyles();
    FavoritesMenuUI.createDynamicElements(FavoritesMenuMobileUI.template);
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

class FavoritesMenuEventHandler {
  static hotkeys = {};

  static setup() {
    FavoritesMenuEventHandler.setupMenuEvents();
    FavoritesMenuEventHandler.setupCheckboxHotkeys();
    FavoritesMenuEventHandler.setupGlobalListeners();
  }

  static setupMenuEvents() {
    document.getElementById("favorites-search-gallery-menu").addEventListener("click", (event) => {
      if (Utils.hasTagName(event.target, "label")) {
        return;
      }
      const isCheckbox = Utils.hasTagName(event.target, "input") && event.target.type === "checkbox";
      const isButton = Utils.hasTagName(event.target, "button");

      if (isCheckbox || isButton) {
        FavoritesMenuEventHandler.invokeAction(event);
      }
    });
    document.getElementById("favorites-search-gallery-menu").addEventListener("execute", (event) => {
      if (!Utils.hasTagName(event.target, "label")) {
        FavoritesMenuEventHandler.invokeAction(event);
      }
    });
  }

  /**
   * @param {String} hotkey
   * @param {String} element
   */
  static registerCheckboxHotkey(hotkey, element) {
    if (hotkey === "" || hotkey === null || hotkey === undefined) {
      return;
    }
    FavoritesMenuEventHandler.hotkeys[hotkey.toLocaleLowerCase()] = element;
  }

  static setupCheckboxHotkeys() {
    document.addEventListener("keydown", (event) => {
      const hotkey = event.key.toLowerCase();
      const target = FavoritesMenuEventHandler.hotkeys[hotkey];

      if (!Utils.isHotkeyEvent(event) || target === undefined) {
        return;
      }
      target.checked = !target.checked;
      FavoritesMenuEventHandler.invokeAction({target});
    });
  }

  static setupGlobalListeners() {
    FavoritesMenuEventHandler.setupQuickSearchForTag();
    FavoritesMenuEventHandler.changeColumnCountOnShiftScroll();
    FavoritesMenuEventHandler.updateMasonryOnWindowWidthChange();
  }

  static setupQuickSearchForTag() {
    window.addEventListener("searchForTag", (event) => {
      const searchBox = FavoritesMenuState.state.searchBox;

      if (searchBox !== null) {
        searchBox.value = event.detail;
        FavoritesMenuEventHandler.search({ctrlKey: false});
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

      if (columnInput === null) {
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
      columnInput.value = parseInt(columnInput.value) + columnAddend;
      columnInput.dispatchEvent(new KeyboardEvent("keydown", {key: "Enter", bubbles: true}));
      columnInput.dispatchEvent(new Event("change", {bubbles: true}));
    }, {
      passive: true
    });
  }

  static updateMasonryOnWindowWidthChange() {
    window.addEventListener("resize", () => {
      const columnCount = document.getElementById("column-count");

      if (columnCount !== null) {
        FavoritesMenuEventHandler.changeColumnCount({target: columnCount});
      }
    }, {passive: true});
  }

  /**
   * @param {Event} event
   */
  static invokeAction(event) {
    const action = event.target.dataset.action;

    if (action !== null && action !== undefined && FavoritesMenuEventHandler[action] !== undefined) {
      FavoritesMenuEventHandler[action](event);
    }
  }

  static invokeFavoritesLoaderFunction(func, args) {
    Utils.broadcastEvent("favoritesLoader", {func, args});
  }

  static broadcastFavoritesLoaderOptionChanged(option, value) {
    FavoritesMenuEventHandler.invokeFavoritesLoaderFunction("onOptionChanged", {option, value});
  }

  static search(event) {
    const searchQuery = FavoritesMenuState.state.searchQuery;

    if (event.ctrlKey) {
      Utils.openSearchPage(searchQuery);
    } else {
      FavoritesMenuEventHandler.invokeFavoritesLoaderFunction("searchFavorites", searchQuery);
      FavoritesMenuState.addSearchToHistory(searchQuery);
      FavoritesMenuState.saveSearchHistory();
      FavoritesMenuState.updateLastEditedSearchQuery(searchQuery);
    }
  }

  static shuffle() {
    FavoritesMenuEventHandler.invokeFavoritesLoaderFunction("shuffleSearchResults");
  }

  static invert() {
    FavoritesMenuEventHandler.invokeFavoritesLoaderFunction("invertSearchResults");
  }

  static clear() {
    const searchBox = document.getElementById(Utils.mainSearchBoxId);

    if (searchBox !== null) {
      Utils.setMainSearchBoxValue("");
    }
  }

  static reset() {
    Utils.deletePersistentData();
  }

  static searchFromBox(event) {
    const searchBox = event.target;

    if (Utils.awesompleteIsUnselected(searchBox)) {
      event.preventDefault();
      FavoritesMenuEventHandler.search(event);
    } else {
      Utils.clearAwesompleteSelection(searchBox);
    }
  }

  static searchFromButton(event) {
    const searchQuery = FavoritesMenuState.state.searchQuery;

    if (event.ctrlKey) {
      const queryWithFormattedIds = searchQuery.replace(/(?:^|\s)(\d+)(?:$|\s)/g, " id:$1 ");

      Utils.openSearchPage(queryWithFormattedIds);
    } else {
      Utils.hideAwesomplete(FavoritesMenuState.state.searchBox);
      FavoritesMenuEventHandler.search({target: event.target});
    }
  }

  static navigateSearchHistory(event) {
    const searchBox = event.target;

    if (Utils.awesompleteIsVisible(searchBox)) {
      return;
    }
    event.preventDefault();
    const searchHistory = FavoritesMenuState.state.searchHistory;

    if (event.key === "ArrowUp") {
      FavoritesMenuState.incrementSearchHistoryIndex();
    } else {
      FavoritesMenuState.decrementSearchHistoryIndex();
    }
    const index = FavoritesMenuState.state.searchHistoryIndex;

    searchBox.value = searchHistory[index] || FavoritesMenuState.state.lastEditedSearchQuery;
  }

  static toggleOptions(event) {
    const checked = event.target.checked;

    if (Utils.onMobileDevice()) {
      document.getElementById("left-favorites-panel-bottom-row").classList.toggle("hidden", !checked);

      const mobileButtonRow = document.getElementById("mobile-button-row");

      if (mobileButtonRow !== null) {
        mobileButtonRow.style.display = checked ? "" : "none";
      }
    } else {
      document.querySelectorAll(".options-container").forEach((option) => {
        option.style.display = checked ? "block" : "none";
      });
    }
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

  static toggleAddOrRemoveButtons(event) {
    const checked = event.target.checked;
    const visibility = checked ? "visible" : "hidden";

    Utils.insertStyleHTML(`
      .add-or-remove-button {
        visibility: ${visibility} !important;
      }
    `, "add-or-remove-button-visibility");

    if (!checked) {
      Utils.broadcastEvent("captionsReEnabled");
    }
  }

  static toggleBlacklist(event) {
    FavoritesMenuEventHandler.broadcastFavoritesLoaderOptionChanged("blacklist", event.target.checked);
  }

  static toggleFancyThumbHovering(event) {
    Utils.insertStyleHTML(event.target.checked ? Utils.styles.fancyHovering : "", "fancy-image-hovering");
  }

  static toggleOptionHotkeyHints(event) {
    const html = event.target.checked ? "" : ".option-hint {display:none;}";

    Utils.insertStyleHTML(html, "option-hint-visibility");
  }

  static toggleDarkTheme(event) {
    Utils.toggleDarkTheme(event.target.checked);
  }

  static toggleStatisticHints(event) {
    const html = event.target.checked ? "" : ".statistic-hint {display:none;}";

    Utils.insertStyleHTML(html, "statistic-hint-visibility");
  }

  static changeSortingParameters() {
    FavoritesMenuEventHandler.broadcastFavoritesLoaderOptionChanged("sortingParameters");
  }

  static changeResultsPerPage(event) {
    FavoritesMenuEventHandler.broadcastFavoritesLoaderOptionChanged("resultsPerPage", parseInt(event.target.value));
  }

  static changeColumnCount(event) {
    const columnCount = parseInt(event.target.value);
    const width = Math.floor(window.innerWidth / columnCount) - 15;
    const min = parseInt(event.target.getAttribute("min") || 1);
    const max = parseInt(event.target.getAttribute("max") || 5);
    const height = Utils.mapRange(columnCount, min, max, 400, 75);

    Utils.insertStyleHTML(`
      #favorites-search-gallery-content {
        &.grid {
          grid-template-columns: repeat(${columnCount}, 1fr) !important;
        }

        &.row  {
          >.favorite,>.spacer {
            height: ${height}px;
          }
          >.spacer {
            height: ${height}px;
            width: ${height}px;
          }
        }

        &.masonry>.favorite {
          width: ${width}px !important;
        }
      }
      `, "column-count");
    FavoritesMenuEventHandler.updateMasonry();
  }

  static updateMasonry() {
    FavoritesMenuEventHandler.invokeFavoritesLoaderFunction("updateMasonry");
  }

  static changePerformanceProfile() {
    window.location.reload();
  }

  static changeAllowedRatings(target) {
    const explicit = target.querySelector("#explicit-rating");
    const questionable = target.querySelector("#questionable-rating");
    const safe = target.querySelector("#safe-rating");
    const allowedRatings = (4 * Number(explicit.checked)) + (2 * Number(questionable.checked)) + Number(safe.checked);

    Utils.setPreference("allowedRatings", allowedRatings);
    FavoritesMenuEventHandler.broadcastFavoritesLoaderOptionChanged("allowedRatings", allowedRatings);

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

  static changeLayout(event) {
    FavoritesMenuEventHandler.invokeFavoritesLoaderFunction("changeLayout", event.target.value);
  }
}

class FavoriteMenu2 {
  /**
   * @type {FavoritesMenuDesktopUI}
   */
  ui;
  /**
   * @type {FavoritesMenuEventHandler}
   */
  eventHandler;

  /**
   * @type {Boolean}
   */
  static get disabled() {
    return !Utils.onFavoritesPage();
  }

  constructor() {
    if (FavoriteMenu2.disabled) {
      return;
    }
    FavoritesMenuEventHandler.setup();
    FavoritesMenuState.loadState();
    FavoritesMenuUI.setup();

    if (Utils.onMobileDevice()) {
      FavoritesMenuMobileUI.createUI();
    } else {
      FavoritesMenuDesktopUI.createUI();
    }
  }
}
