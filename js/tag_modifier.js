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
      >div {
        opacity: 1;
        filter: grayscale(0%);
      }
    }
  </style>
  <div id="tag-modifier-option-container">
    <label class="checkbox" title="Add or Remove custom or official tags to favorites">
      <input type="checkbox" id="tag-modifier-option-checkbox">Modify Tags
    </label>
  </div>
  <div id="tag-modifier-ui-container">
    <textarea id="tag-modifier-ui-textarea" placeholder="tags"></textarea>
    <div id="tag-modifier-ui-modification-buttons">
      <button id="tag-modifier-ui-add" title="Add tags to all selected favorites">Add</button>
      <button id="tag-modifier-remove" title="Remove tags to all selected favorites">Remove</button>
    </div>
    <div id="tag-modifier-ui-selection-buttons">
      <button id="tag-modifier-ui-select-all" title="Select all favorites for tag modification">Select all</button>
      <button id="tag-modifier-ui-un-select-all" title="Unselect all favorites for tag modification">Unselect all</button>
    </div>
    <div id="tag-modifier-ui-configuration" style="display: none;">
      <button id="tag-modifier-import" title="Import modified tags">Import</button>
      <button id="tag-modifier-export" title="Export modified tags">Export</button>
    </div>
  </div>
</div>`;

class TagModifier {
  static get currentlyModifyingTags() {
    return document.getElementById("tag-edit-mode") !== null;
  }

  static tagModifications = {};
  /**
   * @type {{container: HTMLDivElement, checkbox: HTMLInputElement}}
   */
  favoritesOption;

  /**
   * @type { {container: HTMLDivElement,
   * textarea:  HTMLTextAreaElement,
   * add: HTMLButtonElement,
   * remove: HTMLButtonElement,
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
    this.injectHTML();
    this.addEventListeners();
  }

  injectHTML() {
    document.getElementById("left-favorites-panel-bottom-row").lastElementChild.insertAdjacentHTML("beforebegin", tagModifierHTML);
    this.favoritesOption.container = document.getElementById("tag-modifier-container");
    this.favoritesOption.checkbox = document.getElementById("tag-modifier-option-checkbox");
    this.ui.container = document.getElementById("tag-modifier-ui-container");
    this.ui.textarea = document.getElementById("tag-modifier-ui-textarea");
    this.ui.add = document.getElementById("tag-modifier-ui-add");
    this.ui.remove = document.getElementById("tag-modifier-remove");
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
        outline: 1px solid white;
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
          opacity: 0.4;
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
    const tags = this.ui.textarea.value;
    const tagsWithoutContentTypes = this.removeContentTypeTags(tags);
    const tagsToAdd = removeExtraWhiteSpace(tagsWithoutContentTypes);

    if (tags !== tagsWithoutContentTypes) {
      alert("Warning: video, animated, and mp4 tags were removed.\nThey cannot be modified.");
    }

    if (tagsToAdd === "") {
      return;
    }

    for (const [id, thumbNode] of ThumbNode.allThumbNodes.entries()) {
      if (thumbNode.root.classList.contains("tag-modifier-selected")) {
        thumbNode.addTags(tagsToAdd);
      }
    }
  }
}

const tagModifier = new TagModifier();
