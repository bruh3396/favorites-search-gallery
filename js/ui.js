const uiHTML = `<div id="favorites-search-gallery-menu" class="light-green-gradient not-highlightable">
  <style>
    #favorites-search-gallery-menu {
      position: sticky;
      top: 0;
      padding: 10px;
      z-index: 30;
      margin-bottom: 10px;

      input::-webkit-outer-spin-button,
      input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        appearance: none;
        margin: 0;
      }
    }

    #favorites-search-gallery-menu-panels {
      >div {
        flex: 1;
      }
    }

    #left-favorites-panel {
      flex: 10 !important;

      >div:first-of-type {
        margin-bottom: 5px;

        >label {
          align-content: center;
          margin-right: 5px;
          margin-top: 4px;
        }

        >button {
          height: 35px;
          border: none;
          border-radius: 4px;

          &:hover {
            filter: brightness(140%);
          }
        }

        >button[disabled] {
          filter: none !important;
          cursor: wait !important;
        }
      }
    }

    #right-favorites-panel {
      flex: 9 !important;
      margin-left: 30px;
      display: none;
    }

    textarea {
      max-width: 100%;
      height: 50px;
      width: 99%;
      padding: 10px;
      border-radius: 6px;
      resize: vertical;
    }

    button,
    input[type="checkbox"] {
      cursor: pointer;
    }

    .checkbox {
      display: block;
      padding: 2px 6px 2px 0px;
      border-radius: 4px;
      margin-left: -3px;
      height: 27px;

      >input {
        vertical-align: -5px;
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

    .add-or-remove-button {
      position: absolute;
      left: 0;
      top: 0;
      width: 40%;
      font-weight: bold;
      background: none;
      border: none;
      z-index: 2;
      filter: grayscale(50%);

      &:active,
      &:hover {
        filter: none !important;
      }
    }

    .remove-favorite-button {
      color: red;
    }

    .add-favorite-button {
      >svg {
        fill: hotpink;
      }
    }

    .statistic-hint {
      position: absolute;
      z-index: 3;
      text-align: center;
      right: 0;
      top: 0;
      background: white;
      color: #0075FF;
      font-weight: bold;
      /* font-size: 18px; */
      pointer-events: none;
      font-size: calc(8px + (20 - 8) * ((100vw - 300px) / (3840 - 300)));
      width: 55%;
      padding: 2px 0px;
      border-bottom-left-radius: 4px;
    }

    .thumb-node {
      position: relative;
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      -khtml-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;

      >a,
      >div {
        overflow: hidden;
        position: relative;


        >img {
          width: 100%;
          z-index: 1;
          -webkit-user-drag: none;
          -khtml-user-drag: none;
          -moz-user-drag: none;
          -o-user-drag: none;
        }

        &:has(.add-or-remove-button:hover) {
          outline-style: solid !important;
          outline-width: 5px !important;
        }

        &:has(.remove-favorite-button:hover) {
          outline-color: red !important;

          >.remove-favorite-button {
            color: red;
          }
        }

        &:has(.add-favorite-button:hover) {
          outline-color: hotpink !important;

          >.add-favorite-button {
            svg {
              fill: hotpink;
            }
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

    #column-resize-container {
      >div {
        align-content: center;
      }
    }

    #find-favorite {
      margin-top: 7px;

      >input {
        width: 75px;
        /* border-radius: 6px;
        height: 35px;
        border: 1px solid; */
      }
    }

    #favorites-pagination-container {
      padding: 0px 10px 0px 10px;

      >button {
        background: transparent;
        margin: 0px 2px;
        padding: 2px 6px;
        border: 1px solid black;
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

    #favorites-search-gallery-content {
      padding: 0px 20px 30px 20px;
      display: grid !important;
      grid-template-columns: repeat(10, 1fr);
      grid-gap: 1em;
    }

    #help-links-container {
      margin-top: 17px;
    }

    #whats-new-link {
      cursor: pointer;
      padding: 0;
      position: relative;
      font-weight: bolder;
      font-style: italic;
      background: none;
      text-decoration: none !important;

      &.hidden:not(.persistent)>div {
        display: none;
      }

      &.persistent,
      &:hover {
        &.light-green-gradient {
          color: black;
        }

        &:not(.light-green-gradient) {
          color: white;
        }
      }
    }

    #whats-new-container {
      z-index: 10;
      top: 20px;
      right: 0;
      transform: translateX(25%);
      font-style: normal;
      font-weight: normal;
      white-space: nowrap;
      max-width: 100vw;
      padding: 5px 20px;
      position: absolute;
      pointer-events: none;
      text-shadow: none;
      border-radius: 2px;

      &.light-green-gradient {
        outline: 2px solid black;

      }

      &:not(.light-green-gradient) {
        outline: 1.5px solid white;
      }

      ul {
        padding-left: 20px;
      }

      h5,
      h6 {
        color: rgb(255, 0, 255);
      }
    }

    .hotkey {
      font-weight: bolder;
      color: orange;
    }

    #left-favorites-panel-bottom-row {
      display: flex;
      margin-top: 10px;
      flex-wrap: nowrap;

      >div {
        flex: 1;
      }

      .number {
        font-size: 16px;

        >input {
          width: 5ch;
        }
      }
    }

    #additional-favorite-options {
      >div:not(:last-child) {
        padding-bottom: 10px;
      }

      select {
        cursor: pointer;
        min-height: 25px;
      }
    }

    .number-label-container {
      display: inline-block;
      min-width: 130px;
    }

    #performance-profile {
      width: 150px;
    }

    #show-ui-div {
      &.ui-hidden {
        max-width: 100vw;
        text-align: center;
        align-content: center;
      }
    }

    #rating-container {
      white-space: nowrap;
    }

    #allowed-ratings {
      margin-top: 5px;
      font-size: 12px;

      >label {
        outline: 1px solid;
        padding: 3px;
        cursor: pointer;
        opacity: 0.5;
        position: relative;
      }

      >label[for="explicit-rating-checkbox"] {
        border-radius: 7px 0px 0px 7px;
      }

      >label[for="questionable-rating-checkbox"] {
        margin-left: -3px;
      }

      >label[for="safe-rating-checkbox"] {
        margin-left: -3px;
        border-radius: 0px 7px 7px 0px;
      }

      >input[type="checkbox"] {
        display: none;

        &:checked+label {
          background-color: #0075FF;
          color: white;
          opacity: 1;
        }
      }
    }

    .add-or-remove-button {
      visibility: hidden;
    }

    #favorites-load-status {
      >label {
        display: inline-block;
        width: 140px;
      }
    }

    #favorites-fetch-progress-label {
      color: #3498db;
    }

    #main-favorite-options-container {
      display: flex;
      flex-wrap: wrap;
      flex-direction: row;

      >div {
        flex-basis: 45%;
      }
    }

    #sort-ascending {
      position: absolute;
      top: -2px;
      left: 150px;
    }

    #find-favorite-input {
      border: none !important;
    }

    div#header {
      margin-bottom: 0 !important;
    }

    body {

      &:fullscreen,
      &::backdrop {
        background-color: var(--c-bg);
      }
    }
  </style>
  <div id="favorites-search-gallery-menu-panels" style="display: flex;">
    <div id="left-favorites-panel">
      <h2 style="display: inline;">Search Favorites</h2>
      <span id="favorites-load-status" style="margin-left: 5px;">
        <label id="match-count-label"></label>
        <label id="pagination-label" style="margin-left: 10px;"></label>
        <label id="favorites-fetch-progress-label" style="padding-left: 20px; color: #3498db;"></label>
      </span>
      <div id="left-favorites-panel-top-row">
        <button title="Search favorites\nctrl+click/right-click: Search all of rule34 in a new tab"
          id="search-button">Search</button>
        <button title="Randomize order of search results" id="shuffle-button">Shuffle</button>
        <button title="Show results not matched by search" id="invert-button">Invert</button>
        <button title="Empty the search box" id="clear-button">Clear</button>
        <button title="Remove cached favorites and preferences" id="reset-button">Reset</button>
        <span id="favorites-pagination-placeholder"></span>
        <span id="help-links-container">
          <a href="https://github.com/bruh3396/favorites-search-gallery#controls" target="_blank">Help</a>
          |

          <a href="https://sleazyfork.org/en/scripts/504184-rule34-favorites-search-gallery/feedback"
            target="_blank">Feedback</a>
          |

          <a href="https://github.com/bruh3396/favorites-search-gallery/issues" target="_blank">Report
            Issue</a>
          |

          <a id="whats-new-link" href="" class="hidden light-green-gradient">What's new?

            <div id="whats-new-container" class="light-green-gradient">
              <h4>1.17:</h4>
              <h5>Features:</h5>
              <ul>
                <li>Added autoplay</li>
                <li>Added new hotkeys and hints for them</li>
                <li>Gallery now auto changes to next/previous page rather tha looping to start of same page</li>
                <ul>
                  <li sty>Basically, you can view every single favorite without ever exiting the gallery</li>
                </ul>
                <li>Middle click on tag in "details" to quickly search for it</li>
                <li>Changed UI</li>
              </ul>
              <h5> Notes/Fixes:</h5>
              <ul>
                <li>
                  <strong>
                    A large site update is ongoing, creating new bugs
                  </strong>
                </li>
                <li>I'm fixing anything I find, but please report any issues you find also</li>
              </ul>
            </div>
          </a>
        </span>
      </div>
      <div>
        <textarea name="tags" id="favorites-search-box" placeholder="Search with Tags and/or IDs"
          spellcheck="false"></textarea>
      </div>
      <div id="left-favorites-panel-bottom-row">
        <div id="bottom-panel-1">
          <label class="checkbox" title="Show more options">
            <input type="checkbox" id="options-checkbox"> More Options
            <span class="option-hint"> (O)</span>
          </label>
          <div class="options-container">
            <div id="main-favorite-options-container">
              <div id="favorite-options">
                <div>
                  <label class="checkbox" title="Enable gallery and other features on search pages">
                    <input type="checkbox" id="enable-on-search-pages">
                    Enhance Search Pages
                  </label>
                </div>
                <div style="display: none;">
                  <label class="checkbox" title="Toggle remove buttons">
                    <input type="checkbox" id="show-remove-favorite-buttons">
                    Remove Buttons
                    <span class="option-hint"> (R)</span>
                  </label>
                </div>
                <div style="display: none;">
                  <label class="checkbox" title="Toggle add favorite buttons">
                    <input type="checkbox" id="show-add-favorite-buttons">
                    Add Favorite Buttons
                    <span class="option-hint"> (R)</span>
                  </label>
                </div>
                <div>
                  <label class="checkbox" title="Exclude blacklisted tags from search">
                    <input type="checkbox" id="filter-blacklist-checkbox"> Exclude Blacklist
                  </label>
                </div>
                <div>
                  <label class="checkbox" title="Enable fancy image hovering (experimental)">
                    <input type="checkbox" id="fancy-image-hovering-checkbox"> Fancy Hovering
                  </label>
                </div>
                <div style="display: none;">
                  <label class="checkbox" title="Enable fancy image hovering (experimental)">
                    <input type="checkbox" id="statistic-hint-checkbox"> Statistics
                    <span class="option-hint"> (S)</span>
                  </label>
                </div>
                <div>
                  <label class="checkbox" title="Show hotkeys and shortcuts">
                    <input type="checkbox" id="show-hints-checkbox"> Hotkey Hints
                    <span class="option-hint"> (H)</span>
                  </label>
                </div>
              </div>
              <div id="dynamic-favorite-options">
              </div>
            </div>
          </div>
        </div>

        <div id="bottom-panel-2">
          <div id="additional-favorite-options-container" class="options-container">
            <div id="additional-favorite-options">
              <div id="sort-container" title="Sort order of search results">
                <label style="margin-right: 22px;" for="sorting-method">Sort By</label>
                <label style="margin-left:  22px;" for="sort-ascending">Ascending</label>
                <div style="position: relative;">
                  <select id="sorting-method" style="width: 150px;">
                    <option value="default">Default</option>
                    <option value="score">Score</option>
                    <option value="width">Width</option>
                    <option value="height">Height</option>
                    <option value="create">Date Uploaded</option>
                    <option value="change">Date Changed</option>
                  </select>
                  <input type="checkbox" id="sort-ascending">
                </div>
              </div>

              <div>
                <div id="results-per-page-container" style="display: inline-block;"
                  title="Set the maximum number of search results to display on each page\nLower numbers improve responsiveness">
                  <span class="number-label-container">
                    <label id="results-per-page-label" for="results-per-page-input">Results per Page</label>
                  </span>
                  <br>
                  <span class="number">
                    <hold-button class="number-arrow-down" pollingtime="50">
                      <span>&lt;</span>
                    </hold-button>
                    <input type="number" id="results-per-page-input" min="100" max="10000" step="50">
                    <hold-button class="number-arrow-up" pollingtime="50">
                      <span>&gt;</span>
                    </hold-button>
                  </span>
                </div>
                <div id="column-resize-container" title="Set the number of favorites per row"
                  style="display: inline-block;">
                  <div>
                    <span class="number-label-container">
                      <label>Columns</label>
                    </span>
                    <br>
                    <span class="number">
                      <hold-button class="number-arrow-down" pollingtime="50">
                        <span>&lt;</span>
                      </hold-button>
                      <input type="number" id="column-resize-input" min="2" max="20">
                      <hold-button class="number-arrow-up" pollingtime="50">
                        <span>&gt;</span>
                      </hold-button>
                    </span>
                  </div>
                </div>
              </div>
              <div id="rating-container" title="Filter search results by rating">
                <label>Rating</label>
                <br>
                <div id="allowed-ratings" class="not-highlightable">
                  <input type="checkbox" id="explicit-rating-checkbox" checked>
                  <label for="explicit-rating-checkbox">Explicit</label>
                  <input type="checkbox" id="questionable-rating-checkbox" checked>
                  <label for="questionable-rating-checkbox">Questionable</label>
                  <input type="checkbox" id="safe-rating-checkbox" checked>
                  <label for="safe-rating-checkbox" style="margin: -3px;">Safe</label>
                </div>
              </div>
              <div id="performance-profile-container" title="Improve performance by disabling features">
                <label for="performance-profile">Performance Profile</label>
                <br>
                <select id="performance-profile">
                  <option value="0">Normal</option>
                  <option value="1">Low (no gallery)</option>
                  <option value="2">Potato (only search)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div id="bottom-panel-3">
          <div id="show-ui-div">
            <label class="checkbox" title="Toggle UI">
              <input type="checkbox" id="show-ui">UI
              <span class="option-hint"> (U)</span>
            </label>
          </div>
          <div class="options-container">
            <span id="find-favorite" style="display: none;">
              <button title="Find favorite favorite using its ID" id="find-favorite-button"
                style="white-space: nowrap;">Find</button>
              <input type="number" id="find-favorite-input" placeholder="ID">
            </span>
          </div>
        </div>

        <div id="bottom-panel-4">

        </div>
      </div>
    </div>
    <div id="right-favorites-panel"></div>
  </div>
  <div class="loading-wheel" id="loading-wheel" style="display: none;"></div>
</div>`;/* eslint-disable no-bitwise */

