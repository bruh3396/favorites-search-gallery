const tagModifierHTML = `<div id="tag-modifier-container">
  <style>
    #tag-modifier-ui-container {
      display: none;

      >* {
        margin-top: 10px;
      }
    }

    #tag-modifier-ui-textarea {
      width: 80%;
    }

    .post.tag-modifier-selected {
      outline: 2px dashed white !important;

      >div {
        opacity: 1;
        filter: grayscale(0%);
      }
    }

    #tag-modifier-ui-status-label {
      visibility: hidden;
    }

    .tag-type-custom>a,
    .tag-type-custom {
      color: hotpink;
    }
  </style>
  <div id="tag-modifier-option-container">
    <label class="checkbox" title="Add or remove custom or official tags to favorites">
      <input type="checkbox" id="tag-modifier-option-checkbox">Modify Tags<span class="option-hint"></span>
    </label>
  </div>
  <div id="tag-modifier-ui-container">
    <label id="tag-modifier-ui-status-label">No Status</label>
    <textarea id="tag-modifier-ui-textarea" placeholder="tags" spellcheck="false"></textarea>
    <div id="tag-modifier-buttons">
      <span id="tag-modifier-ui-modification-buttons">
        <button id="tag-modifier-ui-add" title="Add tags to selected favorites">Add</button>
        <button id="tag-modifier-remove" title="Remove tags from selected favorites">Remove</button>
      </span>
      <span id="tag-modifier-ui-selection-buttons">
        <button id="tag-modifier-ui-select-all" title="Select all favorites for tag modification">Select all</button>
        <button id="tag-modifier-ui-un-select-all" title="Unselect all favorites for tag modification">Unselect
          all</button>
      </span>
    </div>
    <div id="tag-modifier-ui-reset-button-container">
      <button id="tag-modifier-reset" title="Reset tag modifications">Reset</button>
    </div>
    <div id="tag-modifier-ui-configuration" style="display: none;">
      <button id="tag-modifier-import" title="Import modified tags">Import</button>
      <button id="tag-modifier-export" title="Export modified tags">Export</button>
    </div>
  </div>
</div>

`;

class TagModifier {
  /**
   * @type {String}
   */
  static databaseName = "AdditionalTags";
  /**
   * @type {String}
   */
  static objectStoreName = "additionalTags";
  /**
   * @type {Map.<String, String>}
   */
  static tagModifications = new Map();
  static preferences = {
    modifyTagsOutsideFavoritesPage: "modifyTagsOutsideFavoritesPage"
  };

  /**
   * @type {Boolean}
   */
  static get currentlyModifyingTags() {
    return document.getElementById("tag-edit-mode") !== null;
  }

  /**
   * @type {Boolean}
   */
  static get disabled() {
    if (onMobileDevice()) {
      return true;
    }

    if (onFavoritesPage()) {
      return false;
    }
    return getPreference(TagModifier.preferences.modifyTagsOutsideFavoritesPage, false);
  }

  /**
   * @type {AbortController}
   */
  tagEditModeAbortController;
  /**
   * @type {{container: HTMLDivElement, checkbox: HTMLInputElement}}
   */
  favoritesOption;
  /**
   * @type { {container: HTMLDivElement,
   * textarea:  HTMLTextAreaElement,
   * statusLabel: HTMLLabelElement,
   * add: HTMLButtonElement,
   * remove: HTMLButtonElement,
   * reset: HTMLButtonElement,
   * selectAll: HTMLButtonElement,
   * unSelectAll: HTMLButtonElement,
   * import: HTMLButtonElement,
   * export: HTMLButtonElement}}
   */
  favoritesUI;
  /**
   * @type {Post[]}
   */
  selectedPosts;
  /**
   * @type {Boolean}
   */
  atLeastOneFavoriteIsSelected;

  constructor() {
    if (TagModifier.disabled) {
      return;
    }
    this.tagEditModeAbortController = new AbortController();
    this.favoritesOption = {};
    this.favoritesUI = {};
    this.selectedPosts = [];
    this.atLeastOneFavoriteIsSelected = false;
    this.loadTagModifications();
    this.insertHTML();
    this.addEventListeners();
  }

