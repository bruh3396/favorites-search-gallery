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

    .thumb-node.tag-modifier-selected {
      outline: 2px dashed white !important;
      >div {
        opacity: 1;
        filter: grayscale(0%);
      }
    }

    #tag-modifier-ui-status-label {
      visibility: hidden;
    }

    .tag-type-custom>a, .tag-type-custom {
      color: hotpink;
    }
  </style>
  <div id="tag-modifier-option-container">
    <label class="checkbox" title="Add or Remove custom or official tags to favorites">
      <input type="checkbox" id="tag-modifier-option-checkbox">Modify Tags
    </label>
  </div>
  <div id="tag-modifier-ui-container">
    <label id="tag-modifier-ui-status-label">No Status</label>
    <textarea id="tag-modifier-ui-textarea" placeholder="tags" spellcheck="false"></textarea>
    <div id="tag-modifier-ui-modification-buttons">
      <button id="tag-modifier-ui-add" title="Add tags to selected favorites">Add</button>
      <button id="tag-modifier-remove" title="Remove tags from selected favorites">Remove</button>
    </div>
    <div id="tag-modifier-ui-selection-buttons">
      <button id="tag-modifier-ui-select-all" title="Select all favorites for tag modification">Select all</button>
      <button id="tag-modifier-ui-un-select-all" title="Unselect all favorites for tag modification">Unselect all</button>
    </div>
    <div id="tag-modifier-ui-reset-button-container">
      <button id="tag-modifier-reset" title="Reset tag modifications">Reset</button>
    </div>
    <div id="tag-modifier-ui-configuration" style="display: none;">
      <button id="tag-modifier-import" title="Import modified tags">Import</button>
      <button id="tag-modifier-export" title="Export modified tags">Export</button>
    </div>
  </div>