if (onFavoritesPage()) {
  insertFavoritesSearchGalleryHTML("afterbegin", uiHTML);
}
const MAX_SEARCH_HISTORY_LENGTH = 100;
const FAVORITE_PREFERENCES = {
  showAddOrRemoveButtons: userIsOnTheirOwnFavoritesPage() ? "showRemoveButtons" : "showAddFavoriteButtons",
  showOptions: "showOptions",
  excludeBlacklist: "excludeBlacklist",
  searchHistory: "favoritesSearchHistory",
  findFavorite: "findFavorite",
  thumbSize: "thumbSize",
  columnCount: "columnCount",
  showUI: "showUI",
  performanceProfile: "performanceProfile",
  resultsPerPage: "resultsPerPage",
  fancyImageHovering: "fancyImageHovering",
  enableOnSearchPages: "enableOnSearchPages",
  sortAscending: "sortAscending",
  sortingMethod: "sortingMethod",
  allowedRatings: "allowedRatings",
  showHotkeyHints: "showHotkeyHints",
  showStatisticHints: "showStatisticHints"
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
  findFavorite: document.getElementById("find-favorite-button")
};
const FAVORITE_CHECKBOXES = {
  showOptions: document.getElementById("options-checkbox"),
  showAddOrRemoveButtons: userIsOnTheirOwnFavoritesPage() ? document.getElementById("show-remove-favorite-buttons") : document.getElementById("show-add-favorite-buttons"),
  filterBlacklist: document.getElementById("filter-blacklist-checkbox"),
  showUI: document.getElementById("show-ui"),
  fancyImageHovering: document.getElementById("fancy-image-hovering-checkbox"),
  enableOnSearchPages: document.getElementById("enable-on-search-pages"),
  sortAscending: document.getElementById("sort-ascending"),
  explicitRating: document.getElementById("explicit-rating-checkbox"),
  questionableRating: document.getElementById("questionable-rating-checkbox"),
  safeRating: document.getElementById("safe-rating-checkbox"),
  showHotkeyHints: document.getElementById("show-hints-checkbox"),
  showStatisticHints: document.getElementById("statistic-hint-checkbox")
};
const FAVORITE_INPUTS = {
  searchBox: document.getElementById("favorites-search-box"),
  findFavorite: document.getElementById("find-favorite-input"),
  columnCount: document.getElementById("column-resize-input"),
  performanceProfile: document.getElementById("performance-profile"),
  resultsPerPage: document.getElementById("results-per-page-input"),
  sortingMethod: document.getElementById("sorting-method"),
  allowedRatings: document.getElementById("allowed-ratings")
};
const columnWheelResizeCaptionCooldown = new Cooldown(500, true);