  insertHTML() {
    this.insertFavoritesPageHTML();
    this.insertSearchPageHTML();
    this.insertPostPageHTML();
  }

  insertFavoritesPageHTML() {
    if (!onFavoritesPage()) {
      return;
    }
    insertHTMLAndExtractStyle(document.getElementById("bottom-panel-4"), "beforeend", tagModifierHTML);
    this.favoritesOption.container = document.getElementById("tag-modifier-container");
    this.favoritesOption.checkbox = document.getElementById("tag-modifier-option-checkbox");
    this.favoritesUI.container = document.getElementById("tag-modifier-ui-container");
    this.favoritesUI.statusLabel = document.getElementById("tag-modifier-ui-status-label");
    this.favoritesUI.textarea = document.getElementById("tag-modifier-ui-textarea");
    this.favoritesUI.add = document.getElementById("tag-modifier-ui-add");
    this.favoritesUI.remove = document.getElementById("tag-modifier-remove");
    this.favoritesUI.reset = document.getElementById("tag-modifier-reset");
    this.favoritesUI.selectAll = document.getElementById("tag-modifier-ui-select-all");
    this.favoritesUI.unSelectAll = document.getElementById("tag-modifier-ui-un-select-all");
    this.favoritesUI.import = document.getElementById("tag-modifier-import");
    this.favoritesUI.export = document.getElementById("tag-modifier-export");
  }

  insertSearchPageHTML() {
    if (!onSearchPage()) {
      return;
    }
    1;
  }

  insertPostPageHTML() {
    if (!onPostPage()) {
      return;
    }
    const contentContainer = document.querySelector(".flexi");
    const originalAddToFavoritesLink = Array.from(document.querySelectorAll("a")).find(a => a.textContent === "Add to favorites");

    const html = `
      <div style="margin-bottom: 1em;">
        <h4 class="image-sublinks">
        <a href="#" id="add-to-favorites">Add to favorites</a>
        |
        <a href="#" id="add-custom-tags">Add custom tag</a>
        <select id="custom-tags-list"></select>
        </h4>
      </div>
    `;

    if (contentContainer === null || originalAddToFavoritesLink === undefined) {
      return;
    }
    contentContainer.insertAdjacentHTML("beforebegin", html);

    const addToFavorites = document.getElementById("add-to-favorites");
    const addCustomTags = document.getElementById("add-custom-tags");
    const customTagsList = document.getElementById("custom-tags-list");

    for (const customTag of CUSTOM_TAGS.values()) {
      const option = document.createElement("option");

      option.value = customTag;
      option.textContent = customTag;
      customTagsList.appendChild(option);
    }
    addToFavorites.onclick = () => {
      originalAddToFavoritesLink.click();
      return false;
    };

    addCustomTags.onclick = () => {
      return false;
    };
  }

  addEventListeners() {
    this.addFavoritesPageEventListeners();
    this.addSearchPageEventListeners();
    this.addPostPageEventListeners();
  }

  addFavoritesPageEventListeners() {
    if (!onFavoritesPage()) {
      return;
    }
    this.favoritesOption.checkbox.onchange = (event) => {
      this.toggleTagEditMode(event.target.checked);
    };
    this.favoritesUI.selectAll.onclick = this.selectAll.bind(this);
    this.favoritesUI.unSelectAll.onclick = this.unSelectAll.bind(this);
    this.favoritesUI.add.onclick = this.addTagsToSelected.bind(this);
    this.favoritesUI.remove.onclick = this.removeTagsFromSelected.bind(this);
    this.favoritesUI.reset.onclick = this.resetTagModifications.bind(this);
    this.favoritesUI.import.onclick = this.importTagModifications.bind(this);
    this.favoritesUI.export.onclick = this.exportTagModifications.bind(this);
    window.addEventListener("searchStarted", () => {
      this.unSelectAll();
    });
    window.addEventListener("changedPage", () => {
      this.highlightSelectedThumbsOnPageChange();
    });
  }

  addSearchPageEventListeners() {
    if (!onSearchPage()) {
      return;
    }
    1;
  }