</div>`;

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
   * @type {Boolean}
   */
  static get currentlyModifyingTags() {
    return document.getElementById("tag-edit-mode") !== null;
  }
  /**
   * @type {Map.<String, String>}
   */
  static tagModifications = new Map();

  /**
   * @type {Boolean}
  */
  static get disabled() {
    return !onFavoritesPage();
  }

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
  ui;
  /**
   * @type {ThumbNode[]}
   */
  selectedThumbNodes;
  /**
   * @type {Boolean}
  */
  atLeastOneFavoriteIsSelected;

  constructor() {
    if (TagModifier.disabled) {
      return;
    }
    this.favoritesOption = {};
    this.ui = {};
    this.selectedThumbNodes = [];
    this.atLeastOneFavoriteIsSelected = false;
    this.loadTagModifications();
    this.injectHTML();
    this.addEventListeners();
  }

  injectHTML() {
    document.getElementById("left-favorites-panel-bottom-row").lastElementChild.insertAdjacentHTML("beforebegin", tagModifierHTML);
    this.favoritesOption.container = document.getElementById("tag-modifier-container");
    this.favoritesOption.checkbox = document.getElementById("tag-modifier-option-checkbox");
    this.ui.container = document.getElementById("tag-modifier-ui-container");
    this.ui.statusLabel = document.getElementById("tag-modifier-ui-status-label");
    this.ui.textarea = document.getElementById("tag-modifier-ui-textarea");
    this.ui.add = document.getElementById("tag-modifier-ui-add");
    this.ui.remove = document.getElementById("tag-modifier-remove");
    this.ui.reset = document.getElementById("tag-modifier-reset");
    this.ui.selectAll = document.getElementById("tag-modifier-ui-select-all");
    this.ui.unSelectAll = document.getElementById("tag-modifier-ui-un-select-all");
    this.ui.import = document.getElementById("tag-modifier-import");
    this.ui.export = document.getElementById("tag-modifier-export");
  }

  addEventListeners() {
    this.favoritesOption.checkbox.onchange = (event) => {
      this.toggleTagEditMode(event.target.checked);
    };
    this.ui.selectAll.onclick = this.selectAll.bind(this);
    this.ui.unSelectAll.onclick = this.unSelectAll.bind(this);
    this.ui.add.onclick = this.addTagsToSelected.bind(this);
    this.ui.remove.onclick = this.removeTagsFromSelected.bind(this);
    this.ui.reset.onclick = this.resetTagModifications.bind(this);
    this.ui.import.onclick = this.importTagModifications.bind(this);
    this.ui.export.onclick = this.exportTagModifications.bind(this);
    window.addEventListener("searchStarted", () => {
      this.unSelectAll();
    });
  }

  /**
   * @param {Boolean} value
   */
  toggleTagEditMode(value) {
    this.toggleThumbInteraction(value);
    this.toggleUi(value);
    this.toggleTagEditModeEventListeners(value);
    this.ui.unSelectAll.click();
  }

  /**
   * @param {Boolean} value
   */
  toggleThumbInteraction(value) {
    if (!value) {
      const tagEditModeStyle = document.getElementById("tag-edit-mode");

      if (tagEditModeStyle !== null) {
        tagEditModeStyle.remove();
      }
      return;
    }
    injectStyleHTML(`
      .thumb-node  {
        cursor: pointer;
        outline: 1px solid black;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -khtml-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;

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
    `, "tag-edit-mode");
  }

  /**
   * @param {Boolean} value
   */
  toggleUi(value) {
    this.ui.container.style.display = value ? "block" : "none";
  }

  /**
   * @param {Boolean} value
   */
  toggleTagEditModeEventListeners(value) {
    for (const thumbNode of ThumbNode.allThumbNodes.values()) {
      if (value) {
        thumbNode.root.onclick = () => {
          this.toggleThumbSelection(thumbNode.root);
        };
      } else {
        thumbNode.root.onclick = null;
      }
    }
  }

  /**
   * @param {String} text
   */
  showStatus(text) {
    this.ui.statusLabel.style.visibility = "visible";
    this.ui.statusLabel.textContent = text;
    setTimeout(() => {
      const statusHasNotChanged = this.ui.statusLabel.textContent === text;

      if (statusHasNotChanged) {
        this.ui.statusLabel.style.visibility = "hidden";
      }
    }, 1000);
  }

  unSelectAll() {
    if (!this.atLeastOneFavoriteIsSelected) {
      return;
    }

    for (const thumbNode of ThumbNode.allThumbNodes.values()) {
      this.toggleThumbSelection(thumbNode.root, false);
    }
    this.atLeastOneFavoriteIsSelected = false;
  }

  selectAll() {
    for (const thumbNode of ThumbNode.thumbNodesMatchedBySearch.values()) {
      this.toggleThumbSelection(thumbNode.root, true);
    }
  }

  /**
   * @param {HTMLElement} thumb
   * @param {Boolean} value
   */
  toggleThumbSelection(thumb, value) {
    this.atLeastOneFavoriteIsSelected = true;

    if (value === undefined) {
      thumb.classList.toggle("tag-modifier-selected");
    } else {
      thumb.classList.toggle("tag-modifier-selected", value);
    }
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
   *
   * @param {Boolean} remove
   */
  modifyTagsOfSelected(remove) {
    const tags = this.ui.textarea.value.toLowerCase();
    const tagsWithoutContentTypes = this.removeContentTypeTags(tags);
    const tagsToModify = removeExtraWhiteSpace(tagsWithoutContentTypes);
    const statusPrefix = remove ? "Removed tag(s) from" : "Added tag(s) to";
    let modifiedTagsCount = 0;

    if (tagsToModify === "") {
      return;
    }

    for (const [id, thumbNode] of ThumbNode.allThumbNodes.entries()) {
      if (thumbNode.root.classList.contains("tag-modifier-selected")) {
        const additionalTags = remove ? thumbNode.removeAdditionalTags(tagsToModify) : thumbNode.addAdditionalTags(tagsToModify);

        TagModifier.tagModifications.set(id, additionalTags);
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
    ThumbNode.allThumbNodes.forEach(thumbNode => {
      thumbNode.resetAdditionalTags();
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
      const object = JSON.parse(this.ui.textarea.value);

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