let searchHistory = [];
let searchHistoryIndex = 0;
let lastSearchQuery = "";

function initializeFavoritesPage() {
  setMainButtonInteractability(false);
  addEventListenersToFavoritesPage();
  loadFavoritesPagePreferences();
  removePaginatorFromFavoritesPage();
  configureAddOrRemoveButtonOptionVisibility();
  configureMobileUI();
  configureDesktopUI();
  setupWhatsNewDropdown();
  addHintsOption();
}

function loadFavoritesPagePreferences() {
  const userIsLoggedIn = getUserId() !== null;
  const showAddOrRemoveButtonsDefault = !userIsOnTheirOwnFavoritesPage() && userIsLoggedIn;
  const addOrRemoveFavoriteButtonsAreVisible = getPreference(FAVORITE_PREFERENCES.showAddOrRemoveButtons, showAddOrRemoveButtonsDefault);

  FAVORITE_CHECKBOXES.showAddOrRemoveButtons.checked = addOrRemoveFavoriteButtonsAreVisible;
  setTimeout(() => {
    toggleAddOrRemoveButtons();
  }, 100);

  const showOptions = getPreference(FAVORITE_PREFERENCES.showOptions, false);

  FAVORITE_CHECKBOXES.showOptions.checked = showOptions;
  toggleFavoritesOptions(showOptions);

  if (userIsOnTheirOwnFavoritesPage()) {
    FAVORITE_CHECKBOXES.filterBlacklist.checked = getPreference(FAVORITE_PREFERENCES.excludeBlacklist, false);
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

  changeResultsPerPage(resultsPerPage);

  if (onMobileDevice()) {
    toggleFancyImageHovering(false);
    FAVORITE_CHECKBOXES.fancyImageHovering.parentElement.style.display = "none";
    FAVORITE_CHECKBOXES.enableOnSearchPages.parentElement.style.display = "none";
  } else {
    const fancyImageHovering = getPreference(FAVORITE_PREFERENCES.fancyImageHovering, false);

    FAVORITE_CHECKBOXES.fancyImageHovering.checked = fancyImageHovering;
    toggleFancyImageHovering(fancyImageHovering);
  }

  FAVORITE_CHECKBOXES.enableOnSearchPages.checked = getPreference(FAVORITE_PREFERENCES.enableOnSearchPages, false);
  FAVORITE_CHECKBOXES.sortAscending.checked = getPreference(FAVORITE_PREFERENCES.sortAscending, false);

  const sortingMethod = getPreference(FAVORITE_PREFERENCES.sortingMethod, "default");

  for (const option of FAVORITE_INPUTS.sortingMethod) {
    if (option.value === sortingMethod) {
      option.selected = "selected";
    }
  }
  const allowedRatings = loadAllowedRatings();

  FAVORITE_CHECKBOXES.explicitRating.checked = (allowedRatings & 4) === 4;
  FAVORITE_CHECKBOXES.questionableRating.checked = (allowedRatings & 2) === 2;
  FAVORITE_CHECKBOXES.safeRating.checked = (allowedRatings & 1) === 1;
  preventUserFromUncheckingAllRatings(allowedRatings);

  const showStatisticHints = getPreference(FAVORITE_PREFERENCES.showStatisticHints, false);

  FAVORITE_CHECKBOXES.showStatisticHints.checked = showStatisticHints;
  toggleStatisticHints(showStatisticHints);
}

function removePaginatorFromFavoritesPage() {
  if (!onFavoritesPage()) {
    return;
  }
  const paginator = document.getElementById("paginator");
  const pi = document.getElementById("pi");

  if (paginator !== null) {
    paginator.remove();
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
      hideAwesomplete(FAVORITE_INPUTS.searchBox);
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
        if (awesompleteIsVisible(FAVORITE_INPUTS.searchBox)) {
          updateLastSearchQuery();
        } else {
          event.preventDefault();
          traverseFavoritesSearchHistory(event.key);
        }
        break;

      default:
        updateLastSearchQuery();
        break;
    }
  });
  FAVORITE_INPUTS.searchBox.addEventListener("wheel", (event) => {
    if (event.shiftKey || event.ctrlKey) {
      return;
    }
    const direction = event.deltaY > 0 ? "ArrowDown" : "ArrowUp";

    traverseFavoritesSearchHistory(direction);
    event.preventDefault();
  });
  FAVORITE_CHECKBOXES.showOptions.onchange = () => {
    toggleFavoritesOptions(FAVORITE_CHECKBOXES.showOptions.checked);
    setPreference(FAVORITE_PREFERENCES.showOptions, FAVORITE_CHECKBOXES.showOptions.checked);
  };
  FAVORITE_CHECKBOXES.showAddOrRemoveButtons.onchange = () => {
    toggleAddOrRemoveButtons();
    setPreference(FAVORITE_PREFERENCES.showAddOrRemoveButtons, FAVORITE_CHECKBOXES.showAddOrRemoveButtons.checked);
  };
  FAVORITE_BUTTONS.shuffle.onclick = () => {
    favoritesLoader.shuffleSearchResults();
  };
  FAVORITE_BUTTONS.clear.onclick = () => {
    FAVORITE_INPUTS.searchBox.value = "";
  };
  FAVORITE_CHECKBOXES.filterBlacklist.onchange = () => {
    setPreference(FAVORITE_PREFERENCES.excludeBlacklist, FAVORITE_CHECKBOXES.filterBlacklist.checked);
    favoritesLoader.toggleTagBlacklistExclusion(FAVORITE_CHECKBOXES.filterBlacklist.checked);
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
      FAVORITE_BUTTONS.findFavorite.click();
    }
  });
  FAVORITE_BUTTONS.findFavorite.onclick = () => {
    favoritesLoader.findFavorite(FAVORITE_INPUTS.findFavorite.value);
    setPreference(FAVORITE_PREFERENCES.findFavorite, FAVORITE_INPUTS.findFavorite.value);
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
    changeResultsPerPage(parseInt(FAVORITE_INPUTS.resultsPerPage.value), false);
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
  FAVORITE_CHECKBOXES.sortAscending.onchange = () => {
    setPreference(FAVORITE_PREFERENCES.sortAscending, FAVORITE_CHECKBOXES.sortAscending.checked);
    favoritesLoader.onSortingParametersChanged();
  };
  FAVORITE_INPUTS.sortingMethod.onchange = () => {
    setPreference(FAVORITE_PREFERENCES.sortingMethod, FAVORITE_INPUTS.sortingMethod.value);
    favoritesLoader.onSortingParametersChanged();
  };
  FAVORITE_INPUTS.allowedRatings.onchange = () => {
    changeAllowedRatings();
  };
  window.addEventListener("wheel", (event) => {
    if (!event.shiftKey) {
      return;
    }
    const delta = (event.wheelDelta ? event.wheelDelta : -event.deltaY);
    const columnAddend = delta > 0 ? -1 : 1;

    if (columnWheelResizeCaptionCooldown.ready) {
      forceHideCaptions(true);
    }
    changeColumnCount(parseInt(FAVORITE_INPUTS.columnCount.value) + columnAddend);
  }, {
    passive: true
  });
  columnWheelResizeCaptionCooldown.onDebounceEnd = () => {
    forceHideCaptions(false);
  };
  columnWheelResizeCaptionCooldown.onCooldownEnd = () => {
    if (!columnWheelResizeCaptionCooldown.debouncing) {
      forceHideCaptions(false);
    }
  };
  window.addEventListener("readyToSearch", () => {
    setMainButtonInteractability(true);
  }, {
    once: true
  });
  document.addEventListener("keydown", (event) => {
    if (!isHotkeyEvent(event)) {
      return;
    }

    switch (event.key.toLowerCase()) {
      case "r":
        FAVORITE_CHECKBOXES.showAddOrRemoveButtons.click();
        break;

      case "u":
        FAVORITE_CHECKBOXES.showUI.click();
        break;

      case "o":
        FAVORITE_CHECKBOXES.showOptions.click();
        break;

      case "h":
        FAVORITE_CHECKBOXES.showHotkeyHints.click();
        break;

      case "s":
        // FAVORITE_CHECKBOXES.showStatisticHints.click();
        break;

      default:
        break;
    }
  }, {
    passive: true
  });
  window.addEventListener("load", () => {
    FAVORITE_INPUTS.searchBox.focus();
  }, {
    once: true
  });
  FAVORITE_CHECKBOXES.showStatisticHints.onchange = () => {
    toggleStatisticHints(FAVORITE_CHECKBOXES.showStatisticHints.checked);
    setPreference(FAVORITE_PREFERENCES.showStatisticHints, FAVORITE_CHECKBOXES.showStatisticHints.checked);
  };
  window.addEventListener("searchForTag", (event) => {
    FAVORITE_INPUTS.searchBox.value = event.detail;
    FAVORITE_BUTTONS.search.click();
  });
}

