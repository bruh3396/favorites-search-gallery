const uiHTML = `<div id="favorites-top-bar" class="light-green-gradient">
  <style>
    #favorites-top-bar {
      position: sticky;
      top: 0;
      padding: 10px;
      z-index: 30;
      margin-bottom: 10px;
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      -khtml-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;

    }

    #favorites-top-bar-panels {
      >div {
        flex: 1;
      }
    }

    #left-favorites-panel {
      >div:first-of-type {
        margin-bottom: 5px;
        /* min-width: 600px; */

        >label {
          align-content: center;
          margin-right: 5px;
          margin-top: 4px;
        }

        >button {
          height: 35px;
          border: none;
          border-radius: 4px;
          cursor: pointer;

          &:hover {
            filter: brightness(140%);
          }
        }
      }
    }

    #right-favorites-panel {
      margin-left: 10px;
    }

    textarea {
      max-width: 100%;
      height: 50px;
      width: 95%;
      padding: 10px;
      border-radius: 6px;
      resize: vertical;
    }

    .checkbox {
      display: block;
      cursor: pointer;
      padding: 2px 6px 2px 0px;
      border-radius: 4px;
      margin-left: -3px;
      height: 27px;

      >input {
        vertical-align: -5px;
        cursor: pointer;
      }
    }

    .loading-wheel {
      border: 16px solid #f3f3f3;
      border-top: 16px solid #3498db;
      border-radius: 50%;
      width: 120px;
      height: 120px;
      animation: spin 1s ease-in-out infinite;
      pointer-events: none;
      z-index: 9990;
      position: fixed;
      max-height: 100vh;
      margin: 0;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    @keyframes spin {
      0% {
        transform: rotate(0deg);
      }

      100% {
        transform: rotate(360deg);
      }
    }

    .remove-button {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      width: 100%;
      cursor: pointer;
      color: #0075FF;
      font-weight: bold;
      font-size: 20px;
      height: 40px;
      background: white;
      border: none;
      z-index: 2;
    }

    .thumb-node {
      position: relative;

      >a,
      >div {
        overflow: hidden;
        position: relative;

        >img,
        >canvas {
          width: 100%;
          z-index: 1;
        }

        &:has(.remove-button:hover) {
          outline: 3px solid red !important;

          >.remove-button {
            box-shadow: 0px 3px 0px 0px red;
            color: red;
          }
        }

        >a>div {
          height: 100%;
        }
      }



      &.hidden {
        display: none;
      }
    }

    .found {
      opacity: 1;
      animation: wiggle 2s;
    }

    @keyframes wiggle {

      10%,
      90% {
        transform: translate3d(-2px, 0, 0);
      }

      20%,
      80% {
        transform: translate3d(4px, 0, 0);
      }

      30%,
      50%,
      70% {
        transform: translate3d(-8px, 0, 0);
      }

      40%,
      60% {
        transform: translate3d(8px, 0, 0);
      }
    }

    #favorite-options-container {
      display: flex;
      flex-flow: row wrap;
      min-width: 50%;

      >div {
        flex: 1;
        padding-right: 6px;
        flex-basis: 45%;
      }
    }

    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    input[type="number"] {
      appearance: none;
      -moz-appearance: textfield;
      width: 15px;
    }

    #column-resize-container {
      margin-top: 10px;

      >span {
        >button {
          width: 20px;
          text-align: center;
          align-items: center;
        }
      }
    }

    #find-favorite {
      margin-top: 7px;

      >input {
        border-radius: 6px;
        height: 35px;
        width: 75px;
        border: 1px solid;
      }
    }

    #favorites-pagination-container {
      padding: 0px 10px 0px 10px;

      >button {
        background: transparent;
        margin: 0px 2px;
        padding: 2px 6px;
        border: 1px solid black;
        cursor: pointer;
        font-size: 14px;
        color: black;
        font-weight: normal;

        &:hover {
          background-color: #93b393;
        }

        &.selected {
          border: none !important;
          font-weight: bold;
          pointer-events: none;
        }
      }
    }

    #content {
      display: grid !important;
      grid-template-columns: repeat(10, 1fr);
      grid-gap: 1em;
    }

    #help-links-container {
      margin-top: 17px;
    }

    #left-favorites-panel-bottom-row {
      display: flex;
      flex-flow: row wrap;
      margin-top: 10px;

      >div {
        flex: 1;
      }
    }

    #additional-favorite-options {
      >div {
        padding-top: 6px;
      }
    }

    #performance-profile {
      width: 150px;
    }

    #results-per-page-input {
      width: 136px;
    }

    #show-ui-div {
      max-width: 400px;

      &.ui-hidden {
        max-width: 100vw;
        text-align: center;
        align-content: center;
      }
    }
  </style>
  <div id="favorites-top-bar-panels" style="display: flex;">
    <div id="left-favorites-panel">
      <h2 style="display: inline;">Search Favorites</h2>
      <span style="margin-left: 5px;">
        <label id="match-count-label"></label>
        <label id="pagination-label" style="margin-left: 10px;"></label>
        <label id="favorites-fetch-progress-label" style="color: #3498db;"></label>
      </span>
      <div id="left-favorites-panel-top-row">
        <button title="Search favorites\nctrl+click: Search all of rule34 in a new tab"
          id="search-button">Search</button>
        <button title="Show results not matched by search" id="invert-button">Invert</button>
        <button title="Randomize order of search results" id="shuffle-button">Shuffle</button>
        <button title="Empty the search box" id="clear-button">Clear</button>
        <span id="find-favorite" class="light-green-gradient" style="display: none;">
          <button title="Scroll to favorite using its ID" id="find-favorite-button"
            style="white-space: nowrap; ">Find</button>
          <input type="number" id="find-favorite-input" type="text" placeholder="ID">
        </span>
        <button title="Remove cached favorites and preferences" id="reset-button">Reset</button>
        <span id="help-links-container">
          <a href="https://github.com/bruh3396/favorites-search-gallery#controls" target="_blank">Help</a>
        </span>
      </div>
      <div>
        <textarea name="tags" id="favorites-search-box" placeholder="Search with Tags and/or IDs"
          spellcheck="false"></textarea>
      </div>

      <div id="left-favorites-panel-bottom-row">
        <div id="favorite-options-container">
          <div id="show-options"><label class="checkbox" title="Show more options"><input type="checkbox"
                id="options-checkbox"> More Options</label></div>
          <div id="favorite-options">
            <div><label class="checkbox" title="Enable gallery and other features on search pages"><input
                  type="checkbox" id="enable-on-search-pages">
                Enhance Search Pages</label></div>
            <div><label class="checkbox" title="Toggle remove buttons"><input type="checkbox" id="show-remove-buttons">
                Remove Buttons</label></div>
            <div><label class="checkbox" title="Exclude blacklisted tags from search"><input type="checkbox"
                  id="filter-blacklist-checkbox"> Exclude Blacklist</label></div>
            <div><label class="checkbox" title="Enable fancy image hovering (experimental)"><input type="checkbox"
                  id="fancy-image-hovering-checkbox"> Fancy Hovering</label></div>
          </div>
          <div id="additional-favorite-options">
            <div id="performance-profile-container" title="Improve performance by disabling features">
              <label>Performance Profile</label>
              <br>
              <select id="performance-profile">
                <option value="0">Normal</option>
                <option value="1">Low (no gallery)</option>
                <option value="2">Potato (only search)</option>
              </select>
            </div>
            <div id="results-per-page-container"
              title="Set the maximum number of search results to display on each page\nLower numbers improve responsiveness">
              <label id="results-per-page-label">Results per Page</label>
              <br>
              <input type="number" id="results-per-page-input" min="50" max="10000" step="500">
            </div>
            <div id="column-resize-container" title="Set the number of favorites per row">
              <span>
                <label>Columns</label>
                <button id="column-resize-minus">-</button>
                <input type="number" id="column-resize-input" min="2" max="20">
                <button id="column-resize-plus">+</button>
              </span>
            </div>
          </div>
        </div>
        <div id="show-ui-container">
          <div id="show-ui-div"><label class="checkbox" title="Toggle UI"><input type="checkbox" id="show-ui">UI</label>
          </div>
        </div>
      </div>
    </div>
    <div id="right-favorites-panel" style="flex: 1;"></div>
  </div>
  <div class="loading-wheel" id="loading-wheel" style="display: none;"></div>
</div>
`;

