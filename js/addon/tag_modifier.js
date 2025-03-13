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
   * @type {Map<String, String>}
   */
  static tagModifications = new Map();

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
    return Flags.onMobileDevice || !Flags.onFavoritesPage;
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
   * @type {{container: HTMLDivElement,
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
    if (!Flags.onFavoritesPage) {
      return;
    }
    Utils.insertHTMLAndExtractStyle(document.getElementById("bottom-panel-4"), "beforeend", HTMLStrings.tagModifier);
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
    if (!Flags.onSearchPage) {
      return;
    }
    1;
  }

  insertPostPageHTML() {
    if (!Flags.onPostPage) {
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

    for (const customTag of Utils.customTags.values()) {
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
    if (!Flags.onFavoritesPage) {
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
    Events.favorites.newSearchResults.on(() => {
      this.unSelectAll();
    });
    Events.favorites.pageChange.on(() => {
      this.highlightSelectedThumbsOnPageChange();
    });
  }

  addSearchPageEventListeners() {
    if (!Flags.onSearchPage) {
      return;
    }
    1;
  }

  addPostPageEventListeners() {
    if (!Flags.onPostPage) {
      return;
    }
    1;
  }

  highlightSelectedThumbsOnPageChange() {
    if (!this.atLeastOneFavoriteIsSelected) {
      return;
    }
    const posts = Utils.getAllThumbs()
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
    this.toggleUI(value);
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
      .favorite  {
        cursor: pointer;
        outline: 1px solid black;

        > div,
        >a
        {
          outline: none !important;

          > img {
            outline: none !important;
          }

          pointer-events:none;
          opacity: 0.6;
          filter: grayscale(40%);
          transition: none !important;
        }
      }
    `;
    }
    Utils.insertStyleHTML(html, "tag-edit-mode");
  }

  /**
   * @param {Boolean} value
   */
  toggleUI(value) {
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

    Events.global.click.on((event) => {
      if (!(event.target instanceof HTMLElement) || !event.target.classList.contains(Utils.favoriteItemClassName)) {
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
    const postsMatchedByLatestSearch = Array.from(Post.allPosts.values())
      .filter(post => post.matchedByLatestSearch);

    for (const post of postsMatchedByLatestSearch) {
      this.toggleThumbSelection(post, true);
    }
  }

  /**
   * @param {Post} post
   * @param {Boolean | undefined} value
   */
  toggleThumbSelection(post, value = undefined) {
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
    const tagsToModify = Utils.removeExtraWhiteSpace(tagsWithoutContentTypes);
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
    Utils.setCustomTags(tagsToModify);
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
        this.restoreMissingCustomTags();
      };
      database.close();
    };
  }

  restoreMissingCustomTags() {
    // const allCustomTags = Array.from(TagModifier.tagModifications.values()).join(" ");
    // const allUniqueCustomTags = new Set(allCustomTags.split(" "));

    // Utils.setCustomTags(Array.from(allUniqueCustomTags).join(" "));
  }

  resetTagModifications() {
    if (!confirm("Are you sure you want to delete all tag modifications?")) {
      return;
    }
    Utils.customTags.clear();
    indexedDB.deleteDatabase("AdditionalTags");
    Post.allPosts.forEach(post => {
      post.resetAdditionalTags();
    });
    dispatchEvent(new Event("modifiedTags"));
    localStorage.removeItem("customTags");
  }

  exportTagModifications() {
    const modifications = JSON.stringify(Utils.mapToObject(TagModifier.tagModifications));

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
      modifications = Utils.objectToMap(object);
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
