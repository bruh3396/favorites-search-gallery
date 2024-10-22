const savedSearchesHTML = `<div id="saved-searches">
  <style>
    #saved-searches-container {
      margin: 0;
      display: flex;
      flex-direction: column;
      padding: 0;
    }

    #saved-searches-input-container {
      margin-bottom: 10px;
    }

    #saved-searches-input {
      flex: 15 1 auto;
      margin-right: 10px;
    }

    #savedSearches {
      max-width: 100%;

      button {
        flex: 1 1 auto;
        cursor: pointer;
      }
    }

    #saved-searches-buttons button {
      margin-right: 1px;
      margin-bottom: 5px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      height: 35px;

      &:hover {
        filter: brightness(140%);
      }
    }

    #saved-search-list-container {
      direction: rtl;
      max-height: 200px;
      overflow-y: auto;
      overflow-x: hidden;
      margin: 0;
      padding: 0;
    }

    #saved-search-list {
      direction: ltr;
      >li {
        display: flex;
        flex-direction: row;
        cursor: pointer;
        background: rgba(0, 0, 0, .1);

        &:nth-child(odd) {
          background: rgba(0, 0, 0, 0.2);
        }

        >div {
          padding: 4px;
          align-content: center;

          svg {
            height: 20px;
            width: 20px;
          }
        }
      }
    }

    .save-search-label {
      flex: 1000 30px;
      text-align: left;

      &:hover {
        color: white;
        background: #0075FF;
      }
    }

    .edit-saved-search-button {
      text-align: center;
      flex: 1 20px;

      &:hover {
        color: white;
        background: slategray;
      }
    }

    .remove-saved-search-button {
      text-align: center;
      flex: 1 20px;

      &:hover {
        color: white;
        background: #f44336;
      }
    }

    .move-saved-search-to-top-button {
      text-align: center;

      &:hover {
        color: white;
        background: steelblue;
      }
    }
  </style>
  <h2>Saved Searches</h2>
  <div id="saved-searches-buttons">
    <button title="Save custom search" id="save-custom-search-button">Save</button>
    <button id="stop-editing-saved-search-button" style="display: none;">Cancel</button>
    <span>
      <button id="export-saved-search-button">Export</button>
      <button id="import-saved-search-button">Import</button>
    </span>
    <button title="Save result ids as search" id="save-results-button">Save Results</button>
  </div>
  <div id="saved-searches-container">
    <div id="saved-searches-input-container">
      <textarea id="saved-searches-input" spellcheck="false" style="width: 97%;"
        placeholder="Save Custom Search"></textarea>
    </div>
    <div id="saved-search-list-container">
      <ul id="saved-search-list"></ul>
    </div>
  </div>
</div>
`;

class SavedSearches {
  static preferences = {
    textareaWidth: "savedSearchesTextAreaWidth",
    textareaHeight: "savedSearchesTextAreaHeight",
    savedSearches: "savedSearches",
    visibility: "savedSearchVisibility",
    tutorial: "savedSearchesTutorial"
  };
  static localStorageKeys = {
    savedSearches: "savedSearches"
  };
  /**
   * @type {Boolean}
  */
  static get disabled() {
    return !onFavoritesPage() || onMobileDevice();
  }
  /**
   * @type {HTMLTextAreaElement}
   */
  textarea;
  /**
   * @type {HTMLElement}
   */
  savedSearchesList;
  /**
   * @type {HTMLButtonElement}
   */
  stopEditingButton;
  /**
   * @type {HTMLButtonElement}
   */
  saveButton;
  /**
   * @type {HTMLButtonElement}
   */
  importButton;
  /**
   * @type {HTMLButtonElement}
   */
  exportButton;
  /**
   * @type {HTMLButtonElement}
   */
  saveSearchResultsButton;

  constructor() {
    if (SavedSearches.disabled) {
      return;
    }
    this.initialize();
  }

  initialize() {
    this.insertHTMLIntoDocument();
    this.saveButton = document.getElementById("save-custom-search-button");
    this.textarea = document.getElementById("saved-searches-input");
    this.savedSearchesList = document.getElementById("saved-search-list");
    this.stopEditingButton = document.getElementById("stop-editing-saved-search-button");
    this.importButton = document.getElementById("import-saved-search-button");
    this.exportButton = document.getElementById("export-saved-search-button");
    this.saveSearchResultsButton = document.getElementById("save-results-button");
    this.addEventListeners();
    this.loadSavedSearches();
  }