if (!onPostPage()) {
  document.getElementById("content").insertAdjacentHTML("beforebegin", uiHTML);
}
const FAVORITE_OPTIONS = [document.getElementById("favorite-options"), document.getElementById("additional-favorite-options")];
const MAX_SEARCH_HISTORY_LENGTH = 100;
const FAVORITE_PREFERENCES = {
  textareaWidth: "searchTextareaWidth",
  textareaHeight: "searchTextareaHeight",
  showRemoveButtons: "showRemoveButtons",
  showOptions: "showOptions",
  filterBlacklist: "filterBlacklistCheckbox",
  searchHistory: "favoritesSearchHistory",
  findFavorite: "findFavorite",
  thumbSize: "thumbSize",
  columnCount: "columnCount",
  showUI: "showUI",
  performanceProfile: "performanceProfile",
  resultsPerPage: "resultsPerPage",
  fancyImageHovering: "fancyImageHovering",
  enableOnSearchPages: "enableOnSearchPages"
};
const FAVORITE_LOCAL_STORAGE = {
  searchHistory: "favoritesSearchHistory"
};
const FAVORITE_BUTTONS = {
  search: document.getElementById("search-button"),
  shuffle: document.getElementById("shuffle-button"),
  clear: document.getElementById("clear-button"),
  invert: document.getElementById("invert-button"),
  reset: document.getElementById("reset-button"),
  findFavorite: document.getElementById("find-favorite-button"),
  columnPlus: document.getElementById("column-resize-plus"),
  columnMinus: document.getElementById("column-resize-minus")
};
const FAVORITE_CHECKBOXES = {
  showOptions: document.getElementById("options-checkbox"),
  showRemoveButtons: document.getElementById("show-remove-buttons"),
  filterBlacklist: document.getElementById("filter-blacklist-checkbox"),
  showUI: document.getElementById("show-ui"),
  fancyImageHovering: document.getElementById("fancy-image-hovering-checkbox"),
  enableOnSearchPages: document.getElementById("enable-on-search-pages")
};
const FAVORITE_INPUTS = {
  searchBox: document.getElementById("favorites-search-box"),
  findFavorite: document.getElementById("find-favorite-input"),
  columnCount: document.getElementById("column-resize-input"),
  performanceProfile: document.getElementById("performance-profile"),
  resultsPerPage: document.getElementById("results-per-page-input")
};
const FAVORITE_SEARCH_LABELS = {
  findFavorite: document.getElementById("find-favorite-label")
};
let searchHistory = [];
let searchHistoryIndex = 0;
let lastSearchQuery = "";