function configureAddOrRemoveButtonOptionVisibility() {
  FAVORITE_CHECKBOXES.showAddOrRemoveButtons.parentElement.parentElement.style.display = "block";
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
  document.querySelectorAll(".options-container").forEach((option) => {
    option.style.display = value ? "block" : "none";
  });
}

function toggleAddOrRemoveButtons() {
  const value = FAVORITE_CHECKBOXES.showAddOrRemoveButtons.checked;

  toggleAddOrRemoveButtonVisibility(value);
  toggleThumbHoverOutlines(value);
  forceHideCaptions(value);

  if (!value) {
    dispatchEvent(new Event("captionOverrideEnd"));
  }
}

/**
 * @param {Boolean} value
 */
function toggleAddOrRemoveButtonVisibility(value) {
  const visibility = value ? "visible" : "hidden";

  insertStyleHTML(`
      .add-or-remove-button {
        visibility: ${visibility} !important;
      }
    `, "add-or-remove-button-visibility");
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
  insertStyleHTML(`
    #favorites-search-gallery-content {
      grid-template-columns: repeat(${count}, 1fr) !important;
    }
    `, "column-count");
  FAVORITE_INPUTS.columnCount.value = count;
  setPreference(FAVORITE_PREFERENCES.columnCount, count);
}

