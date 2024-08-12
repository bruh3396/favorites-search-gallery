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

    #saved-search-listContainer {
      direction: rtl;
      max-height: 200px;
      overflow-y: auto;
      overflow-x: hidden;
      margin: 0;
      padding: 0;
    }

    #saved-search-list {
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
    <button id="save-custom-search-button">Save</button>
    <button id="stop-editing-saved-search-button" style="display: none;">Cancel</button>
    <span>
      <button id="export-saved-search-button">Export</button>
      <button id="import-saved-search-button">Import</button>
    </span>
  </div>
  <div id="saved-searches-container">
    <div id="saved-searches-input-container">
      <textarea id="saved-searches-input" spellcheck="false" style="width: 97%;"
        placeholder="Save Custom Search"></textarea>
    </div>
    <div id="saved-search-listContainer">
      <div id="saved-search-list"></div>
    </div>
  </div>
</div>
`;

class SavedSearches {
  static preferences = {
    textareaWidth: "savedSearchesTextAreaWidth",
    textareaHeight: "savedSearchesTextAreaHeight",
    savedSearches: "savedSearches",
    visibility: "savedSearchVisibility"
  };
  static localStorageKeys = {
    savedSearches: "savedSearches"
  };
  static icons = {
    delete: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"feather feather-trash\"><polyline points=\"3 6 5 6 21 6\"></polyline><path d=\"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2\"></path></svg>",
    edit: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"feather feather-edit\"><path d=\"M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7\"></path><path d=\"M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z\"></path></svg>",
    copy: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"feather feather-copy\"><rect x=\"9\" y=\"9\" width=\"13\" height=\"13\" rx=\"2\" ry=\"2\"></rect><path d=\"M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1\"></path></svg>",
    upArrow: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"feather feather-arrow-up\"><line x1=\"12\" y1=\"19\" x2=\"12\" y2=\"5\"></line><polyline points=\"5 12 12 5 19 12\"></polyline></svg>"
  };
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

  constructor() {
    if (onPostPage()) {
      return;
    }
    this.insertHTMLIntoDocument();
    this.saveButton = document.getElementById("save-custom-search-button");
    this.textarea = document.getElementById("saved-searches-input");
    this.savedSearchesList = document.getElementById("saved-search-list");
    this.stopEditingButton = document.getElementById("stop-editing-saved-search-button");
    this.importButton = document.getElementById("import-saved-search-button");
    this.exportButton = document.getElementById("export-saved-search-button");
    this.addEventListenersToButtons();
    this.loadSavedSearches();
  }

  insertHTMLIntoDocument() {
    const showSavedSeaches = getPreference(SavedSearches.preferences.visibility, true);
    let placeToInsertSavedSearches = document.getElementById("right-favorites-panel");

    if (placeToInsertSavedSearches === null) {
      placeToInsertSavedSearches = document.getElementById("favorites-top-bar");
    }
    placeToInsertSavedSearches.insertAdjacentHTML("beforeend", savedSearchesHTML);
    document.getElementById("saved-searches").style.display = showSavedSeaches ? "block" : "none";
    const options = addOptionToFavoritesPage(
      "savedSearchesCheckbox",
      "Saved Searches",
      "Toggle saved searches",
      showSavedSeaches,
      (e) => {
        document.getElementById("saved-searches").style.display = e.target.checked ? "block" : "none";
        setPreference(SavedSearches.preferences.visibility, e.target.checked);
      },
      true
    );

    document.getElementById("show-options").insertAdjacentElement("afterend", options);
  }

  addEventListenersToButtons() {
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
    editButton.innerHTML = SavedSearches.icons.edit;
    removeButton.innerHTML = SavedSearches.icons.delete;
    moveToTopButton.innerHTML = SavedSearches.icons.upArrow;
    savedSearchLabel.className = "save-search-label";
    editButton.className = "edit-saved-search-button";
    removeButton.className = "remove-saved-search-button";
    moveToTopButton.className = "move-saved-search-to-top-button";
    newListItem.appendChild(savedSearchLabel);
    newListItem.appendChild(moveToTopButton);
    newListItem.appendChild(editButton);
    newListItem.appendChild(removeButton);
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
        alert("Cancel curent edit before removing another search");
        return;
      }

      if (confirm(`Remove Saved Search: ${savedSearchLabel.innerText} ?`)) {
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
    };
    this.stopEditingButton.onclick = () => {
      this.stopEditingSavedSearches(newListItem);
    };
    this.textarea.value = "";
    this.storeSavedSearches();
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

    for (let i = savedSearches.length - 1; i >= 0; i -= 1) {
      this.saveSearch(savedSearches[i]);
    }
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

    if (doesNotHaveSavedSearches || confirm("are you sure you want to import saved searches? ( this will overwrite current saved searches )")) {
      const savedSearches = this.textarea.value.split("\n");

      this.savedSearchesList.innerHTML = "";

      for (let i = savedSearches.length - 1; i >= 0; i -= 1) {
        this.saveSearch(savedSearches[i]);
      }
      this.storeSavedSearches();
    }
  }
}

const savedSearches = new SavedSearches();