function initializeFavoritesPage() {
  addEventListenersToFavoritesPage();
  loadFavoritesPagePreferences();
  removePaginatorFromFavoritesPage();
  hideRemoveLinksWhenNotOnOwnFavoritesPage();
  configureMobileUi();
}

function loadFavoritesPagePreferences() {
  const height = getPreference(FAVORITE_PREFERENCES.textareaHeight);
  const width = getPreference(FAVORITE_PREFERENCES.textareaWidth);

  if (height !== null && width !== null) {
    /*
     * FAVORITE_SEARCH_INPUTS.searchBox.style.width = width + "px"
     * FAVORITE_SEARCH_INPUTS.searchBox.style.height = height + "px"
     */
  }
  const removeButtonsAreVisible = getPreference(FAVORITE_PREFERENCES.showRemoveButtons, false) && userIsOnTheirOwnFavoritesPage();

  FAVORITE_CHECKBOXES.showRemoveButtons.checked = removeButtonsAreVisible;
  setTimeout(() => {
    updateVisibilityOfAllRemoveButtons();
  }, 100);
  const showOptions = getPreference(FAVORITE_PREFERENCES.showOptions, false);

  FAVORITE_CHECKBOXES.showOptions.checked = showOptions;
  toggleFavoritesOptions(showOptions);

  if (userIsOnTheirOwnFavoritesPage()) {
    FAVORITE_CHECKBOXES.filterBlacklist.checked = getPreference(FAVORITE_PREFERENCES.filterBlacklist, false);
    favoritesLoader.toggleTagBlacklistExclusion(FAVORITE_CHECKBOXES.filterBlacklist.checked);
  } else {
    FAVORITE_CHECKBOXES.filterBlacklist.checked = true;
    FAVORITE_CHECKBOXES.filterBlacklist.parentElement.style.display = "none";
  }
  searchHistory = JSON.parse(localStorage.getItem(FAVORITE_LOCAL_STORAGE.searchHistory)) || [];

  if (searchHistory.length > 0) {
    FAVORITE_INPUTS.searchBox.value = searchHistory[0];
  }
  FAVORITE_INPUTS.findFavorite.value = getPreference(FAVORITE_PREFERENCES.findFavorite, "");
  FAVORITE_INPUTS.columnCount.value = getPreference(FAVORITE_PREFERENCES.columnCount, DEFAULTS.columnCount);
  changeColumnCount(FAVORITE_INPUTS.columnCount.value);

  const showUI = getPreference(FAVORITE_PREFERENCES.showUI, true);

  FAVORITE_CHECKBOXES.showUI.checked = showUI;
  toggleUI(showUI);

  const performanceProfile = getPerformanceProfile();

  for (const option of FAVORITE_INPUTS.performanceProfile.children) {
    if (parseInt(option.value) === performanceProfile) {
      option.selected = "selected";
    }
  }

  const resultsPerPage = parseInt(getPreference(FAVORITE_PREFERENCES.resultsPerPage, DEFAULTS.resultsPerPage));

  changeResultsPerPage(resultsPerPage, false);

  if (onMobileDevice()) {
    toggleFancyImageHovering(false);
    FAVORITE_CHECKBOXES.fancyImageHovering.parentElement.style.display = "none";
    FAVORITE_CHECKBOXES.enableOnSearchPages.parentElement.style.display = "none";
  } else {
    const fancyImageHovering = getPreference(FAVORITE_PREFERENCES.fancyImageHovering, false);

    FAVORITE_CHECKBOXES.fancyImageHovering.checked = fancyImageHovering;
    toggleFancyImageHovering(fancyImageHovering);
  }

  const enableOnSearchPages = getPreference(FAVORITE_PREFERENCES.enableOnSearchPages, true);

  FAVORITE_CHECKBOXES.enableOnSearchPages.checked = enableOnSearchPages;
}