  addPostPageEventListeners() {
    if (!onPostPage()) {
      return;
    }
    1;
  }

  highlightSelectedThumbsOnPageChange() {
    if (!this.atLeastOneFavoriteIsSelected) {
      return;
    }
    const posts = Array.from(getAllThumbs())
      .map(thumb => Post.allPosts.get(thumb.id));

    for (const post of posts) {
      if (post === undefined) {
        return;
      }

      if (this.isSelectedForModification(post)) {
        this.highlightPost(post, true);
      }
    }
  }

  /**
   * @param {Boolean} value
   */
  toggleTagEditMode(value) {
    this.toggleThumbInteraction(value);
    this.toggleUi(value);
    this.toggleTagEditModeEventListeners(value);
    this.favoritesUI.unSelectAll.click();
  }

  /**
   * @param {Boolean} value
   */
  toggleThumbInteraction(value) {
    let html = "";

    if (value) {
      html =
        `
      .post  {
        cursor: pointer;
        outline: 1px solid black;

        > div {
          outline: none !important;

          > img {
            outline: none !important;
          }

          pointer-events:none;
          opacity: 0.6;
          filter: grayscale(90%);
          transition: none !important;
        }
      }
    `;
    }
    insertStyleHTML(html, "tag-edit-mode");
  }

  /**
   * @param {Boolean} value
   */
  toggleUi(value) {
    this.favoritesUI.container.style.display = value ? "block" : "none";
  }

  /**
   * @param {Boolean} value
   */
  toggleTagEditModeEventListeners(value) {
    if (!value) {
      this.tagEditModeAbortController.abort();
      this.tagEditModeAbortController = new AbortController();
      return;
    }

    document.addEventListener("click", (event) => {
      if (!event.target.classList.contains("post")) {
        return;
      }
      const post = Post.allPosts.get(event.target.id);

      if (post !== undefined) {
        this.toggleThumbSelection(post);
      }
    }, {
      signal: this.tagEditModeAbortController.signal
    });

  }

  /**
   * @param {String} text
   */
  showStatus(text) {
    this.favoritesUI.statusLabel.style.visibility = "visible";
    this.favoritesUI.statusLabel.textContent = text;
    setTimeout(() => {
      const statusHasNotChanged = this.favoritesUI.statusLabel.textContent === text;

      if (statusHasNotChanged) {
        this.favoritesUI.statusLabel.style.visibility = "hidden";
      }
    }, 1000);
  }

  unSelectAll() {
    if (!this.atLeastOneFavoriteIsSelected) {
      return;
    }

    for (const post of Post.allPosts.values()) {
      this.toggleThumbSelection(post, false);
    }
    this.atLeastOneFavoriteIsSelected = false;
  }

  selectAll() {
    for (const post of Post.postsMatchedBySearch.values()) {
      this.toggleThumbSelection(post, true);
    }
  }

  /**
   * @param {Post} post
   * @param {Boolean} value
   */
  toggleThumbSelection(post, value) {
    this.atLeastOneFavoriteIsSelected = true;

    if (value === undefined) {
      value = !this.isSelectedForModification(post);
    }
    post.selectedForTagModification = value ? true : undefined;
    this.highlightPost(post, value);
  }

  /**
   * @param {Post} post
   * @param {Boolean} value
   */
  highlightPost(post, value) {
    if (post.root !== undefined) {
      post.root.classList.toggle("tag-modifier-selected", value);
    }
  }

  /**
   * @param {Post} post
   * @returns {Boolean}
   */
  isSelectedForModification(post) {
    return post.selectedForTagModification !== undefined;
  }

  /**
   * @param {String} tags
   * @returns
   */
  removeContentTypeTags(tags) {
    return tags
      .replace(/(?:^|\s*)(?:video|animated|mp4)(?:$|\s*)/g, "");
  }

  addTagsToSelected() {
    this.modifyTagsOfSelected(false);
  }

  removeTagsFromSelected() {
    this.modifyTagsOfSelected(true);
  }