/**
 * @param {Number} resultsPerPage
 */
function changeResultsPerPage(resultsPerPage) {
  resultsPerPage = parseInt(resultsPerPage);

  if (isNaN(resultsPerPage)) {
    FAVORITE_INPUTS.resultsPerPage.value = getPreference(FAVORITE_PREFERENCES.resultsPerPage, DEFAULTS.resultsPerPage);
    return;
  }
  resultsPerPage = clamp(resultsPerPage, 50, 5000);
  FAVORITE_INPUTS.resultsPerPage.value = resultsPerPage;
  setPreference(FAVORITE_PREFERENCES.resultsPerPage, resultsPerPage);
  favoritesLoader.updateResultsPerPage(resultsPerPage);
}

/**
 * @param {Boolean} value
 */
function toggleUI(value) {
  const menu = document.getElementById("favorites-search-gallery-menu");
  const menuPanels = document.getElementById("favorites-search-gallery-menu-panels");
  const header = document.getElementById("header");
  const showUIDiv = document.getElementById("show-ui-div");
  const showUIContainer = document.getElementById("bottom-panel-3");

  if (value) {
    header.style.display = "";
    showUIContainer.insertAdjacentElement("afterbegin", showUIDiv);
    menuPanels.style.display = "flex";
    menu.removeAttribute("style");
  } else {
    menu.appendChild(showUIDiv);
    header.style.display = "none";
    menuPanels.style.display = "none";
    menu.style.background = getComputedStyle(document.body).background;
  }
  showUIDiv.classList.toggle("ui-hidden", !value);
  setPreference(FAVORITE_PREFERENCES.showUI, value);
}

