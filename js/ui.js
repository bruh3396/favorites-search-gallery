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

        textarea {
          max-width: 100%;
          height: 50px;
          width: 95%;
          padding: 10px;
          border-radius: 6px;
          resize: vertical;
        }
      }
    }

    #left-favorites-panel {
      >div:first-of-type {
        margin-bottom: 5px;
        min-width: 560px;

        >label {
          align-content: center;
          margin-right: 5px;
          margin-top: 4px;
        }

        button {
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

    .checkbox {
      display: block;
      cursor: pointer;
      padding: 2px 6px 2px 0px;
      border-radius: 4px;
      margin-left: -3px;
      height: 27px;

      &:hover {
        color: #000;
        background: #93b393;
        text-shadow: none;
        cursor: pointer;
      }

      input {
        vertical-align: -5px;
        cursor: pointer;
      }

      input[type="checkbox"] {
        width: 20px;
        height: 20px;
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
      z-index: 9998;
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
    }

    .thumb-node {
      position: relative;

      >a,
      >div {
        position: relative;

        &:has(.remove-button:hover) {
          outline: 3px solid red;

          >.remove-button {
            box-shadow: 0px 3px 0px 0px red;
            color: red;
          }
        }
      }

      img, canvas {
        width: 100%;
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
      margin-top: 10px;
      display: flex;
      flex-flow: row wrap;
      width: 60%;

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
      >button {
        background: transparent;
        margin: 0px 2px;
        padding: 2px 6px;
        border: 1px solid white;
        cursor: pointer;
        font-size: 14px;
        color: white;
        font-weight: normal;

        &:hover {
          background-color: #93b393;
        }

        &.selected {
          border: none;
          font-weight: bold;
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
  </style>
  <div id="favorites-top-bar-panels" style="display: flex;">
    <div id="left-favorites-panel">
      <h2 style="display: inline;">Search Favorites</h2>
      <span style="margin-left: 10px;">
        <label id="match-count-label"></label>
        <label id="favorites-fetch-progress-label" style="color: #3498db;"></label>
      </span>
      <div id="left-favorites-panel-top-row">
        <button title="Search favorites\nctrl+click: Search all posts" id="search-button">Search</button>
        <button title="Show results not matched by search" id="invert-button">Invert</button>
        <button title="Shuffle order of search results" id="shuffle-button">Shuffle</button>
        <button title="Clear the search box" id="clear-button">Clear</button>
        <button title="Save results as search" id="save-search-button" style="display: none;">Save</button>
        <button title="Reset saved favorites" id="reset-button">Reset</button>
        <span id="find-favorite">
          <button title="Scroll to favorite using its ID" id="find-favorite-button"
            style="white-space: nowrap; ">Find</button>
          <input type="number" id="find-favorite-input" type="text" placeholder="ID">
        </span>
        <span id="help-links-container">
          <a href="https://github.com/bruh3396/favorites-search-gallery#controls" target="_blank">Help</a>
        </span>
      </div>
      <div>
        <textarea name="tags" id="favorites-search-box" placeholder="Search by Tags or IDs"
          spellcheck="false">( video ~ animated* ~ highres ~ absurd_res* ) -low_res* ( 1girls ~ female* ) -tagme </textarea>
      </div>

      <div id="left-favorites-panel-bottom-row" style="display: flex; flex-flow: row-wrap;">
        <div id="favorite-options-container">
          <div id="show-options"><label class="checkbox" title="Toggle options"><input type="checkbox"
                id="options-checkbox"> Options</label></div>
          <div id="favorite-options">
            <div><label class="checkbox" title="Toggle remove buttons"><input type="checkbox" id="show-remove-buttons">
                Remove Buttons</label></div>
            <div><label class="checkbox" title="Exclude blacklisted tags from search"><input type="checkbox"
                  id="filter-blacklist-checkbox"> Exclude Blacklist</label></div>
          </div>
          <div id="additional-favorite-options">
            <div id="column-resize-container">
              <span>
                <label>Columns</label>
                <button id="column-resize-minus">-</button>
                <input type="number" id="column-resize-input" min="2" max="20">
                <button id="column-resize-plus">+</button>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div id="right-favorites-panel" style="flex: 2;"></div>
  </div>
  <div class="loading-wheel" id="loading-wheel" style="display: none;"></div>
</div>
`;

if (!onPostPage()) {
  document.getElementById("content").insertAdjacentHTML("beforebegin", uiHTML);
}
const FAVORITE_OPTIONS = [document.getElementById("favorite-options"), document.getElementById("additional-favorite-options")];
const MAX_SEARCH_HISTORY_LENGTH = 100;
const FAVORITE_SEARCH_PREFERENCES = {
  textareaWidth: "searchTextareaWidth",
  textareaHeight: "searchTextareaHeight",
  showRemoveButtons: "showRemoveButtons",
  showOptions: "showOptions",
  filterBlacklist: "filterBlacklistCheckbox",
  searchHistory: "favoritesSearchHistory",
  findFavorite: "findFavorite",
  thumbSize: "thumbSize",
  columnCount: "columnCount"
};
const FAVORITE_SEARCH_LOCAL_STORAGE = {
  searchHistory: "favoritesSearchHistory"
};
const FAVORITE_SEARCH_BUTTONS = {
  search: document.getElementById("search-button"),
  shuffle: document.getElementById("shuffle-button"),
  clear: document.getElementById("clear-button"),
  invert: document.getElementById("invert-button"),
  saveSearch: document.getElementById("save-search-button"),
  reset: document.getElementById("reset-button"),
  findFavorite: document.getElementById("find-favorite-button"),
  columnPlus: document.getElementById("column-resize-plus"),
  columnMinus: document.getElementById("column-resize-minus")
};
const FAVORITE_SEARCH_CHECKBOXES = {
  showOptions: document.getElementById("options-checkbox"),
  showRemoveButtons: document.getElementById("show-remove-buttons"),
  filterBlacklist: document.getElementById("filter-blacklist-checkbox")
};
const FAVORITE_SEARCH_INPUTS = {
  searchBox: document.getElementById("favorites-search-box"),
  findFavorite: document.getElementById("find-favorite-input"),
  columnCount: document.getElementById("column-resize-input")
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
}

function loadFavoritesPagePreferences() {
  const height = getPreference(FAVORITE_SEARCH_PREFERENCES.textareaHeight);
  const width = getPreference(FAVORITE_SEARCH_PREFERENCES.textareaWidth);

  if (height !== null && width !== null) {
    /*
     * FAVORITE_SEARCH_INPUTS.searchBox.style.width = width + "px"
     * FAVORITE_SEARCH_INPUTS.searchBox.style.height = height + "px"
     */
  }
  const removeButtonsAreVisible = getPreference(FAVORITE_SEARCH_PREFERENCES.showRemoveButtons, false) && userIsOnTheirOwnFavoritesPage();

  FAVORITE_SEARCH_CHECKBOXES.showRemoveButtons.checked = removeButtonsAreVisible;
  setTimeout(() => {
    updateVisibilityOfAllRemoveButtons();
  }, 100);
  const showOptions = getPreference(FAVORITE_SEARCH_PREFERENCES.showOptions, false);

  FAVORITE_SEARCH_CHECKBOXES.showOptions.checked = showOptions;
  toggleFavoritesOptions(showOptions);

  if (userIsOnTheirOwnFavoritesPage()) {
    FAVORITE_SEARCH_CHECKBOXES.filterBlacklist.checked = getPreference(FAVORITE_SEARCH_PREFERENCES.filterBlacklist, false);
    favoritesLoader.toggleTagBlacklistExclusion(FAVORITE_SEARCH_CHECKBOXES.filterBlacklist.checked);
  } else {
    FAVORITE_SEARCH_CHECKBOXES.filterBlacklist.checked = true;
    FAVORITE_SEARCH_CHECKBOXES.filterBlacklist.parentElement.style.display = "none";
  }
  searchHistory = JSON.parse(localStorage.getItem(FAVORITE_SEARCH_LOCAL_STORAGE.searchHistory)) || [];

  if (searchHistory.length > 0) {
    FAVORITE_SEARCH_INPUTS.searchBox.value = searchHistory[0];
  }
  FAVORITE_SEARCH_INPUTS.findFavorite.value = getPreference(FAVORITE_SEARCH_PREFERENCES.findFavorite, "");
  FAVORITE_SEARCH_INPUTS.columnCount.value = getPreference(FAVORITE_SEARCH_PREFERENCES.columnCount, 7);
  changeColumnCount(FAVORITE_SEARCH_INPUTS.columnCount.value);
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
  FAVORITE_SEARCH_BUTTONS.search.onclick = (event) => {
    const query = FAVORITE_SEARCH_INPUTS.searchBox.value;

    if (event.ctrlKey) {
      const queryWithFormattedIds = query.replace(/(?:^|\s)(\d+)(?:$|\s)/g, " id:$1 ");
      const postPageURL = `https://rule34.xxx/index.php?page=post&s=list&tags=${encodeURIComponent(queryWithFormattedIds)}`;

      window.open(postPageURL);
    } else {
      favoritesLoader.searchFavorites(query);
      addToFavoritesSearchHistory(query);
    }
  };
  FAVORITE_SEARCH_INPUTS.searchBox.addEventListener("keydown", (event) => {
    switch (event.key) {
      case "Enter":
        if (awesompleteIsUnselected(FAVORITE_SEARCH_INPUTS.searchBox)) {
          event.preventDefault();
          FAVORITE_SEARCH_BUTTONS.search.click();
        } else {
          clearAwesompleteSelection(FAVORITE_SEARCH_INPUTS.searchBox);
        }
        break;

      case "ArrowUp":

      case "ArrowDown":
        if (awesompleteIsHidden(FAVORITE_SEARCH_INPUTS.searchBox)) {
          event.preventDefault();
          traverseFavoritesSearchHistory(event.key);
        } else {
          updateLastSearchQuery();
        }
        break;

      case "Tab":
        {
          event.preventDefault();
          const awesomplete = FAVORITE_SEARCH_INPUTS.searchBox.parentElement;
          const searchSuggestions = Array.from(awesomplete.querySelectorAll("li")) || [];

          if (!awesompleteIsUnselected(FAVORITE_SEARCH_INPUTS.searchBox)) {
            const selectedSearchSuggestion = searchSuggestions.find(suggestion => suggestion.getAttribute("aria-selected") === "true");

            completeSearchSuggestion(selectedSearchSuggestion);
          } else if (!awesompleteIsHidden(FAVORITE_SEARCH_INPUTS.searchBox)) {
            completeSearchSuggestion(searchSuggestions[0]);
          }
          break;
        }

      case "Escape":
        if (!awesompleteIsHidden(FAVORITE_SEARCH_INPUTS.searchBox)) {
          favoritesLoader.hideAwesomplete();
        }
        break;

      default:
        updateLastSearchQuery();
        break;
    }
  });
  FAVORITE_SEARCH_INPUTS.searchBox.addEventListener("wheel", (event) => {
    const direction = event.deltaY > 0 ? "ArrowDown" : "ArrowUp";

    traverseFavoritesSearchHistory(direction);
    event.preventDefault();
  });
  FAVORITE_SEARCH_CHECKBOXES.showOptions.onchange = () => {
    toggleFavoritesOptions(FAVORITE_SEARCH_CHECKBOXES.showOptions.checked);
    setPreference(FAVORITE_SEARCH_PREFERENCES.showOptions, FAVORITE_SEARCH_CHECKBOXES.showOptions.checked);
  };
  const resizeObserver = new ResizeObserver(entries => {
    for (const entry of entries) {
      setPreference(FAVORITE_SEARCH_PREFERENCES.textareaWidth, entry.contentRect.width);
      setPreference(FAVORITE_SEARCH_PREFERENCES.textareaHeight, entry.contentRect.height);
    }
  });

  resizeObserver.observe(FAVORITE_SEARCH_INPUTS.searchBox);
  FAVORITE_SEARCH_CHECKBOXES.showRemoveButtons.onchange = () => {
    updateVisibilityOfAllRemoveButtons();
    setPreference(FAVORITE_SEARCH_PREFERENCES.showRemoveButtons, FAVORITE_SEARCH_CHECKBOXES.showRemoveButtons.checked);
  };
  FAVORITE_SEARCH_BUTTONS.shuffle.onclick = () => {
    favoritesLoader.shuffleSearchResults();
  };
  FAVORITE_SEARCH_BUTTONS.clear.onclick = () => {
    FAVORITE_SEARCH_INPUTS.searchBox.value = "";
  };
  FAVORITE_SEARCH_CHECKBOXES.filterBlacklist.onchange = () => {
    setPreference(FAVORITE_SEARCH_PREFERENCES.filterBlacklist, FAVORITE_SEARCH_CHECKBOXES.filterBlacklist.checked);
    favoritesLoader.toggleTagBlacklistExclusion(FAVORITE_SEARCH_CHECKBOXES.filterBlacklist.checked);
    favoritesLoader.searchFavorites();
  };
  FAVORITE_SEARCH_BUTTONS.invert.onclick = () => {
    favoritesLoader.invertSearchResults();
  };
  FAVORITE_SEARCH_BUTTONS.saveSearch.onclick = () => {
    copySearchResultIdsToClipboard();
  };
  FAVORITE_SEARCH_BUTTONS.reset.onclick = () => {
    favoritesLoader.deletePersistentData();
  };
  FAVORITE_SEARCH_INPUTS.findFavorite.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      scrollToThumb(FAVORITE_SEARCH_INPUTS.findFavorite.value);
      setPreference(FAVORITE_SEARCH_PREFERENCES.findFavorite, postId);
    }
  });
  FAVORITE_SEARCH_BUTTONS.findFavorite.onclick = () => {
    scrollToThumb(FAVORITE_SEARCH_INPUTS.findFavorite.value);
    setPreference(FAVORITE_SEARCH_PREFERENCES.findFavorite, postId);
  };
  FAVORITE_SEARCH_BUTTONS.columnPlus.onclick = () => {
    changeColumnCount(parseInt(FAVORITE_SEARCH_INPUTS.columnCount.value) + 1);
  };
  FAVORITE_SEARCH_BUTTONS.columnMinus.onclick = () => {
    changeColumnCount(parseInt(FAVORITE_SEARCH_INPUTS.columnCount.value) - 1);
  };
  FAVORITE_SEARCH_INPUTS.columnCount.onchange = () => {
    changeColumnCount(parseInt(FAVORITE_SEARCH_INPUTS.columnCount.value));
  };
}

function completeSearchSuggestion(suggestion) {
  suggestion = suggestion.innerText.replace(/ \([0-9]+\)$/, "");
  favoritesLoader.hideAwesomplete();
  FAVORITE_SEARCH_INPUTS.searchBox.value = FAVORITE_SEARCH_INPUTS.searchBox.value.replace(/\S+$/, `${suggestion} `);
}

function hideRemoveLinksWhenNotOnOwnFavoritesPage() {
  if (!userIsOnTheirOwnFavoritesPage()) {
    FAVORITE_SEARCH_CHECKBOXES.showRemoveButtons.parentElement.style.display = "none";
  }
}

function updateLastSearchQuery() {
  if (FAVORITE_SEARCH_INPUTS.searchBox.value !== lastSearchQuery) {
    lastSearchQuery = FAVORITE_SEARCH_INPUTS.searchBox.value;
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
  localStorage.setItem(FAVORITE_SEARCH_LOCAL_STORAGE.searchHistory, JSON.stringify(searchHistory));
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
      FAVORITE_SEARCH_INPUTS.searchBox.value = lastSearchQuery;
    } else {
      FAVORITE_SEARCH_INPUTS.searchBox.value = searchHistory[searchHistoryIndex];
    }
  }
}

function copySearchResultIdsToClipboard() {
  const customSearch = [];

  for (const thumb of getAllThumbs()) {
    customSearch.push(thumb.id);
  }
  navigator.clipboard.writeText(`( ${customSearch.join(" ~ ")} )`);
  alert("Copied current search Ids to clipboard");
}

function toggleFavoritesOptions(value) {
  for (const option of FAVORITE_OPTIONS) {
    option.style.display = value ? "block" : "none";
  }
}

function changeColumnCount(count) {
  count = clamp(parseInt(count), 2, 20);
  injectStyleHTML(`
    #content {
      grid-template-columns: repeat(${count}, 1fr) !important;
    }
    `, "columnCount");
  FAVORITE_SEARCH_INPUTS.columnCount.value = count;
  setPreference(FAVORITE_SEARCH_PREFERENCES.columnCount, count);
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