  insertHTMLIntoDocument() {
    const showSavedSearches = getPreference(SavedSearches.preferences.visibility, false);
    const savedSearchesContainer = document.getElementById("right-favorites-panel");

    savedSearchesContainer.insertAdjacentHTML("beforeend", savedSearchesHTML);
    document.getElementById("right-favorites-panel").style.display = showSavedSearches ? "block" : "none";
    const options = addOptionToFavoritesPage(
      "show-saved-searches",
      "Saved Searches",
      "Toggle saved searches",
      showSavedSearches,
      (e) => {
        savedSearchesContainer.style.display = e.target.checked ? "block" : "none";
        setPreference(SavedSearches.preferences.visibility, e.target.checked);
      },
      true
    );

    document.getElementById("show-options").insertAdjacentElement("afterend", options);
  }

  addEventListeners() {
    this.saveButton.onclick = () => {
      this.saveSearch(this.textarea.value.trim());
    };
    this.textarea.addEventListener("keydown", (event) => {
      switch (event.key) {
        case "Enter":
          if (awesompleteIsUnselected(this.textarea)) {
            event.preventDefault();
            this.saveButton.click();
            this.textarea.blur();
            setTimeout(() => {
              this.textarea.focus();
            }, 100);
          }
          break;

        case "Escape":
          if (awesompleteIsUnselected(this.textarea) && this.stopEditingButton.style.display === "block") {
            this.stopEditingButton.click();
          }
          break;

        default:
          break;
      }
    });
    this.exportButton.onclick = () => {
      this.exportSavedSearches();
    };
    this.importButton.onclick = () => {
      this.importSavedSearches();
    };
    this.saveSearchResultsButton.onclick = () => {
      this.saveSearchResultsAsCustomSearch();
    };
  }

  /**
   * @param {String} newSavedSearch
   * @param {Boolean} updateLocalStorage
   */
  saveSearch(newSavedSearch, updateLocalStorage = true) {
    if (newSavedSearch === "" || newSavedSearch === undefined) {
      return;
    }
    const newListItem = document.createElement("li");
    const savedSearchLabel = document.createElement("div");
    const editButton = document.createElement("div");
    const removeButton = document.createElement("div");
    const moveToTopButton = document.createElement("div");

    savedSearchLabel.innerText = newSavedSearch;
    editButton.innerHTML = ICONS.edit;
    removeButton.innerHTML = ICONS.delete;
    moveToTopButton.innerHTML = ICONS.upArrow;
    savedSearchLabel.className = "save-search-label";
    editButton.className = "edit-saved-search-button";
    removeButton.className = "remove-saved-search-button";
    moveToTopButton.className = "move-saved-search-to-top-button";
    newListItem.appendChild(removeButton);
    newListItem.appendChild(editButton);
    newListItem.appendChild(moveToTopButton);
    newListItem.appendChild(savedSearchLabel);
    this.savedSearchesList.insertBefore(newListItem, this.savedSearchesList.firstChild);
    savedSearchLabel.onclick = () => {
      const searchBox = document.getElementById("favorites-search-box");

      navigator.clipboard.writeText(savedSearchLabel.innerText);

      if (searchBox === null) {
        return;
      }

      if (searchBox.value !== "") {
        searchBox.value += " ";
      }
      searchBox.value += savedSearchLabel.innerText;
    };
    removeButton.onclick = () => {
      if (this.inEditMode()) {
        alert("Cancel current edit before removing another search");
        return;
      }

      if (confirm(`Remove saved search: ${savedSearchLabel.innerText} ?`)) {
        this.savedSearchesList.removeChild(newListItem);
        this.storeSavedSearches();
      }
    };
    editButton.onclick = () => {
      if (this.inEditMode()) {
        alert("Cancel current edit before editing another search");
      } else {
        this.editSavedSearches(savedSearchLabel, newListItem);
      }
    };
    moveToTopButton.onclick = () => {
      if (this.inEditMode()) {
        alert("Cancel current edit before moving this search to the top");
        return;
      }
      newListItem.parentElement.insertAdjacentElement("afterbegin", newListItem);
      this.storeSavedSearches();
    };
    this.stopEditingButton.onclick = () => {
      this.stopEditingSavedSearches(newListItem);
    };
    this.textarea.value = "";

    if (updateLocalStorage) {
      this.storeSavedSearches();
    }
  }

