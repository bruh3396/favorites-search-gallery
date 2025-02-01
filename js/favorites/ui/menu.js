class FavoritesMenu {
  static menuHTML = `
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

      select {
        cursor: pointer;
        min-height: 25px;
        width: 150px;
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

    #loading-wheel {
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
      text-shadow: none;
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

        >a>div {
          height: 100%;
        }

        >canvas {
          width: 100%;
          position: absolute;
          top: 0;
          left: 0;
          pointer-events: none;
          z-index: 1;
        }
      }

      &.hidden {
        display: none;
      }
    }

    #column-count-container {
      >div {
        align-content: center;
      }
    }

    #find-favorite {
      display: none;
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
        width: 6ch;

        &:hover {
          background-color: #93b393;
        }

        &.selected {
          border: none !important;
          font-weight: bold;
          pointer-events: none;
        }

        &[disabled] {
          background-color: transparent !important;
        }
      }
    }

    #favorites-search-gallery-content {
      padding: 0px 20px 30px 20px;
      --transition-duration: 0.3s;

      &.grid {
        display: grid !important;
        grid-template-columns: repeat(10, 1fr);
        grid-gap: 0.35cqw;

        .add-or-remove-button {
          width: 40%;
        }
      }

      &.row {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;

        >.favorite,
        >.spacer {
          height: 300px;
          flex: 1 1 auto;
          border-radius: 10px;
          overflow: hidden;

          /* transition: height var(--transition-duration) linear; */
        }

        >.spacer {
          width: 300px;
          /* background: gray; */
          pointer-events: none;
        }

        >.favorite {

          >a,
          >div {

            width: 100%;
            height: 100%;

            >img:first-child {
              object-fit: cover;
              width: 100%;
              height: 100%;
              vertical-align: middle;
            }

            >canvas {
              height: 100%;
              object-fit: cover;
            }
          }
        }
      }

      &.masonry {
        margin: 0 auto;

        >.favorite {
          width: 200px;
          margin-bottom: 10px;
          border-radius: 10px;
          overflow: hidden;
        }

        >.favorite img:first-child {
          width: 100%;
        }

        .add-or-remove-button {
          height: 40%;
        }

      }
    }

    #help-links-container {
      >a:not(:last-child)::after {
        content: " |";
      }

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
        margin-bottom: 10px;
      }
    }

    .number-label-container {
      display: inline-block;
      min-width: 130px;
    }

    #show-ui-container.ui-hidden {
      label {
        text-align: center;
      }
      max-width: 100vw;
      text-align: center;
      align-content: center;
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

      >label[for="explicit-rating"] {
        border-radius: 7px 0px 0px 7px;
      }

      >label[for="questionable-rating"] {
        margin-left: -3px;
      }

      >label[for="safe-rating"] {
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
      top: 15px;
      left: 150px;
      width: 20px;
      height: 20px;
    }

    #find-favorite-input {
      border: none !important;
    }

    div#header {
      margin-bottom: 0 !important;
    }

    body {
      overflow-x: hidden;

      &:fullscreen,
      &::backdrop {
        background-color: var(--c-bg);
      }
    }

    #goto-page-input {
      width: 5ch;
    }

    #left-favorites-panel-top-row>button:not(:last-of-type) {
      margin-right: 5px;
    }

    #sort-container {
      position: relative;
    }

    .toggle-switch {
            position: relative;
            display: inline-block;
            width: 60px;
            height: 34px;
            transform: scale(.8);
            align-content: center;
        }

        .toggle-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }

        .slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #ccc;
            -webkit-transition: .4s;
            transition: .4s;
        }

        .slider:before {
            position: absolute;
            content: "";
            height: 26px;
            width: 26px;
            left: 4px;
            bottom: 4px;
            background-color: white;
            -webkit-transition: .4s;
            transition: .4s;
        }

        input:checked + .slider {
            background-color: #0075FF;
        }

        input:focus + .slider {
            box-shadow: 0 0 1px #0075FF;
        }

        input:checked + .slider:before {
            -webkit-transform: translateX(26px);
            -ms-transform: translateX(26px);
            transform: translateX(26px);
        }

        .slider.round {
            border-radius: 34px;
        }

        .slider.round:before {
            border-radius: 50%;
        }

        .toggle-switch-label {
            margin-left: 60px;
            margin-top: 20px;
            font-size: 16px;
        }

        /* #sort-ascending-checkbox {
            width: 0 !important;
            height: 0 !important;
            position: static !important;
        } */
  </style>
  <div id="favorites-search-gallery-menu-panels" style="display: flex;">
    <div id="left-favorites-panel">
      <h2 style="display: inline;" id="search-header">Search Favorites</h2>
      <span id="favorites-load-status" style="margin-left: 5px;">
        <label id="match-count-label"></label>
        <label id="pagination-range-label" style="margin-left: 10px;"></label>
        <label id="favorites-load-status-label"></label>
      </span>
      <div id="left-favorites-panel-top-row">
        <span id="favorites-pagination-placeholder"></span>
        <span id="help-links-container">
          <a href="https://github.com/bruh3396/favorites-search-gallery/#controls" target="_blank">Help</a>
          <a href="https://sleazyfork.org/en/scripts/504184-rule34-favorites-search-gallery/feedback"
            target="_blank">Feedback</a>
          <a href="https://github.com/bruh3396/favorites-search-gallery/issues" target="_blank">Report
            Issue</a>
          <a id="whats-new-link" href="" class="hidden light-green-gradient">What's new?

            <div id="whats-new-container" class="light-green-gradient">
              <h4>1.18:</h4>
              <h5>Features:</h5>
              <ul>
                <li>Improved/fixed mobile UI</li>
                <li>Improved mobile controls</li>
                <li>Added gallery autoplay for mobile</li>
                <li>Added sort by random (auto shuffle)</li>
                <li>Added dark theme option</li>
                <li>Minor UI fixes</li>
                <li>Minor gallery fixes</li>
              </ul>
            </div>
          </a>
        </span>
      </div>
      <div id="left-favorites-panel-bottom-row">
        <div id="bottom-panel-1">
          <div class="options-container">
            <div id="main-favorite-options-container">
              <div id="favorite-options">
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
                <br>
              </div>
              <div id="results-columns-container">
                <div id="results-per-page-container" style="display: inline-block;"
                  title="Set the maximum number of search results to display on each page
Lower numbers improve responsiveness">
                  <span class="number-label-container">
                    <label id="results-per-page-label" for="results-per-page-input">Results per Page</label>
                  </span>
                  <br>
                </div>
                <div id="column-count-container" title="Set the number of favorites per row"
                  style="display: inline-block;">
                  <div>
                    <span class="number-label-container">
                      <label id="column-count-label">Columns</label>
                    </span>
                    <br>
                  </div>
                </div>
              </div>
              <div id="rating-container" title="Filter search results by rating" >
                <label>Rating</label>
                <br>
                <div id="allowed-ratings" class="not-highlightable" data-action="changeAllowedRatings">
                  <input type="checkbox" id="explicit-rating" checked>
                  <label for="explicit-rating">Explicit</label>
                  <input type="checkbox" id="questionable-rating" checked>
                  <label for="questionable-rating">Questionable</label>
                  <input type="checkbox" id="safe-rating" checked>
                  <label for="safe-rating" style="margin: -3px;">Safe</label>
                </div>
              </div>
              <div id="performance-profile-container" title="Improve performance by disabling features">
                <label for="performance-profile">Performance Profile</label>
                <br>
              </div>
            </div>
          </div>
        </div>

        <div id="bottom-panel-3">
          <div id="show-ui-wrapper">
          </div>
          <div class="options-container">
            <span id="find-favorite">
              <button title="Find favorite favorite using its ID" id="find-favorite-button"
                style="white-space: nowrap;">Find</button>
              <input type="number" id="find-favorite-input" placeholder="ID">
            </span>
            <div id="layout-container">
              <label>Layout</label>
              <br>
            </div>
          </div>
        </div>

        <div id="bottom-panel-4">

        </div>
      </div>
    </div>
    <div id="right-favorites-panel"></div>
  </div>
  <div id="loading-wheel"></div>
</div>
`;

  static get disabled() {
    return !Utils.onFavoritesPage();
  }

  static {
    Utils.addStaticInitializer(() => {
      if (!FavoritesMenu.disabled) {
        Utils.insertFavoritesSearchGalleryHTML("afterbegin", FavoritesMenu.menuHTML);
      }
    });
  }

  static settings = {
    mobileMenuExpandedHeight: 170,
    mobileMenuBaseHeight: 56
  };

  constructor() {
    if (FavoritesMenu.disabled) {
      return;
    }
    // this.configureMobileUI();
    this.configureDesktopUI();
    this.setMainButtonInteractability(true);
  }

  configureMobileUI() {
    if (!Utils.onMobileDevice()) {
      return;
    }
    this.configureMobileStyle();
    this.setupStickyMenu();
    this.createMobileUIContainer();
    this.createResultsPerPageSelect();
    this.createColumnResizeSelect();
    this.createMobileSearchBar();
    this.createControlsGuide();
    this.createPaginationFooter();
    this.createToggleSwitches();
    this.createMobileSymbolRow();
  }

  configureMobileStyle() {
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
    document.getElementById("sorting-method").parentElement.style.marginTop = "-5px";
    document.getElementById("more-options-label").textContent = " Options";
    document.getElementById("options-checkbox").parentElement.style.display = "none";
    const experimentalLayoutEnabled = Utils.getCookie("experiment-mobile-layout", "true");

    if (experimentalLayoutEnabled === "true") {
      Utils.insertStyleHTML(`
                input[type="checkbox"] {
                    height: 18px;
                }
            `, "experimental-mobile");
    } else {
      Utils.insertStyleHTML(`
                input[type="checkbox"] {
                    width: 25px;
                    height: 25px;
                }
            `, "non-experimental-mobile");
    }

    if (Utils.usingIOS) {
      const viewportMeta = Array.from(document.getElementsByName("viewport"))[0];

      if (viewportMeta !== undefined) {
        viewportMeta.setAttribute("content", `${viewportMeta.getAttribute("content")}, maximum-scale:1.0, user-scalable=0`);
      }
    }
  }

  createMobileUIContainer() {
    const mobileUIContainer = document.createElement("div");
    const header = document.getElementById("header");
    const menu = document.getElementById("favorites-search-gallery-menu");

    mobileUIContainer.id = "mobile-header";
    Utils.favoritesSearchGalleryContainer.insertAdjacentElement("afterbegin", mobileUIContainer);

    if (header !== null) {
      mobileUIContainer.appendChild(header);
    }
    mobileUIContainer.appendChild(menu);
  }

  setupStickyMenu() {
    const header = document.getElementById("header");
    const headerHeight = header === null ? 0 : header.getBoundingClientRect().height;

    window.addEventListener("scroll", async() => {
      if (window.scrollY > headerHeight && document.getElementById("sticky-header-fsg-style") === null) {
        Utils.insertStyleHTML(
          `
                    #favorites-search-gallery-menu {
                        position: fixed;
                        margin-top: 0;
                    }
                    `,
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

  createResultsPerPageSelect() {
    const resultsPerPageSelectHTML = `
            <select id="results-per-page-select">
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="200">200</option>
                <option value="500">500</option>
                <option value="1000">1000</option>
                <option value="2000">2000</option>
                <option value="5000">5000</option>
            </select>
        `;

    document.getElementById("results-per-page-container").querySelector(".number")
      .insertAdjacentHTML("afterend", resultsPerPageSelectHTML);
    const resultsPerPageSelect = document.getElementById("results-per-page-select");

    resultsPerPageSelect.value = Utils.getPreference(this.preferences.resultsPerPage, Utils.defaults.resultsPerPage);
    resultsPerPageSelect.onchange = () => {
      this.changeResultsPerPage(parseInt(resultsPerPageSelect.value));
    };
  }

  createColumnResizeSelect() {
    const columnResizeSelect = document.createElement("select");
    const columnResizeNumberInput = document.getElementById("column-resize-container").querySelector(".number");

    for (let i = 1; i <= 10; i += 1) {
      const option = document.createElement("option");

      option.value = i;
      option.textContent = i;
      columnResizeSelect.appendChild(option);
    }
    columnResizeSelect.value = Utils.getPreference(this.preferences.columnCount, Utils.defaults.columnCount);
    columnResizeSelect.onchange = () => {
      this.changeColumnCount(parseInt(columnResizeSelect.value));
    };
    columnResizeNumberInput.insertAdjacentElement("afterend", columnResizeSelect);
  }

  createMobileSearchBar() {
    document.getElementById("clear-button").remove();
    document.getElementById("search-button").remove();
    document.getElementById("options-checkbox").remove();
    document.getElementById("reset-button").remove();

    Utils.insertStyleHTML(`
        .mobile-toolbar-row {
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

    const searchBar = document.getElementById("favorites-search-box");
    const mobileSearchBarHTML = `
               <div id="mobile-toolbar-row" class="light-green-gradient">
                    <div class="search-bar-container light-green-gradient">
                        <div class="search-bar-items">
                            <div>
                                <div class="circle-icon-container">
                                    <svg class="search-icon" id="search-button" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/>
                                    </svg>
                                </div>
                            </div>
                            <div class="search-bar-input-container">
                                <input type="text" id="favorites-search-box" class="search-bar-input" needs-autocomplete placeholder="Search favorites">
                            </div>
                            <div class="toolbar-button search-clear-container">
                                <div class="circle-icon-container">
                                    <svg id="clear-button" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/>
                                    </svg>
                                </div>
                            </div>
                            <div>
                                <input type="checkbox" id="options-checkbox">
                                <label for="options-checkbox" class="mobile-toolbar-checkbox-label"><svg id="options-menu-icon" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="#5f6368"><path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z"/></svg></label>
                            </div>
                            <div>
                                  <div id="reset-button">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor"><path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-84 31.5-156.5T197-763l56 56q-44 44-68.5 102T160-480q0 134 93 227t227 93q134 0 227-93t93-227q0-67-24.5-125T707-707l56-56q54 54 85.5 126.5T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm-40-360v-440h80v440h-80Z"/></svg>
                                  </div>
                            </div>
                            <div style="display: none;">
                                  <div id="">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor"><path d="M424-320q0-81 14.5-116.5T500-514q41-36 62.5-62.5T584-637q0-41-27.5-68T480-732q-51 0-77.5 31T365-638l-103-44q21-64 77-111t141-47q105 0 161.5 58.5T698-641q0 50-21.5 85.5T609-475q-49 47-59.5 71.5T539-320H424Zm56 240q-33 0-56.5-23.5T400-160q0-33 23.5-56.5T480-240q33 0 56.5 23.5T560-160q0 33-23.5 56.5T480-80Z"/></svg>
                                  </div>
                            </div>
                        </div>
                    </div>
                </div>
        `;

    searchBar.insertAdjacentHTML("afterend", mobileSearchBarHTML);
    searchBar.remove();
    document.getElementById("favorites-search-box").addEventListener("input", () => {
      this.updateVisibilityOfSearchClearButton();
    });
    document.getElementById("options-checkbox").addEventListener("change", (event) => {
      const menuIsSticky = document.getElementById("favorites-search-gallery-content").classList.contains("sticky");
      const margin = event.target.checked ? FavoritesMenu.settings.mobileMenuBaseHeight + FavoritesMenu.settings.mobileMenuExpandedHeight : FavoritesMenu.settings.mobileMenuBaseHeight;

      if (menuIsSticky) {
        Utils.sleep(1);
        this.updateOptionContentMargin(margin);
      }
    });
  }

  createPaginationFooter() {
    Utils.insertStyleHTML(`
      #mobile-footer {
        z-index: 3;
        position: fixed;
        width: 100%;
        bottom: 0;
        left: 0;
        padding: 4px 0px;
        > div {
          text-align: center;
        }

        &.light-green-gradient {
            background: linear-gradient(to top, #aae5a4, #89e180);
        }
        &.dark-green-gradient {
            background: linear-gradient(to top, #5e715e, #293129);

        }
      }

      #mobile-footer-top {
        margin-bottom: 4px;
      }

      #favorites-search-gallery-content {
        margin-bottom: 20px;
      }

      #favorites-load-status {
        font-size: 12px !important;
        >span {
          margin-right: 10px;
        }

        >span:nth-child(odd) {
          font-weight: bold;
        }
      }

      #favorites-load-status-label {
        padding-left: 0 !important;
      }

      #pagination-number:active {
        opacity: 0.5;
        filter: none !important;
      }

      #favorites-pagination-container {
        display: flex;

        >span, >button {
          width: unset;
          flex: 1;
        }
      }
      `, "mobile-footer");
    const footerHTML = `
      <div id="mobile-footer" class="light-green-gradient">
          <div id="mobile-footer-header"></div>
          <div id="mobile-footer-top"></div>
          <div id="mobile-footer-bottom"></div>
      </div>
    `;
    const loadStatus = document.getElementById("favorites-load-status");

    for (const label of Array.from(loadStatus.querySelectorAll("label"))) {
      const span = document.createElement("span");

      span.id = label.id;
      span.className = label.className;
      span.innerHTML = label.innerHTML;
      label.remove();
      loadStatus.appendChild(span);
    }
    Utils.insertFavoritesSearchGalleryHTML("beforeend", footerHTML);
    const footerHeader = document.getElementById("mobile-footer-header");
    const footerTop = document.getElementById("mobile-footer-top");
    const footerBottom = document.getElementById("mobile-footer-bottom");

    footerHeader.appendChild(document.getElementById("help-links-container"));
    footerTop.appendChild(document.getElementById("favorites-load-status"));
    footerBottom.appendChild(document.getElementById("favorites-pagination-placeholder"));
    document.getElementById("whats-new-link").remove();
  }

  createControlsGuide() {
    Utils.insertStyleHTML(`
      #controls-guide {
        display: none;
        z-index: 99999;
        --tap-control: blue;
        --swipe-down: red;
        --swipe-up: green;
        top: 0;
        left: 0;
        background: lightblue;
        width: 100%;
        height: 100%;
        padding: 0;
        margin: 0;
        flex-direction: column;
        position: fixed;

        &.active {
          display: flex;
        }
      }

    #controls-guide-image-container {
      background: black;
      width: 100%;
      height: 100%;
    }

      #controls-guide-sample-image {
        background: lightblue;
        position: relative;
        top: 50%;
        left: 0;
        width: 100%;
        transform: translateY(-50%);
      }

      #controls-guide-top {
        position: relative;
        flex: 3;
      }

      #controls-guide-bottom {
        flex: 1;
        min-height: 25%;
        padding: 10px;
        font-size: 20px;
        align-content: center;
      }

      #controls-guide-tap-container {
        width: 100%;
        height: 100%;
        position: absolute;
      }
      .controls-guide-tap {
        color: white;
          font-size: 50px;
          position: absolute;
          top: 50%;
          height: 65%;
          width: 15%;
          background: var(--tap-control);
          z-index: 9999;
          transform: translateY(-50%);
          writing-mode: vertical-lr;
          text-align: center;
          opacity: 0.8;
      }

      #controls-guide-tap-right {
        right: 0;
      }
      #controls-guide-tap-left {
        left: 0;
      }
      #controls-guide-swipe-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;

        svg {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          width: 25%;
        }
      }

      #controls-guide-swipe-down {
        top: 0;
        color: var(--swipe-down);
        fill: var(--swipe-down);
      }

      #controls-guide-swipe-up {
        bottom: 0;
        color: var(--swipe-up);
        fill: var(--swipe-up);
      }
      `, "controls-guide");
    Utils.insertFavoritesSearchGalleryHTML("beforeend", `
      <div id="controls-guide">
        <div id="controls-guide-top">
          <div id="controls-guide-tap-container">
            <div id="controls-guide-tap-left" class="controls-guide-tap">
                Previous
            </div>
            <div id="controls-guide-tap-right" class="controls-guide-tap">
              Next
            </div>
          </div>
          <div id="controls-guide-image-container">
            <img id="controls-guide-sample-image" src="https://rule34.xxx/images/header2.png">
          </div>
          <div id="controls-guide-swipe-container">
              <svg id="controls-guide-swipe-down" xmlns="http://www.w3.org/2000/svg"  viewBox="0 -960 960 960"><path d="M180-360 40-500l42-42 70 70q-6-27-9-54t-3-54q0-82 27-159t78-141l43 43q-43 56-65.5 121.5T200-580q0 26 3 51.5t10 50.5l65-64 42 42-140 140Zm478 233q-23 8-46.5 7.5T566-131L304-253l18-40q10-20 28-32.5t40-14.5l68-5-112-307q-6-16 1-30.5t23-20.5q16-6 30.5 1t20.5 23l148 407-100 7 131 61q7 3 15 3.5t15-1.5l157-57q31-11 45-41.5t3-61.5l-55-150q-6-16 1-30.5t23-20.5q16-6 30.5 1t20.5 23l55 150q23 63-4.5 122.5T815-184l-157 57Zm-90-265-54-151q-6-16 1-30.5t23-20.5q16-6 30.5 1t20.5 23l55 150-76 28Zm113-41-41-113q-6-16 1-30.5t23-20.5q16-6 30.5 1t20.5 23l41 112-75 28Zm8 78Z"/></svg>
              <svg id="controls-guide-swipe-up" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M245-400q-51-64-78-141t-27-159q0-27 3-54t9-54l-70 70-42-42 140-140 140 140-42 42-65-64q-7 25-10 50.5t-3 51.5q0 70 22.5 135.5T288-443l-43 43Zm413 273q-23 8-46.5 7.5T566-131L304-253l18-40q10-20 28-32.5t40-14.5l68-5-112-307q-6-16 1-30.5t23-20.5q16-6 30.5 1t20.5 23l148 407-100 7 131 61q7 3 15 3.5t15-1.5l157-57q31-11 45-41.5t3-61.5l-55-150q-6-16 1-30.5t23-20.5q16-6 30.5 1t20.5 23l55 150q23 63-4.5 122.5T815-184l-157 57Zm-90-265-54-151q-6-16 1-30.5t23-20.5q16-6 30.5 1t20.5 23l55 150-76 28Zm113-41-41-113q-6-16 1-30.5t23-20.5q16-6 30.5 1t20.5 23l41 112-75 28Zm8 78Z"/></svg>
          </div>
        </div>
        <div id="controls-guide-bottom">
          <ul style="text-align: center; list-style: none;">
            <li style="color: var(--tap-control);">Tap edges to traverse gallery</li>
            <li style="color: var(--swipe-down);">Swipe down to exit gallery</li>
            <li style="color: var(--swipe-up);">Swipe up to open autoplay menu</li>
          </ul>
        </div>
      </div>
        `);
    const controlGuide = document.getElementById("controls-guide");
    const anchor = document.createElement("a");

    anchor.textContent = "Controls";
    anchor.href = "#";
    anchor.onmousedown = (event) => {
      event.preventDefault();
      event.stopPropagation();
      controlGuide.classList.toggle("active", true);
    };
    controlGuide.ontouchstart = (event) => {
      event.preventDefault();
      event.stopPropagation();
      controlGuide.classList.toggle("active", false);
    };

    document.getElementById("help-links-container").insertAdjacentElement("afterbegin", anchor);
    controlGuide.onmousedown = () => {
      controlGuide.classList.toggle("active", false);
    };
  }

  createToggleSwitches() {
    window.addEventListener("postProcess", () => {
      setTimeout(() => {
        this.createMobileToggleSwitchesHelper();
      }, 10);
    }, {
      once: true
    });
  }

  createMobileToggleSwitchesHelper() {
    const checkboxes = Array.from(document.querySelectorAll(".checkbox"))
      .filter(checkbox => checkbox.getBoundingClientRect().width > 0);

    for (const hint of Array.from(document.querySelectorAll(".option-hint"))) {
      hint.remove();
    }

    for (const checkbox of checkboxes) {
      const label = checkbox.querySelector("span");
      const input = checkbox.querySelector("input");
      const slider = document.createElement("span");

      if (input === null) {
        continue;
      }
      slider.className = "slider round";
      checkbox.className = "toggle-switch";
      input.insertAdjacentElement("afterend", slider);

      if (label !== null) {
        label.className = "toggle-switch-label";
      }
    }
    const sortAscendingCheckbox = document.getElementById("sort-ascending-checkbox");

    if (sortAscendingCheckbox !== null) {
      const container = document.createElement("span");
      const toggleSwitch = document.createElement("label");
      const slider = document.createElement("span");

      toggleSwitch.className = "toggle-switch";
      toggleSwitch.style.transform = "scale(0.6)";
      toggleSwitch.style.marginLeft = "-12px";
      slider.className = "slider round";
      sortAscendingCheckbox.insertAdjacentElement("beforebegin", container);
      container.appendChild(toggleSwitch);
      toggleSwitch.appendChild(sortAscendingCheckbox);
      toggleSwitch.appendChild(slider);
      sortAscendingCheckbox.insertAdjacentElement("afterend", slider);
    }
  }

  createMobileSymbolRow() {
    Utils.insertStyleHTML(`
      #mobile-symbol-container {
        display: flex;
        gap: 10px;
        text-align: center;
        height: 0;
        overflow: hidden;
        width: 100%;
        transition: height .2s ease;

        >button {
          font-size: 20px;
          padding: 0;
          margin: 0;
          font-weight: bold;
          text-align: center;
          flex: 1;
          height: 100% !important;
        }

        &.active {
          height: 30px;
        }
      }
      `);
    document.getElementById("left-favorites-panel")
      .insertAdjacentHTML("afterbegin", `
        <div id="mobile-symbol-container">
          <button>-</button>
          <button>*</button>
          <button>_</button>
          <button>(</button>
          <button>)</button>
          <button>~</button>
        </div>
        `);
    const mobileSymbolContainer = document.getElementById("mobile-symbol-container");
    /**
     * @type {HTMLInputElement}
     */

    const searchBar = document.getElementById("favorites-search-box");

    for (const button of Array.from(document.getElementById("mobile-symbol-container").querySelectorAll("button"))) {
      button.addEventListener("blur", async(event) => {
        await Utils.sleep(0);

        if (document.activeElement.id !== "favorites-search-box" && !mobileSymbolContainer.contains(document.activeElement)) {
          mobileSymbolContainer.classList.toggle("active", false);
        }
      });

      button.addEventListener("click", () => {
        const value = searchBar.value;
        const selectionStart = searchBar.selectionStart;

        searchBar.value = value.slice(0, selectionStart) + button.textContent + value.slice(selectionStart);
        this.updateVisibilityOfSearchClearButton();
        searchBar.selectionStart = selectionStart + 1;
        searchBar.selectionEnd = selectionStart + 1;
        searchBar.focus();
      }, {
        passive: true
      });
    }

    window.addEventListener("postProcess", () => {

      searchBar.addEventListener("focus", () => {
        document.getElementById("mobile-symbol-container").classList.toggle("active", true);
      }, {
        passive: true
      });

      searchBar.addEventListener("blur", async(event) => {
        await Utils.sleep(10);

        if (document.activeElement.id !== "favorites-search-box" && !mobileSymbolContainer.contains(document.activeElement)) {
          mobileSymbolContainer.classList.toggle("active", false);
        }
      });
    }, {
      once: true
    });
  }

  updateVisibilityOfSearchClearButton() {
    if (!Utils.onMobileDevice()) {
      return;
    }
    const clearButtonContainer = document.querySelector(".search-clear-container");

    if (clearButtonContainer === null) {
      return;
    }

    const clearButtonIsHidden = getComputedStyle(clearButtonContainer).visibility === "hidden";
    const searchBarIsEmpty = this.inputs.searchBox.value === "";
    const styleId = "search-clear-button-visibility";

    if (searchBarIsEmpty && !clearButtonIsHidden) {
      Utils.insertStyleHTML(".search-clear-container {visibility: hidden}", styleId);
    } else if (!searchBarIsEmpty && clearButtonIsHidden) {
      Utils.insertStyleHTML(".search-clear-container {visibility: visible}", styleId);
    }
  }

  /**
   * @param {Number} margin
   */
  updateOptionContentMargin(margin) {
    margin = margin === undefined ? document.getElementById("favorites-search-gallery-menu").getBoundingClientRect().height + 11 : margin;
    Utils.insertStyleHTML(`
      #favorites-search-gallery-content {
          margin-top: ${margin}px;
      }`, "options-content-margin");
  }

  removeOptionContentMargin() {
    const optionsContentMargin = document.getElementById("options-content-margin-fsg-style");

    if (optionsContentMargin !== null) {
      optionsContentMargin.remove();
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

      #sort-ascending-checkbox {
        width: 20px;
        height: 20px;
      }
      #favorites-pagination-container>button {
        height: 32px;
      }

    `, "desktop");
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
}