function removePaginatorFromFavoritesPage() {
  const paginator = document.getElementById("paginator");
  const pi = document.getElementById("pi");

  if (paginator !== null) {
    paginator.style.display = "none";
  }

  if (pi !== null) {
    pi.remove();
  }
}

function addEventListenersToFavoritesPage() {
  FAVORITE_BUTTONS.search.onclick = (event) => {
    const query = FAVORITE_INPUTS.searchBox.value;

    if (event.ctrlKey) {
      const queryWithFormattedIds = query.replace(/(?:^|\s)(\d+)(?:$|\s)/g, " id:$1 ");

      openSearchPage(queryWithFormattedIds);
    } else {
      favoritesLoader.searchFavorites(query);
      addToFavoritesSearchHistory(query);
    }
  };
  FAVORITE_BUTTONS.search.addEventListener("contextmenu", (event) => {
    const queryWithFormattedIds = FAVORITE_INPUTS.searchBox.value.replace(/(?:^|\s)(\d+)(?:$|\s)/g, " id:$1 ");

    openSearchPage(queryWithFormattedIds);
    event.preventDefault();
  });
  FAVORITE_INPUTS.searchBox.addEventListener("keydown", (event) => {
    switch (event.key) {
      case "Enter":
        if (awesompleteIsUnselected(FAVORITE_INPUTS.searchBox)) {
          event.preventDefault();
          FAVORITE_BUTTONS.search.click();
        } else {
          clearAwesompleteSelection(FAVORITE_INPUTS.searchBox);
        }
        break;

      case "ArrowUp":

      case "ArrowDown":
        if (awesompleteIsHidden(FAVORITE_INPUTS.searchBox)) {
          event.preventDefault();
          traverseFavoritesSearchHistory(event.key);
        } else {
          updateLastSearchQuery();
        }
        break;

      case "Tab":
        {
          event.preventDefault();
          const awesomplete = FAVORITE_INPUTS.searchBox.parentElement;
          const searchSuggestions = Array.from(awesomplete.querySelectorAll("li")) || [];

          if (!awesompleteIsUnselected(FAVORITE_INPUTS.searchBox)) {
            const selectedSearchSuggestion = searchSuggestions.find(suggestion => suggestion.getAttribute("aria-selected") === "true");

            completeSearchSuggestion(selectedSearchSuggestion);
          } else if (!awesompleteIsHidden(FAVORITE_INPUTS.searchBox)) {
            completeSearchSuggestion(searchSuggestions[0]);
          }
          break;
        }

      case "Escape":
        if (!awesompleteIsHidden(FAVORITE_INPUTS.searchBox)) {
          favoritesLoader.hideAwesomplete();
        }
        break;

      default:
        updateLastSearchQuery();
        break;
    }
  });
  FAVORITE_INPUTS.searchBox.addEventListener("wheel", (event) => {
    const direction = event.deltaY > 0 ? "ArrowDown" : "ArrowUp";

    traverseFavoritesSearchHistory(direction);
    event.preventDefault();
  });
  FAVORITE_CHECKBOXES.showOptions.onchange = () => {
    toggleFavoritesOptions(FAVORITE_CHECKBOXES.showOptions.checked);
    setPreference(FAVORITE_PREFERENCES.showOptions, FAVORITE_CHECKBOXES.showOptions.checked);
  };
  const resizeObserver = new ResizeObserver(entries => {
    for (const entry of entries) {
      setPreference(FAVORITE_PREFERENCES.textareaWidth, entry.contentRect.width);
      setPreference(FAVORITE_PREFERENCES.textareaHeight, entry.contentRect.height);
    }
  });

  resizeObserver.observe(FAVORITE_INPUTS.searchBox);
  FAVORITE_CHECKBOXES.showRemoveButtons.onchange = () => {
    updateVisibilityOfAllRemoveButtons();
    setPreference(FAVORITE_PREFERENCES.showRemoveButtons, FAVORITE_CHECKBOXES.showRemoveButtons.checked);
  };
  FAVORITE_BUTTONS.shuffle.onclick = () => {
    favoritesLoader.shuffleSearchResults();
  };
  FAVORITE_BUTTONS.clear.onclick = () => {
    FAVORITE_INPUTS.searchBox.value = "";
  };
  FAVORITE_CHECKBOXES.filterBlacklist.onchange = () => {
    setPreference(FAVORITE_PREFERENCES.filterBlacklist, FAVORITE_CHECKBOXES.filterBlacklist.checked);
    favoritesLoader.toggleTagBlacklistExclusion(FAVORITE_CHECKBOXES.filterBlacklist.checked);
    favoritesLoader.excludeBlacklistClicked = true;
    favoritesLoader.searchFavorites();
  };
  FAVORITE_BUTTONS.invert.onclick = () => {
    favoritesLoader.invertSearchResults();
  };
  FAVORITE_BUTTONS.reset.onclick = () => {
    favoritesLoader.deletePersistentData();
  };
  FAVORITE_INPUTS.findFavorite.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      scrollToThumb(FAVORITE_INPUTS.findFavorite.value);
      setPreference(FAVORITE_PREFERENCES.findFavorite, FAVORITE_INPUTS.findFavorite.value);
    }
  });
  FAVORITE_BUTTONS.findFavorite.onclick = () => {
    scrollToThumb(FAVORITE_INPUTS.findFavorite.value);
    setPreference(FAVORITE_PREFERENCES.findFavorite, FAVORITE_INPUTS.findFavorite.value);
  };
  FAVORITE_BUTTONS.columnPlus.onclick = () => {
    changeColumnCount(parseInt(FAVORITE_INPUTS.columnCount.value) + 1);
  };
  FAVORITE_BUTTONS.columnMinus.onclick = () => {
    changeColumnCount(parseInt(FAVORITE_INPUTS.columnCount.value) - 1);
  };
  FAVORITE_INPUTS.columnCount.onchange = () => {
    changeColumnCount(parseInt(FAVORITE_INPUTS.columnCount.value));
  };

  FAVORITE_CHECKBOXES.showUI.onchange = () => {
    toggleUI(FAVORITE_CHECKBOXES.showUI.checked);
  };

  FAVORITE_INPUTS.performanceProfile.onchange = () => {
    setPreference(FAVORITE_PREFERENCES.performanceProfile, parseInt(FAVORITE_INPUTS.performanceProfile.value));
    window.location.reload();
  };

  FAVORITE_INPUTS.resultsPerPage.onchange = () => {
    changeResultsPerPage(parseInt(FAVORITE_INPUTS.resultsPerPage.value));
  };

  if (!onMobileDevice()) {
    FAVORITE_CHECKBOXES.fancyImageHovering.onchange = () => {
      toggleFancyImageHovering(FAVORITE_CHECKBOXES.fancyImageHovering.checked);
      setPreference(FAVORITE_PREFERENCES.fancyImageHovering, FAVORITE_CHECKBOXES.fancyImageHovering.checked);
    };
  }

  FAVORITE_CHECKBOXES.enableOnSearchPages.onchange = () => {
    setPreference(FAVORITE_PREFERENCES.enableOnSearchPages, FAVORITE_CHECKBOXES.enableOnSearchPages.checked);
  };
}