function configureMobileUI() {
  if (!onMobileDevice()) {
    return;
  }
  FAVORITE_INPUTS.performanceProfile.parentElement.style.display = "none";
  insertStyleHTML(`
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

      #favorites-search-gallery-menu-panels {
        >div {
          textarea {
            width: 95% !important;
          }
        }
      }

      #favorites-search-gallery-content {
        padding-top: 300px;
      }

      #mobile-container {
        position: fixed !important;
        z-index: 30;
        width: 100vw;
      }

      #show-ui-div {
        display: none;
      }

      #favorites-search-gallery-menu-panels {
        display: block !important;
      }

      #right-favorites-panel {
        margin-left: 0px !important;
      }

      #left-favorites-panel-bottom-row {
        display: block !important;
        margin-left: 10px !important;
      }
      `, "mobile");

  const mobileUiContainer = document.createElement("div");

  mobileUiContainer.id = "mobile-container";

  mobileUiContainer.appendChild(document.getElementById("header"));
  mobileUiContainer.appendChild(document.getElementById("favorites-search-gallery-menu"));
  insertFavoritesSearchGalleryHTML("afterbegin", mobileUiContainer);

  const helpLinksContainer = document.getElementById("help-links-container");

  if (helpLinksContainer !== null) {
    helpLinksContainer.innerHTML = "<a href=\"https://github.com/bruh3396/favorites-search-gallery#controls\" target=\"_blank\">Help</a>";
  }
  FAVORITE_CHECKBOXES.showHotkeyHints.parentElement.style.display = "none";
}