  /**
   * @param {HTMLLabelElement} savedSearchLabel
   */
  editSavedSearches(savedSearchLabel) {
    this.textarea.value = savedSearchLabel.innerText;
    this.saveButton.textContent = "Save Changes";
    this.textarea.focus();
    this.exportButton.style.display = "none";
    this.importButton.style.display = "none";
    this.stopEditingButton.style.display = "";
    this.saveButton.onclick = () => {
      savedSearchLabel.innerText = this.textarea.value.trim();
      this.storeSavedSearches();
      this.stopEditingButton.click();
    };
  }

  /**
   * @param {HTMLElement} newListItem
   */
  stopEditingSavedSearches(newListItem) {
    this.saveButton.textContent = "Save";
    this.saveButton.onclick = () => {
      this.saveSearch(this.textarea.value.trim());
    };
    this.textarea.value = "";
    this.exportButton.style.display = "";
    this.importButton.style.display = "";
    this.stopEditingButton.style.display = "none";
    newListItem.style.border = "";
  }

  storeSavedSearches() {
    const savedSearches = JSON.stringify(Array.from(document.getElementsByClassName("save-search-label"))
      .map(element => element.innerText));

    localStorage.setItem(SavedSearches.localStorageKeys.savedSearches, savedSearches);
  }

  loadSavedSearches() {
    const savedSearches = JSON.parse(localStorage.getItem(SavedSearches.localStorageKeys.savedSearches)) || [];
    const firstUse = getPreference(SavedSearches.preferences.tutorial, true);

    setPreference(SavedSearches.preferences.tutorial, false);

    if (firstUse && savedSearches.length === 0) {
      this.createTutorialSearches();
      return;
    }

    for (let i = savedSearches.length - 1; i >= 0; i -= 1) {
      this.saveSearch(savedSearches[i], false);
    }
  }

  createTutorialSearches() {
    const searches = [];

    window.addEventListener("startedFetchingFavorites", async() => {
      await sleep(1000);
      const postIds = getAllVisibleThumbs().map(thumb => thumb.id);

      shuffleArray(postIds);

      const exampleSearch = `( EXAMPLE: ~ ${postIds.slice(0, 9).join(" ~ ")} ) ( male* ~ female* ~ 1boy ~ 1girls )`;

      searches.push(exampleSearch);

      for (let i = searches.length - 1; i >= 0; i -= 1) {
        this.saveSearch(searches[i]);
      }
    }, {
      once: true
    });
  }

  /**
   * @returns {Boolean}
   */
  inEditMode() {
    return this.stopEditingButton.style.display !== "none";
  }

  exportSavedSearches() {
    const savedSearchString = Array.from(document.getElementsByClassName("save-search-label")).map(search => search.innerText).join("\n");

    navigator.clipboard.writeText(savedSearchString);
    alert("Copied saved searches to clipboard");
  }

  importSavedSearches() {
    const doesNotHaveSavedSearches = this.savedSearchesList.querySelectorAll("li").length === 0;

    if (doesNotHaveSavedSearches || confirm("Are you sure you want to import saved searches? This will overwrite current saved searches.")) {
      const savedSearches = this.textarea.value.split("\n");

      this.savedSearchesList.innerHTML = "";

      for (let i = savedSearches.length - 1; i >= 0; i -= 1) {
        this.saveSearch(savedSearches[i]);
      }
      this.storeSavedSearches();
    }
  }

  saveSearchResultsAsCustomSearch() {
    const searchResultIds = Array.from(ThumbNode.allThumbNodes.values())
      .filter(thumbNode => thumbNode.matchedByMostRecentSearch)
      .map(thumbNode => thumbNode.id);

    if (searchResultIds.length === 0) {
      return;
    }

    if (searchResultIds.length > 300) {
      if (!confirm(`Are you sure you want to save ${searchResultIds.length} ids as one search?`)) {
        return;
      }
    }
    const customSearch = `( ${searchResultIds.join(" ~ ")} )`;

    this.saveSearch(customSearch);
  }
}

const savedSearches = new SavedSearches();