function completeSearchSuggestion(suggestion) {
  suggestion = suggestion.innerText.replace(/ \([0-9]+\)$/, "");
  favoritesLoader.hideAwesomplete();
  FAVORITE_INPUTS.searchBox.value = FAVORITE_INPUTS.searchBox.value.replace(/\S+$/, `${suggestion} `);
}

function hideRemoveLinksWhenNotOnOwnFavoritesPage() {
  if (!userIsOnTheirOwnFavoritesPage()) {
    FAVORITE_CHECKBOXES.showRemoveButtons.parentElement.style.display = "none";
  }
}

function updateLastSearchQuery() {
  if (FAVORITE_INPUTS.searchBox.value !== lastSearchQuery) {
    lastSearchQuery = FAVORITE_INPUTS.searchBox.value;
  }
  searchHistoryIndex = -1;
}

/**
 * @param {String} newSearch
 */
function addToFavoritesSearchHistory(newSearch) {
  newSearch = newSearch.trim();
  searchHistory = searchHistory.filter(search => search !== newSearch);
  searchHistory.unshift(newSearch);
  searchHistory.length = Math.min(searchHistory.length, MAX_SEARCH_HISTORY_LENGTH);
  localStorage.setItem(FAVORITE_LOCAL_STORAGE.searchHistory, JSON.stringify(searchHistory));
}