function configureDesktopUI() {
  if (onMobileDevice()) {
    return;
  }
  insertStyleHTML(`
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

    #sort-ascending {
      width: 20px;
      height: 20px;
    }
  `, "desktop");
}

function setupWhatsNewDropdown() {
  if (onMobileDevice()) {
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

/**
 * @returns {Number}
 */
function loadAllowedRatings() {
  return parseInt(getPreference("allowedRatings", 7));
}

function changeAllowedRatings() {
  let allowedRatings = 0;

  if (FAVORITE_CHECKBOXES.explicitRating.checked) {
    allowedRatings += 4;
  }

  if (FAVORITE_CHECKBOXES.questionableRating.checked) {
    allowedRatings += 2;
  }

  if (FAVORITE_CHECKBOXES.safeRating.checked) {
    allowedRatings += 1;
  }

  setPreference(FAVORITE_PREFERENCES.allowedRatings, allowedRatings);
  favoritesLoader.onAllowedRatingsChanged(allowedRatings);
  preventUserFromUncheckingAllRatings(allowedRatings);
}

/**
 * @param {Number} allowedRatings
 */
function preventUserFromUncheckingAllRatings(allowedRatings) {
  if (allowedRatings === 4) {
    FAVORITE_CHECKBOXES.explicitRating.nextElementSibling.style.pointerEvents = "none";
  } else if (allowedRatings === 2) {
    FAVORITE_CHECKBOXES.questionableRating.nextElementSibling.style.pointerEvents = "none";
  } else if (allowedRatings === 1) {
    FAVORITE_CHECKBOXES.safeRating.nextElementSibling.style.pointerEvents = "none";
  } else {
    FAVORITE_CHECKBOXES.explicitRating.nextElementSibling.removeAttribute("style");
    FAVORITE_CHECKBOXES.questionableRating.nextElementSibling.removeAttribute("style");
    FAVORITE_CHECKBOXES.safeRating.nextElementSibling.removeAttribute("style");
  }
}

function setMainButtonInteractability(value) {
  const container = document.getElementById("left-favorites-panel-top-row");

  if (container === null) {
    return;
  }
  const mainButtons = Array.from(container.children).filter(child => child.tagName.toLowerCase() === "button" && child.textContent !== "Reset");

  for (const button of mainButtons) {
    button.disabled = !value;
  }
}

/**
 * @param {Boolean} value
 */
function toggleOptionHints(value) {
  const html = value ? "" : ".option-hint {display:none;}";

  insertStyleHTML(html, "option-hint-visibility");
}

async function addHintsOption() {
  toggleOptionHints(false);

  await sleep(50);

  if (onMobileDevice()) {
    return;
  }
  const optionHintsEnabled = getPreference(FAVORITE_PREFERENCES.showHotkeyHints, false);

  FAVORITE_CHECKBOXES.showHotkeyHints.checked = optionHintsEnabled;
  FAVORITE_CHECKBOXES.showHotkeyHints.onchange = () => {
    toggleOptionHints(FAVORITE_CHECKBOXES.showHotkeyHints.checked);
    setPreference(FAVORITE_PREFERENCES.showHotkeyHints, FAVORITE_CHECKBOXES.showHotkeyHints.checked);
  };
  toggleOptionHints(optionHintsEnabled);
}

/**
 * @param {Boolean} value
 */
function toggleStatisticHints(value) {
  const html = value ? "" : ".statistic-hint {display:none;}";

  insertStyleHTML(html, "statistic-hint-visibility");
}

if (onFavoritesPage()) {
  initializeFavoritesPage();
}
