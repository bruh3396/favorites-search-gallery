class SavedSearches {
  static localStorageKeys = {
    savedSearches: "savedSearches"
  };
  /** @type {HTMLTextAreaElement} */
  textarea;
  /** @type {HTMLElement} */
  savedSearchesList;
  /** @type {HTMLButtonElement} */
  stopEditingButton;
  /** @type {HTMLButtonElement} */
  saveButton;
  /** @type {HTMLButtonElement} */
  importButton;
  /** @type {HTMLButtonElement} */
  exportButton;
  /** @type {HTMLButtonElement} */
  saveSearchResultsButton;

  constructor() {
    if (Flags.savedSearchesDisabled) {
      return;
    }
    this.insertHTML();
    this.extractHTMLElements();
    this.addEventListeners();
    this.loadSavedSearches();
  }

  insertHTML() {
    const showSavedSearches = Boolean(Preferences.savedSearchVisibility.value);
    const savedSearchesContainer = document.getElementById("right-favorites-panel");

    Utils.insertHTMLAndExtractStyle(savedSearchesContainer, "beforeend", HTMLStrings.savedSearches);
    document.getElementById("right-favorites-panel").style.display = showSavedSearches ? "block" : "none";
    const options = Utils.createFavoritesOption(
      "show-saved-searches",
      "Saved Searches",
      "Toggle saved searches",
      showSavedSearches,
      (e) => {
        savedSearchesContainer.style.display = e.target.checked ? "block" : "none";
        Preferences.savedSearchVisibility.set(e.target.checked);
      },
      true
    );

    document.getElementById("bottom-panel-2").insertAdjacentElement("afterbegin", options);
  }

  extractHTMLElements() {
    this.saveButton = document.getElementById("save-custom-search-button");
    this.textarea = document.getElementById("saved-searches-input");
    this.savedSearchesList = document.getElementById("saved-search-list");
    this.stopEditingButton = document.getElementById("stop-editing-saved-search-button");
    this.importButton = document.getElementById("import-saved-search-button");
    this.exportButton = document.getElementById("export-saved-search-button");
    this.saveSearchResultsButton = document.getElementById("save-results-button");
  }

  addEventListeners() {
    this.saveButton.onclick = () => {
      this.saveSearch(this.textarea.value.trim());
      this.storeSavedSearches();
    };
    this.textarea.addEventListener("keydown", (event) => {
      switch (event.key) {
        case "Enter":
          if (Utils.awesompleteIsUnselected(this.textarea)) {
            event.preventDefault();
            this.saveButton.click();
            this.textarea.blur();
            setTimeout(() => {
              this.textarea.focus();
            }, 100);
          }
          break;

        case "Escape":
          if (Utils.awesompleteIsUnselected(this.textarea) && this.stopEditingButton.style.display === "block") {
            this.stopEditingButton.click();
          }
          break;

        default:
          break;
      }
    }, {
      passive: true
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
   */
  saveSearch(newSavedSearch) {
    if (newSavedSearch === "" || newSavedSearch === undefined) {
      return;
    }
    const newListItem = document.createElement("li");
    const savedSearchLabel = document.createElement("div");
    const editButton = document.createElement("div");
    const removeButton = document.createElement("div");
    const moveToTopButton = document.createElement("div");

    savedSearchLabel.innerText = newSavedSearch;
    editButton.innerHTML = Icons.edit;
    removeButton.innerHTML = Icons.delete;
    moveToTopButton.innerHTML = Icons.upArrow;
    editButton.title = "Edit";
    removeButton.title = "Delete";
    moveToTopButton.title = "Move to top";
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
      const initialSearchBoxValue = Utils.getMainSearchBoxValue();
      const optionalSpace = initialSearchBoxValue === "" ? "" : " ";

      navigator.clipboard.writeText(savedSearchLabel.innerText);
      Utils.setMainSearchBoxValue(`${initialSearchBoxValue}${optionalSpace}${savedSearchLabel.innerText}`);
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
      this.storeSavedSearches();
    };
    this.textarea.value = "";
    this.exportButton.style.display = "";
    this.importButton.style.display = "";
    this.stopEditingButton.style.display = "none";
    newListItem.style.border = "";
  }

  storeSavedSearches() {
    localStorage.setItem(SavedSearches.localStorageKeys.savedSearches, JSON.stringify(Utils.getSavedSearchValues()));
  }

  loadSavedSearches() {
    const savedSearches = JSON.parse(localStorage.getItem(SavedSearches.localStorageKeys.savedSearches) || "[]");
    const firstUse = Boolean(Preferences.savedSearchTutorial.value);

    Preferences.savedSearchTutorial.set(false);

    if (firstUse && savedSearches.length === 0) {
      this.createTutorialSearches();
      return;
    }

    for (let i = savedSearches.length - 1; i >= 0; i -= 1) {
      this.saveSearch(savedSearches[i]);
    }
  }

  createTutorialSearches() {
    /** @type {String[]} */
    const searches = [];

    Events.favorites.startedFetchingFavorites.on(async() => {
      await Utils.sleep(1000);
      const postIds = Utils.getAllThumbs().map(thumb => thumb.id);

      Utils.shuffleArray(postIds);

      const exampleSearch = `( EXAMPLE: ~ ${postIds.slice(0, 9).join(" ~ ")} ) ( male* ~ female* ~ 1boy ~ 1girls )`;

      searches.push(exampleSearch);

      for (let i = searches.length - 1; i >= 0; i -= 1) {
        this.saveSearch(searches[i]);
      }
      this.storeSavedSearches();
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
    const searchResultIds = Array.from(Post.allPosts.values())
      .filter(post => post.matchedByLatestSearch)
      .map(post => post.id);

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
    this.storeSavedSearches();
  }
}