/**
 * @param {String} direction
 */
function traverseFavoritesSearchHistory(direction) {
  if (searchHistory.length > 0) {
    if (direction === "ArrowUp") {
      searchHistoryIndex = Math.min(searchHistoryIndex + 1, searchHistory.length - 1);
    } else {
      searchHistoryIndex = Math.max(searchHistoryIndex - 1, -1);
    }

    if (searchHistoryIndex === -1) {
      FAVORITE_INPUTS.searchBox.value = lastSearchQuery;
    } else {
      FAVORITE_INPUTS.searchBox.value = searchHistory[searchHistoryIndex];
    }
  }
}

/**
 * @param {Boolean} value
 */
function toggleFavoritesOptions(value) {
  for (const option of FAVORITE_OPTIONS) {
    option.style.display = value ? "block" : "none";
  }
}

/**
 * @param {Number} count
 */
function changeColumnCount(count) {
  count = parseInt(count);

  if (isNaN(count)) {
    FAVORITE_INPUTS.columnCount.value = getPreference(FAVORITE_PREFERENCES.columnCount, DEFAULTS.columnCount);
    return;
  }
  count = clamp(parseInt(count), 4, 20);
  injectStyleHTML(`
    #content {
      grid-template-columns: repeat(${count}, 1fr) !important;
    }
    `, "columnCount");
  FAVORITE_INPUTS.columnCount.value = count;
  setPreference(FAVORITE_PREFERENCES.columnCount, count);
}

/**
 * @param {Number} resultsPerPage
 * @param {Boolean} search
 */
function changeResultsPerPage(resultsPerPage, search = true) {
  resultsPerPage = parseInt(resultsPerPage);

  if (isNaN(resultsPerPage)) {
    FAVORITE_INPUTS.resultsPerPage.value = getPreference(FAVORITE_PREFERENCES.resultsPerPage, DEFAULTS.resultsPerPage);
    return;
  }
  resultsPerPage = clamp(resultsPerPage, 50, 5000);
  FAVORITE_INPUTS.resultsPerPage.value = resultsPerPage;
  setPreference(FAVORITE_PREFERENCES.resultsPerPage, resultsPerPage);

  if (search) {
    favoritesLoader.updateMaxNumberOfFavoritesToDisplay(resultsPerPage);
  }

}

/**
 * @param {Boolean} value
 */
