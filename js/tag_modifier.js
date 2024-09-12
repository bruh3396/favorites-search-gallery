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
      color: #0075FF;
    }
  </style>
  <div id="tag-modifier-option-container">
    <label class="checkbox" title="Add or Remove custom or official tags to favorites">
      <input type="checkbox" id="tag-modifier-option-checkbox">Modify Tags
    </label>
  </div>
  <div id="tag-modifier-ui-container">
    <label id="tag-modifier-ui-status-label">No Status</label>
    <textarea id="tag-modifier-ui-textarea" placeholder="tags"></textarea>
    <div id="tag-modifier-ui-modification-buttons">
      <button id="tag-modifier-ui-add" title="Add tags to all selected favorites">Add</button>
      <button id="tag-modifier-remove" title="Remove tags to all selected favorites">Remove</button>
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
   * unSelectAll: HTMLButtonElement}}
   */
  ui;

  /**
   * @type {ThumbNode[]}
   */
  selectedThumbNodes;

  constructor() {
    if (onPostPage() || onMobileDevice()) {
      return;
    }
    this.favoritesOption = {};
    this.ui = {};
    this.selectedThumbNodes = [];
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
    for (const thumbNode of ThumbNode.allThumbNodes.values()) {
      this.toggleThumbSelection(thumbNode.root, false);
    }
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
    const tags = this.ui.textarea.value;
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

      for (const [id, tags] of TagModifier.tagModifications) {
        objectStore.put({
          id,
          tags
        });
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
    CUSTOM_TAGS.clear();
    indexedDB.deleteDatabase("AdditionalTags");
    ThumbNode.allThumbNodes.forEach(thumbNode => {
      thumbNode.resetAdditionalTags();
    });
    dispatchEvent(new Event("modifiedTags"));
  }
}

const tagModifier = new TagModifier();
