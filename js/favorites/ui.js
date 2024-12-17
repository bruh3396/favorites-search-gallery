class FavoritesMenu {
  static uiHTML = `
<div id="favorites-search-gallery-menu" class="light-green-gradient not-highlightable">
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
      filter: grayscale(70%);

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

    img {
      -webkit-user-drag: none;
      -khtml-user-drag: none;
      -moz-user-drag: none;
      -o-user-drag: none;
    }

    .favorite {
      position: relative;
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      -khtml-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;

      >a,
      >div {
        display: block;
        overflow: hidden;
        position: relative;
        cursor: default;

        >img:first-child {
          width: 100%;
          z-index: 1;
        }

        /* &:has(.add-or-remove-button:hover) {
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
        } */

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
      cursor: pointer;
    }

    #favorites-load-status {
      >label {
        display: inline-block;
        width: 140px;
      }
    }

    #favorites-load-status-label {
      /* color: #3498db; */
      padding-left: 20px;
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
        <label id="favorites-load-status-label"></label>
      </span>
      <div id="left-favorites-panel-top-row">
        <button title="Search favorites
ctrl+click/right-click: Search all of rule34 in a new tab"
          id="search-button">Search</button>
        <button title="Randomize order of search results" id="shuffle-button">Shuffle</button>
        <button title="Show results not matched by search" id="invert-button">Invert</button>
        <button title="Empty the search box" id="clear-button">Clear</button>
        <button title="Delete cached favorites and reset preferences" id="reset-button">Reset</button>
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
              <h4>1.17.2:</h4>
              <h5>Features:</h5>
              <ul>
                <li>Redirect to original image</li>
                <ul>
                  <li>Ctrl+Click on thumbnail: redirect to original image, but stay on current tab</li>
                  <li>Ctrl+Shift+Click on thumbnail: redirect to original image</li>
                  <li>Works on both favorites and search pages</li>
                  <li>Works both in and out of gallery</li>
                </ul>
              </ul>
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
                  <label class="checkbox" title="Exclude favorites with blacklisted tags from search">
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
                <div id="show-hints-container">
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
              <div id="sort-container" title="Change sorting order of search results">
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
                  title="Set the maximum number of search results to display on each page
Lower numbers improve responsiveness">
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
</div>
`;

  static get disabled() {
    return !Utils.onFavoritesPage();
  }

  static {
    Utils.addStaticInitializer(() => {
      if (Utils.onFavoritesPage()) {
        Utils.insertFavoritesSearchGalleryHTML("afterbegin", FavoritesMenu.uiHTML);
      }
    });
  }

  /**
   * @type {Number}
   */
  maxSearchHistoryLength;
  /**
   * @type {Object.<PropertyKey, String>}
   */
  preferences;
  /**
   * @type {Object.<PropertyKey, String>}
   */
  localStorageKeys;
  /**
   * @type {Object.<PropertyKey, HTMLButtonElement>}
   */
  buttons;
  /**
   * @type {Object.<PropertyKey, HTMLInputElement}
   */
  checkboxes;
  /**
   * @type {Object.<PropertyKey, HTMLInputElement}
   */
  inputs;
  /**
   * @type {Cooldown}
   */
  columnWheelResizeCaptionCooldown;
  /**
   * @type {String[]}
   */
  searchHistory;
  /**
   * @type {Number}
   */
  searchHistoryIndex;
  /**
   * @type {String}
   */
  lastSearchQuery;

  constructor() {
    if (FavoritesMenu.disabled) {
      return;
    }
    this.configureMobileUI();
    this.initializeFields();
    this.extractUIElements();
    this.setMainButtonInteractability(false);
    this.addEventListenersToFavoritesPage();
    this.loadFavoritesPagePreferences();
    this.removePaginatorFromFavoritesPage();
    this.configureAddOrRemoveButtonOptionVisibility();
    this.configureDesktopUI();
    this.addEventListenersToWhatsNewMenu();
    this.addHintsOption();
  }

  initializeFields() {
    this.maxSearchHistoryLength = 100;
    this.searchHistory = [];
    this.searchHistoryIndex = 0;
    this.lastSearchQuery = "";
    this.preferences = {
      showAddOrRemoveButtons: Utils.userIsOnTheirOwnFavoritesPage() ? "showRemoveButtons" : "showAddFavoriteButtons",
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
    this.localStorageKeys = {
      searchHistory: "favoritesSearchHistory"
    };
    this.columnWheelResizeCaptionCooldown = new Cooldown(500, true);
  }

  extractUIElements() {
    this.buttons = {
      search: document.getElementById("search-button"),
      shuffle: document.getElementById("shuffle-button"),
      clear: document.getElementById("clear-button"),
      invert: document.getElementById("invert-button"),
      reset: document.getElementById("reset-button"),
      findFavorite: document.getElementById("find-favorite-button")
    };
    this.checkboxes = {
      showOptions: document.getElementById("options-checkbox"),
      showAddOrRemoveButtons: Utils.userIsOnTheirOwnFavoritesPage() ? document.getElementById("show-remove-favorite-buttons") : document.getElementById("show-add-favorite-buttons"),
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
    this.inputs = {
      searchBox: document.getElementById("favorites-search-box"),
      findFavorite: document.getElementById("find-favorite-input"),
      columnCount: document.getElementById("column-resize-input"),
      performanceProfile: document.getElementById("performance-profile"),
      resultsPerPage: document.getElementById("results-per-page-input"),
      sortingMethod: document.getElementById("sorting-method"),
      allowedRatings: document.getElementById("allowed-ratings")
    };
  }

  loadFavoritesPagePreferences() {
    const userIsLoggedIn = Utils.getUserId() !== null;
    const showAddOrRemoveButtonsDefault = !Utils.userIsOnTheirOwnFavoritesPage() && userIsLoggedIn;
    const addOrRemoveFavoriteButtonsAreVisible = Utils.getPreference(this.preferences.showAddOrRemoveButtons, showAddOrRemoveButtonsDefault);

    this.checkboxes.showAddOrRemoveButtons.checked = addOrRemoveFavoriteButtonsAreVisible;
    setTimeout(() => {
      this.toggleAddOrRemoveButtons();
    }, 100);

    const showOptions = Utils.getPreference(this.preferences.showOptions, false);

    this.checkboxes.showOptions.checked = showOptions;
    this.toggleFavoritesOptions(showOptions);

    if (Utils.userIsOnTheirOwnFavoritesPage()) {
      this.checkboxes.filterBlacklist.checked = Utils.getPreference(this.preferences.excludeBlacklist, false);
      favoritesLoader.toggleTagBlacklistExclusion(this.checkboxes.filterBlacklist.checked);
    } else {
      this.checkboxes.filterBlacklist.checked = true;
      this.checkboxes.filterBlacklist.parentElement.style.display = "none";
    }
    this.searchHistory = JSON.parse(localStorage.getItem(this.localStorageKeys.searchHistory)) || [];

    if (this.searchHistory.length > 0) {
      this.inputs.searchBox.value = this.searchHistory[0];
    }
    this.inputs.findFavorite.value = Utils.getPreference(this.preferences.findFavorite, "");
    this.inputs.columnCount.value = Utils.getPreference(this.preferences.columnCount, Utils.defaults.columnCount);
    this.changeColumnCount(this.inputs.columnCount.value);

    const showUI = Utils.getPreference(this.preferences.showUI, true);

    this.checkboxes.showUI.checked = showUI;
    this.toggleUI(showUI);

    const performanceProfile = Utils.getPerformanceProfile();

    for (const option of this.inputs.performanceProfile.children) {
      if (parseInt(option.value) === performanceProfile) {
        option.selected = "selected";
      }
    }

    const resultsPerPage = parseInt(Utils.getPreference(this.preferences.resultsPerPage, Utils.defaults.resultsPerPage));

    this.changeResultsPerPage(resultsPerPage);

    if (Utils.onMobileDevice()) {
      Utils.toggleFancyImageHovering(false);
      this.checkboxes.fancyImageHovering.parentElement.style.display = "none";
      this.checkboxes.enableOnSearchPages.parentElement.style.display = "none";
    } else {
      const fancyImageHovering = Utils.getPreference(this.preferences.fancyImageHovering, false);

      this.checkboxes.fancyImageHovering.checked = fancyImageHovering;
      Utils.toggleFancyImageHovering(fancyImageHovering);
    }

    this.checkboxes.enableOnSearchPages.checked = Utils.getPreference(this.preferences.enableOnSearchPages, false);
    this.checkboxes.sortAscending.checked = Utils.getPreference(this.preferences.sortAscending, false);

    const sortingMethod = Utils.getPreference(this.preferences.sortingMethod, "default");

    for (const option of this.inputs.sortingMethod) {
      if (option.value === sortingMethod) {
        option.selected = "selected";
      }
    }
    const allowedRatings = Utils.loadAllowedRatings();

    // eslint-disable-next-line no-bitwise
    this.checkboxes.explicitRating.checked = (allowedRatings & 4) === 4;
    // eslint-disable-next-line no-bitwise
    this.checkboxes.questionableRating.checked = (allowedRatings & 2) === 2;
    // eslint-disable-next-line no-bitwise
    this.checkboxes.safeRating.checked = (allowedRatings & 1) === 1;
    this.preventUserFromUncheckingAllRatings(allowedRatings);

    const showStatisticHints = Utils.getPreference(this.preferences.showStatisticHints, false);

    this.checkboxes.showStatisticHints.checked = showStatisticHints;
    this.toggleStatisticHints(showStatisticHints);
  }

  removePaginatorFromFavoritesPage() {
    if (!Utils.onFavoritesPage()) {
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

  addEventListenersToFavoritesPage() {
    this.buttons.search.onclick = (event) => {
      const query = this.inputs.searchBox.value;

      if (event.ctrlKey) {
        const queryWithFormattedIds = query.replace(/(?:^|\s)(\d+)(?:$|\s)/g, " id:$1 ");

        Utils.openSearchPage(queryWithFormattedIds);
      } else {
        Utils.hideAwesomplete(this.inputs.searchBox);
        favoritesLoader.searchFavorites(query);
        this.addToFavoritesSearchHistory(query);
      }
    };
    this.buttons.search.addEventListener("contextmenu", (event) => {
      const queryWithFormattedIds = this.inputs.searchBox.value.replace(/(?:^|\s)(\d+)(?:$|\s)/g, " id:$1 ");

      Utils.openSearchPage(queryWithFormattedIds);
      event.preventDefault();
    });
    this.inputs.searchBox.addEventListener("keydown", (event) => {
      switch (event.key) {
        case "Enter":
          if (Utils.awesompleteIsUnselected(this.inputs.searchBox)) {
            event.preventDefault();
            this.buttons.search.click();
          } else {
            Utils.clearAwesompleteSelection(this.inputs.searchBox);
          }
          break;

        case "ArrowUp":

        case "ArrowDown":
          if (Utils.awesompleteIsVisible(this.inputs.searchBox)) {
            this.updateLastSearchQuery();
          } else {
            event.preventDefault();
            this.traverseFavoritesSearchHistory(event.key);
          }
          break;

        default:
          this.updateLastSearchQuery();
          break;
      }
    });
    this.inputs.searchBox.addEventListener("wheel", (event) => {
      if (event.shiftKey || event.ctrlKey) {
        return;
      }
      const direction = event.deltaY > 0 ? "ArrowDown" : "ArrowUp";

      this.traverseFavoritesSearchHistory(direction);
      event.preventDefault();
    });
    this.checkboxes.showOptions.onchange = () => {
      this.toggleFavoritesOptions(this.checkboxes.showOptions.checked);
      Utils.setPreference(this.preferences.showOptions, this.checkboxes.showOptions.checked);
    };
    this.checkboxes.showAddOrRemoveButtons.onchange = () => {
      this.toggleAddOrRemoveButtons();
      Utils.setPreference(this.preferences.showAddOrRemoveButtons, this.checkboxes.showAddOrRemoveButtons.checked);
    };
    this.buttons.shuffle.onclick = () => {
      favoritesLoader.shuffleSearchResults();
    };
    this.buttons.clear.onclick = () => {
      this.inputs.searchBox.value = "";
    };
    this.checkboxes.filterBlacklist.onchange = () => {
      Utils.setPreference(this.preferences.excludeBlacklist, this.checkboxes.filterBlacklist.checked);
      favoritesLoader.toggleTagBlacklistExclusion(this.checkboxes.filterBlacklist.checked);
      favoritesLoader.searchFavorites();
    };
    this.buttons.invert.onclick = () => {
      favoritesLoader.invertSearchResults();
    };
    this.buttons.reset.onclick = () => {
      Utils.deletePersistentData();
    };
    this.inputs.findFavorite.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        this.buttons.findFavorite.click();
      }
    });
    this.buttons.findFavorite.onclick = () => {
      favoritesLoader.findFavorite(this.inputs.findFavorite.value);
      Utils.setPreference(this.preferences.findFavorite, this.inputs.findFavorite.value);
    };
    this.inputs.columnCount.onchange = () => {
      this.changeColumnCount(parseInt(this.inputs.columnCount.value));
    };
    this.checkboxes.showUI.onchange = () => {
      this.toggleUI(this.checkboxes.showUI.checked);
    };
    this.inputs.performanceProfile.onchange = () => {
      Utils.setPreference(this.preferences.performanceProfile, parseInt(this.inputs.performanceProfile.value));
      window.location.reload();
    };
    this.inputs.resultsPerPage.onchange = () => {
      this.changeResultsPerPage(parseInt(this.inputs.resultsPerPage.value), false);
    };

    if (!Utils.onMobileDevice()) {
      this.checkboxes.fancyImageHovering.onchange = () => {
        Utils.toggleFancyImageHovering(this.checkboxes.fancyImageHovering.checked);
        Utils.setPreference(this.preferences.fancyImageHovering, this.checkboxes.fancyImageHovering.checked);
      };
    }
    this.checkboxes.enableOnSearchPages.onchange = () => {
      Utils.setPreference(this.preferences.enableOnSearchPages, this.checkboxes.enableOnSearchPages.checked);
    };
    this.checkboxes.sortAscending.onchange = () => {
      Utils.setPreference(this.preferences.sortAscending, this.checkboxes.sortAscending.checked);
      favoritesLoader.onSortingParametersChanged();
    };
    this.inputs.sortingMethod.onchange = () => {
      Utils.setPreference(this.preferences.sortingMethod, this.inputs.sortingMethod.value);
      favoritesLoader.onSortingParametersChanged();
    };
    this.inputs.allowedRatings.onchange = () => {
      this.changeAllowedRatings();
    };
    window.addEventListener("wheel", (event) => {
      if (!event.shiftKey) {
        return;
      }
      const delta = (event.wheelDelta ? event.wheelDelta : -event.deltaY);
      const columnAddend = delta > 0 ? -1 : 1;

      if (this.columnWheelResizeCaptionCooldown.ready) {
        Utils.forceHideCaptions(true);
      }
      this.changeColumnCount(parseInt(this.inputs.columnCount.value) + columnAddend);
    }, {
      passive: true
    });
    this.columnWheelResizeCaptionCooldown.onDebounceEnd = () => {
      Utils.forceHideCaptions(false);
    };
    this.columnWheelResizeCaptionCooldown.onCooldownEnd = () => {
      if (!this.columnWheelResizeCaptionCooldown.debouncing) {
        Utils.forceHideCaptions(false);
      }
    };
    window.addEventListener("readyToSearch", () => {
      this.setMainButtonInteractability(true);
    }, {
      once: true
    });
    document.addEventListener("keydown", (event) => {
      if (!Utils.isHotkeyEvent(event)) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case "r":
          this.checkboxes.showAddOrRemoveButtons.click();
          break;

        case "u":
          this.checkboxes.showUI.click();
          break;

        case "o":
          this.checkboxes.showOptions.click();
          break;

        case "h":
          this.checkboxes.showHotkeyHints.click();
          break;

        case "s":
          // this.FAVORITE_CHECKBOXES.showStatisticHints.click();
          break;

        default:
          break;
      }
    }, {
      passive: true
    });
    window.addEventListener("load", () => {
      this.inputs.searchBox.focus();
    }, {
      once: true
    });
    this.checkboxes.showStatisticHints.onchange = () => {
      this.toggleStatisticHints(this.checkboxes.showStatisticHints.checked);
      Utils.setPreference(this.preferences.showStatisticHints, this.checkboxes.showStatisticHints.checked);
    };
    window.addEventListener("searchForTag", (event) => {
      this.inputs.searchBox.value = event.detail;
      this.buttons.search.click();
    });
  }

  configureAddOrRemoveButtonOptionVisibility() {
    this.checkboxes.showAddOrRemoveButtons.parentElement.parentElement.style.display = "block";
  }

  updateLastSearchQuery() {
    if (this.inputs.searchBox.value !== this.lastSearchQuery) {
      this.lastSearchQuery = this.inputs.searchBox.value;
    }
    this.searchHistoryIndex = -1;
  }

  /**
   * @param {String} newSearch
   */
  addToFavoritesSearchHistory(newSearch) {
    newSearch = newSearch.trim();
    this.searchHistory = this.searchHistory.filter(search => search !== newSearch);
    this.searchHistory.unshift(newSearch);
    this.searchHistory.length = Math.min(this.searchHistory.length, this.maxSearchHistoryLength);
    localStorage.setItem(this.localStorageKeys.searchHistory, JSON.stringify(this.searchHistory));
  }

  /**
   * @param {String} direction
   */
  traverseFavoritesSearchHistory(direction) {
    if (this.searchHistory.length > 0) {
      if (direction === "ArrowUp") {
        this.searchHistoryIndex = Math.min(this.searchHistoryIndex + 1, this.searchHistory.length - 1);
      } else {
        this.searchHistoryIndex = Math.max(this.searchHistoryIndex - 1, -1);
      }

      if (this.searchHistoryIndex === -1) {
        this.inputs.searchBox.value = this.lastSearchQuery;
      } else {
        this.inputs.searchBox.value = this.searchHistory[this.searchHistoryIndex];
      }
    }
  }

  /**
   * @param {Boolean} value
   */
  toggleFavoritesOptions(value) {
    document.querySelectorAll(".options-container").forEach((option) => {
      option.style.display = value ? "block" : "none";
    });
  }

  toggleAddOrRemoveButtons() {
    const value = this.checkboxes.showAddOrRemoveButtons.checked;

    this.toggleAddOrRemoveButtonVisibility(value);
    Utils.toggleThumbHoverOutlines(value);
    Utils.forceHideCaptions(value);

    if (!value) {
      dispatchEvent(new Event("captionOverrideEnd"));
    }
  }

  /**
   * @param {Boolean} value
   */
  toggleAddOrRemoveButtonVisibility(value) {
    const visibility = value ? "visible" : "hidden";

    Utils.insertStyleHTML(`
        .add-or-remove-button {
          visibility: ${visibility} !important;
        }
      `, "add-or-remove-button-visibility");
  }

  /**
   * @param {Number} count
   */
  changeColumnCount(count) {
    count = parseInt(count);

    if (isNaN(count)) {
      this.inputs.columnCount.value = Utils.getPreference(this.preferences.columnCount, Utils.defaults.columnCount);
      return;
    }
    count = Utils.clamp(parseInt(count), 4, 20);
    Utils.insertStyleHTML(`
      #favorites-search-gallery-content {
        grid-template-columns: repeat(${count}, 1fr) !important;
      }
      `, "column-count");
    this.inputs.columnCount.value = count;
    Utils.setPreference(this.preferences.columnCount, count);
  }

  /**
   * @param {Number} resultsPerPage
   */
  changeResultsPerPage(resultsPerPage) {
    resultsPerPage = parseInt(resultsPerPage);

    if (isNaN(resultsPerPage)) {
      this.inputs.resultsPerPage.value = Utils.getPreference(this.preferences.resultsPerPage, Utils.defaults.resultsPerPage);
      return;
    }
    resultsPerPage = Utils.clamp(resultsPerPage, 50, 5000);
    this.inputs.resultsPerPage.value = resultsPerPage;
    Utils.setPreference(this.preferences.resultsPerPage, resultsPerPage);
    favoritesLoader.updateResultsPerPage(resultsPerPage);
  }

  /**
   * @param {Boolean} value
   */
  toggleUI(value) {
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
    Utils.setPreference(this.preferences.showUI, value);
  }

  configureMobileUI() {
    if (!Utils.onMobileDevice()) {
      return;
    }
    Utils.insertStyleHTML(`
      #performance-profile-container, #show-hints-container {
        display: none !important;
      }
        .thumb, .favorite {
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

        input[type="checkbox"] {
          width: 25px;
          height: 25px;
          }
        }

        #sort-ascending {
          width: 25px;
          height: 25px;
        }
        `, "mobile");

    const mobileUIContainer = document.createElement("div");

    mobileUIContainer.id = "mobile-container";
    mobileUIContainer.appendChild(document.getElementById("header"));
    mobileUIContainer.appendChild(document.getElementById("favorites-search-gallery-menu"));
    Utils.insertFavoritesSearchGalleryHTML("afterbegin", mobileUIContainer.innerHTML);

    const helpLinksContainer = document.getElementById("help-links-container");

    if (helpLinksContainer !== null) {
      helpLinksContainer.innerHTML = "<a href=\"https://github.com/bruh3396/favorites-search-gallery#controls\" target=\"_blank\">Help</a>";
    }
  }

  configureDesktopUI() {
    if (Utils.onMobileDevice()) {
      return;
    }
    Utils.insertStyleHTML(`
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

  addEventListenersToWhatsNewMenu() {
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

  changeAllowedRatings() {
    let allowedRatings = 0;

    if (this.checkboxes.explicitRating.checked) {
      allowedRatings += 4;
    }

    if (this.checkboxes.questionableRating.checked) {
      allowedRatings += 2;
    }

    if (this.checkboxes.safeRating.checked) {
      allowedRatings += 1;
    }

    Utils.setPreference(this.preferences.allowedRatings, allowedRatings);
    favoritesLoader.onAllowedRatingsChanged(allowedRatings);
    this.preventUserFromUncheckingAllRatings(allowedRatings);
  }

  /**
   * @param {Number} allowedRatings
   */
  preventUserFromUncheckingAllRatings(allowedRatings) {
    if (allowedRatings === 4) {
      this.checkboxes.explicitRating.nextElementSibling.style.pointerEvents = "none";
    } else if (allowedRatings === 2) {
      this.checkboxes.questionableRating.nextElementSibling.style.pointerEvents = "none";
    } else if (allowedRatings === 1) {
      this.checkboxes.safeRating.nextElementSibling.style.pointerEvents = "none";
    } else {
      this.checkboxes.explicitRating.nextElementSibling.removeAttribute("style");
      this.checkboxes.questionableRating.nextElementSibling.removeAttribute("style");
      this.checkboxes.safeRating.nextElementSibling.removeAttribute("style");
    }
  }

  setMainButtonInteractability(value) {
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
  toggleOptionHints(value) {
    const html = value ? "" : ".option-hint {display:none;}";

    Utils.insertStyleHTML(html, "option-hint-visibility");
  }

  async addHintsOption() {
    this.toggleOptionHints(false);

    await Utils.sleep(50);

    if (Utils.onMobileDevice()) {
      return;
    }
    const optionHintsEnabled = Utils.getPreference(this.preferences.showHotkeyHints, false);

    this.checkboxes.showHotkeyHints.checked = optionHintsEnabled;
    this.checkboxes.showHotkeyHints.onchange = () => {
      this.toggleOptionHints(this.checkboxes.showHotkeyHints.checked);
      Utils.setPreference(this.preferences.showHotkeyHints, this.checkboxes.showHotkeyHints.checked);
    };
    this.toggleOptionHints(optionHintsEnabled);
  }

  /**
   * @param {Boolean} value
   */
  toggleStatisticHints(value) {
    const html = value ? "" : ".statistic-hint {display:none;}";

    Utils.insertStyleHTML(html, "statistic-hint-visibility");
  }
}