function toggleUI(value) {
  const favoritesTopBar = document.getElementById("favorites-top-bar");
  const favoritesTopBarPanels = document.getElementById("favorites-top-bar-panels");
  const header = document.getElementById("header");
  const showUIContainer = document.getElementById("show-ui-container");
  const showUIDiv = document.getElementById("show-ui-div");

  if (value) {
    header.style.display = "";
    showUIContainer.appendChild(showUIDiv);
    favoritesTopBarPanels.style.display = "flex";
  } else {
    favoritesTopBar.appendChild(showUIDiv);
    header.style.display = "none";
    favoritesTopBarPanels.style.display = "none";
  }
  showUIDiv.classList.toggle("ui-hidden", !value);
  setPreference(FAVORITE_PREFERENCES.showUI, value);
}

function configureMobileUi() {
  if (onMobileDevice()) {
    FAVORITE_INPUTS.performanceProfile.parentElement.style.display = "none";
    injectStyleHTML(`
      .thumb, .thumb-node {
        > div > canvas {
          display: none;
        }
      }

      .checkbox {
        input[type="checkbox"] {
          margin-right: 10px;
        }
      }

      #favorites-top-bar-panels {
        >div {
          textarea {
            width: 95% !important;
          }
        }
      }

      #container {
        position: fixed !important;
        z-index: 30;
        width: 100vw;

      }

      #content {
        margin-top: 300px !important;
      }

      #show-ui-container {
        display: none;
      }

      #favorite-options-container {
        display: block !important;
      }

      #favorites-top-bar-panels {
        display: block !important;
      }

      #right-favorites-panel {
        margin-left: 0px !important;
      }

      #left-favorites-panel-bottom-row {
        margin-left: 10px !important;
      }
      `);
      const container = document.createElement("div");

      container.id = "container";

      document.body.insertAdjacentElement("afterbegin", container);
      container.appendChild(document.getElementById("header"));
      container.appendChild(document.getElementById("favorites-top-bar"));

  } else {
    injectStyleHTML(`
      .checkbox {

        &:hover {
          color: #000;
          background: #93b393;
          text-shadow: none;
          cursor: pointer;
        }

        input[type="checkbox"] {
          width: 20px;
          height: 20px;
        }
      }
      `);
  }
}

async function findSomeoneWithMoreThanXFavorites(X) {
  const alreadyCheckedUserIds = {
    "2": null
  };
  const commentsAPIURL = "https://api.rule34.xxx/index.php?page=dapi&s=comment&q=index&post_id=";

  for (const thumb of getAllThumbs()) {
    const user = await fetch(commentsAPIURL + thumb.id)
      .then((response) => {
        return response.text();
      })
      .then(async(html) => {
        let userWithMostFavorites = 2;
        let mostFavoritesSeen = -1;
        const dom1 = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
        const userIds = Array.from(dom1.getElementsByTagName("comment")).map(comment => comment.getAttribute("creator_id"));

        for (const userId of userIds) {
          if (alreadyCheckedUserIds[userId] !== undefined) {
            break;
          }
          alreadyCheckedUserIds[userId] = null;
          const favoritesCount = await fetch(`https://rule34.xxx/index.php?page=account&s=profile&id=${userId}`)
            .then((response) => {
              return response.text();
            })
            .then((responseHTML) => {
              const dom2 = new DOMParser().parseFromString(`<div>${responseHTML}</div>`, "text/html");
              const tableElement = dom2.querySelector("table");

              if (tableElement) {
                const rows = tableElement.querySelectorAll("tr");
                const targetItem = "Favorites";

                for (const row of rows) {
                  const cells = row.querySelectorAll("td");

                  if (cells.length >= 2 && cells[0].textContent.trim() === targetItem) {
                    return parseInt(cells[1].textContent.trim());
                  }
                }
              }
              return 0;
            });

          if (favoritesCount > mostFavoritesSeen) {
            mostFavoritesSeen = favoritesCount;
            userWithMostFavorites = userId;
          }
        }
        return {
          id: userWithMostFavorites,
          count: mostFavoritesSeen
        };
      });

    if (user.count > X) {
      alert(`https://rule34.xxx/index.php?page=account&s=profile&id=${user.id}`);
      return;
    }
  }
  alert(`Could not find user with more than ${X} favorites`);
}

if (!onPostPage()) {
  initializeFavoritesPage();
}
