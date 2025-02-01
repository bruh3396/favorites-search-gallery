class SearchBox {
  /**
   * @type {HTMLTextAreaElement | HTMLInputElement}
   */
  searchBox;
  /**
   * @type {HTMLElement | null}
   */
  parent;
  /**
   * @type {String}
   */
  id;

  constructor() {
    this.parent = document.getElementById("left-favorites-panel-top-row");
    this.id = Utils.mainSearchBoxId;
    this.searchBox = this.createMainSearchBox();
  }

  /**
   * @returns {HTMLTextAreaElement}
   */
  createMainSearchBox() {
    const searchBox = document.createElement("textarea");

    searchBox.id = this.id;
    searchBox.placeholder = "Search Favorites";
    searchBox.spellcheck = false;
    searchBox.dataset.action = "getSearchResults";
    searchBox.value = "";
    searchBox.addEventListener("updatedProgrammatically", () => {
      // SearchHistoryOld.updateLastEditedSearchQuery(searchBox.value);
    });
    searchBox.addEventListener("keyup", (event) => {
      if (event.key.length === 1 || event.key === "Backspace" || event.key === "Delete") {
        // SearchHistoryOld.updateLastEditedSearchQuery(searchBox.value);
      }
    });
    searchBox.addEventListener("keydown", (event) => {
      switch (event.key) {
        case "Enter":
          if (Utils.awesompleteIsSelected(searchBox)) {
            return;
          }
          event.preventDefault();

          if (event.repeat) {
            return;
          }
          searchBox.dispatchEvent(new CustomEvent("controller", {
            bubbles: true,
            detail: searchBox.value
          }));
          break;

        case "ArrowUp":

        case "ArrowDown":
          // FavoritesMenuEventHandler.navigateSearchHistory(event);
          break;

        default:
          // SearchHistoryOld.resetSearchHistoryIndex();
          break;
      }
    });

    if (this.parent !== null) {
      this.parent.insertAdjacentElement("afterend", searchBox);
    }
    return searchBox;
  }

  /**
   * @returns {HTMLInputElement}
   */
  createMobileSearchBar() {
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
                      <input type="text" id="${this.id}" class="search-bar-input" needs-autocomplete placeholder="Search Favorites">
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

    if (this.parent !== null) {
      this.parent.insertAdjacentHTML("afterbegin", html);
    }
    const searchBar = document.getElementById(id);

    if (searchBar === null || !(searchBar instanceof HTMLInputElement)) {
      return document.createElement("input");
    }
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
    return searchBar;
  }
}