  /**
   * @param {Boolean} remove
   */
  modifyTagsOfSelected(remove) {
    const tags = this.favoritesUI.textarea.value.toLowerCase();
    const tagsWithoutContentTypes = this.removeContentTypeTags(tags);
    const tagsToModify = removeExtraWhiteSpace(tagsWithoutContentTypes);
    const statusPrefix = remove ? "Removed tag(s) from" : "Added tag(s) to";
    let modifiedTagsCount = 0;

    if (tagsToModify === "") {
      return;
    }

    for (const post of Post.allPosts.values()) {
      if (this.isSelectedForModification(post)) {
        const additionalTags = remove ? post.removeAdditionalTags(tagsToModify) : post.addAdditionalTags(tagsToModify);

        TagModifier.tagModifications.set(post.id, additionalTags);
        modifiedTagsCount += 1;
      }
    }

    if (modifiedTagsCount === 0) {
      return;
    }

    if (tags !== tagsWithoutContentTypes) {
      alert("Warning: video, animated, and mp4 tags are unchanged.\nThey cannot be modified.");
    }
    this.showStatus(`${statusPrefix} ${modifiedTagsCount} favorite(s)`);
    dispatchEvent(new Event("modifiedTags"));
    setCustomTags(tagsToModify);
    this.storeTagModifications();
  }

  createDatabase(event) {
    /**
     * @type {IDBDatabase}
     */
    const database = event.target.result;

    database
      .createObjectStore(TagModifier.objectStoreName, {
        keyPath: "id"
      });
  }

  storeTagModifications() {
    const request = indexedDB.open(TagModifier.databaseName, 1);

    request.onupgradeneeded = this.createDatabase;
    request.onsuccess = (event) => {
      /**
       * @type {IDBDatabase}
       */
      const database = event.target.result;
      const objectStore = database
        .transaction(TagModifier.objectStoreName, "readwrite")
        .objectStore(TagModifier.objectStoreName);
      const idsWithNoTagModifications = [];

      for (const [id, tags] of TagModifier.tagModifications) {
        if (tags === "") {
          idsWithNoTagModifications.push(id);
          objectStore.delete(id);
        } else {
          objectStore.put({
            id,
            tags
          });
        }
      }

      for (const id of idsWithNoTagModifications) {
        TagModifier.tagModifications.delete(id);
      }
      database.close();
    };
  }

  loadTagModifications() {
    const request = indexedDB.open(TagModifier.databaseName, 1);

    request.onupgradeneeded = this.createDatabase;
    request.onsuccess = (event) => {
      /**
       * @type {IDBDatabase}
       */
      const database = event.target.result;
      const objectStore = database
        .transaction(TagModifier.objectStoreName, "readonly")
        .objectStore(TagModifier.objectStoreName);

      objectStore.getAll().onsuccess = (successEvent) => {
        const tagModifications = successEvent.target.result;

        for (const record of tagModifications) {
          TagModifier.tagModifications.set(record.id, record.tags);
        }
      };
      database.close();
    };
  }

  resetTagModifications() {
    if (!confirm("Are you sure you want to delete all tag modifications?")) {
      return;
    }
    CUSTOM_TAGS.clear();
    indexedDB.deleteDatabase("AdditionalTags");
    Post.allPosts.forEach(post => {
      post.resetAdditionalTags();
    });
    dispatchEvent(new Event("modifiedTags"));
    localStorage.removeItem("customTags");
  }

  exportTagModifications() {
    const modifications = JSON.stringify(mapToObject(TagModifier.tagModifications));

    navigator.clipboard.writeText(modifications);
    alert("Copied tag modifications to clipboard");
  }

  importTagModifications() {
    let modifications;

    try {
      const object = JSON.parse(this.favoritesUI.textarea.value);

      if (!(typeof object === "object")) {
        throw new TypeError(`Input parsed as ${typeof (object)}, but expected object`);
      }
      modifications = objectToMap(object);
    } catch (error) {
      if (error.name === "SyntaxError" || error.name === "TypeError") {
        alert("Import Unsuccessful. Failed to parse input, JSON object format expected.");
      } else {
        throw error;
      }
      return;
    }
    console.error(modifications);
  }
}

const tagModifier = new TagModifier();
