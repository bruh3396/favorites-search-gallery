class Caption {
  static captionHTML = `
<style>
  .caption {
    overflow: hidden;
    pointer-events: none;
    background: rgba(0, 0, 0, .75);
    z-index: 15;
    position: absolute;
    width: 100%;
    height: 100%;
    top: -100%;
    left: 0px;
    top: 0px;
    text-align: left;
    transform: translateX(-100%);
    /* transition: transform .3s cubic-bezier(.26,.28,.2,.82); */
    transition: transform .35s ease;
    padding-top: 0.5ch;
    padding-left: 7px;

    h6 {
      display: block;
      color: white;
      padding-top: 0px;
    }

    li {
      width: fit-content;
      list-style-type: none;
      display: inline-block;
    }

    &.active {
        transform: translateX(0%);
    }

    &.transition-completed {
      .caption-tag {
        pointer-events: all;
      }
    }
  }

  .caption.hide {
    display: none;
  }

  .caption.inactive {
    display: none;
  }

  .caption-tag {
    pointer-events: none;
    color: #6cb0ff;
    word-wrap: break-word;

    &:hover {
      text-decoration-line: underline;
      cursor: pointer;
    }
  }

  .artist-tag {
    color: #f0a0a0;
  }

  .character-tag {
    color: #f0f0a0;
  }

  .copyright-tag {
    color: #EFA1CF;
  }

  .metadata-tag {
    color: #8FD9ED;
  }

  .caption-wrapper {
    pointer-events: none;
    position: absolute !important;
    overflow: hidden;
    top: -1px;
    left: -1px;
    width: 102%;
    height: 102%;
    display: block !important;
  }
</style>
`;
  static preferences = {
    visibility: "showCaptions"
  };
  static localStorageKeys = {
    tagCategories: "tagCategories"
  };
  static importantTagCategories = new Set([
    "copyright",
    "character",
    "artist",
    "metadata"
  ]);
  static tagCategoryEncodings = {
    0: "general",
    1: "artist",
    2: "unknown",
    3: "copyright",
    4: "character",
    5: "metadata"
  };
  static template = `
    <ul id="caption-list">
        <li id="caption-id" style="display: block;"><h6>ID</h6></li>
        ${Caption.getCategoryHeaderHTML()}
    </ul>
  `;
  static findCategoriesOnPageChangeCooldown = new Cooldown(3000, true);
  static saveTagCategoriesCooldown = new Cooldown(1000);
  /**
   * @type {Object.<String, Number>}
   */
  static tagCategoryAssociations;
  static settings = {
    tagFetchDelayAfterFinishedLoading: 50,
    tagFetchDelayBeforeFinishedLoading: 100
  };
  static flags = {
    finishedLoading: false
  };

  /**
   * @returns {String}
   */
  static getCategoryHeaderHTML() {
    let html = "";

    for (const category of Caption.importantTagCategories) {
      const capitalizedCategory = Utils.capitalize(category);
      const header = capitalizedCategory === "Metadata" ? "Meta" : capitalizedCategory;

      html += `<li id="caption${capitalizedCategory}" style="display: none;"><h6>${header}</h6></li>`;
    }
    return html;
  }

  /**
   * @param {String} tagCategory
   * @returns {Number}
   */
  static encodeTagCategory(tagCategory) {
    for (const [encoding, category] of Object.entries(Caption.tagCategoryEncodings)) {
      if (category === tagCategory) {
        return parseInt(encoding);
      }
    }
    return 0;
  }

  /**
   * @type {Boolean}
   */
  static get disabled() {
    return !Utils.onFavoritesPage() || Utils.onMobileDevice() || Utils.getPerformanceProfile() > 1;
  }

  /**
   * @type {Boolean}
   */
  get hidden() {
    return this.caption.classList.contains("hide") || this.caption.classList.contains("disabled") || this.caption.classList.contains("remove");
  }

  /**
   * @type {Number}
   */
  static get tagFetchDelay() {
    if (Caption.flags.finishedLoading) {
      return Caption.settings.tagFetchDelayAfterFinishedLoading;
    }
    return Caption.settings.tagFetchDelayBeforeFinishedLoading;
  }

  /**
   * @type {HTMLDivElement}
   */
  captionWrapper;
  /**
   * @type {HTMLDivElement}
   */
  caption;
  /**
   * @type {HTMLElement}
   */
  currentThumb;
  /**
   * @type {Set.<String>}
   */
  problematicTags;
  /**
   * @type {String}
   */
  currentThumbId;
  /**
   * @type {AbortController}
   */
  abortController;

  constructor() {
    if (Caption.disabled) {
      return;
    }
    this.initializeFields();
    this.createHTMLElement();
    this.insertHTML();
    this.toggleVisibility(this.getVisibilityPreference());
    this.addEventListeners();
  }

  initializeFields() {
    Caption.tagCategoryAssociations = this.loadSavedTags();
    Caption.findCategoriesOnPageChangeCooldown.onDebounceEnd = () => {
      this.findTagCategoriesOnPageChange();
    };
    Caption.saveTagCategoriesCooldown.onCooldownEnd = () => {
      this.saveTagCategories();
    };
    this.currentThumb = null;
    this.problematicTags = new Set();
    this.currentThumbId = null;
    this.abortController = new AbortController();
  }

  createHTMLElement() {
    this.captionWrapper = document.createElement("div");
    this.captionWrapper.className = "caption-wrapper";
    this.caption = document.createElement("div");
    this.caption.className = "caption inactive not-highlightable";
    this.captionWrapper.appendChild(this.caption);
    document.head.appendChild(this.captionWrapper);
    this.caption.innerHTML = Caption.template;
  }

  insertHTML() {
    Utils.insertStyleHTML(Caption.captionHTML, "caption");
    Utils.createFavoritesOption(
      "show-captions",
      "Details",
      "Show details when hovering over thumbnail",
      this.getVisibilityPreference(),
      (event) => {
        this.toggleVisibility(event.target.checked);
      },
      true,
      "(D)"
    );
  }

  /**
   * @param {Boolean} value
   */
  toggleVisibility(value) {
    if (value === undefined) {
      value = this.caption.classList.contains("disabled");
    }

    if (value) {
      this.caption.classList.remove("disabled");
    } else if (!this.caption.classList.contains("disabled")) {
      this.caption.classList.add("disabled");
    }
    Utils.setPreference(Caption.preferences.visibility, value);
  }

  addEventListeners() {
    this.addAllPageEventListeners();
    this.addSearchPageEventListeners();
    this.addFavoritesPageEventListeners();
  }

  addAllPageEventListeners() {
    this.caption.addEventListener("transitionend", () => {
      if (this.caption.classList.contains("active")) {
        this.caption.classList.add("transition-completed");
      }
      this.caption.classList.remove("transitioning");
    });
    this.caption.addEventListener("transitionstart", () => {
      this.caption.classList.add("transitioning");
    });
    window.addEventListener("showOriginalContent", (event) => {
      const thumb = this.caption.parentElement;

      if (event.detail) {
        this.removeFromThumb(thumb);

        this.caption.classList.add("hide");
      } else {
        this.caption.classList.remove("hide");
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key.toLowerCase() !== "d" || !Utils.isHotkeyEvent(event)) {
        return;
      }

      if (Utils.onFavoritesPage()) {
        const showCaptionsCheckbox = document.getElementById("show-captions-checkbox");

        if (showCaptionsCheckbox !== null) {
          showCaptionsCheckbox.click();

          if (this.currentThumb !== null && !this.caption.classList.contains("remove")) {
            if (showCaptionsCheckbox.checked) {
              this.attachToThumbHelper(this.currentThumb);
            } else {
              this.removeFromThumbHelper(this.currentThumb);
            }
          }
        }
      } else if (Utils.onSearchPage()) {
        // this.toggleVisibility();
      }
    }, {
      passive: true
    });
  }

  addSearchPageEventListeners() {
    if (!Utils.onSearchPage()) {
      return;
    }
    window.addEventListener("load", () => {
      this.addEventListenersToThumbs.bind(this)();
    }, {
      once: true,
      passive: true
    });
  }

  addFavoritesPageEventListeners() {
    window.addEventListener("favoritesLoaded", () => {
      this.addEventListenersToThumbs.bind(this)();
      Caption.flags.finishedLoading = true;
      Caption.findCategoriesOnPageChangeCooldown.waitTime = 1000;
    }, {
      once: true
    });
    window.addEventListener("favoritesLoadedFromDatabase", () => {
      this.findTagCategoriesOnPageChange();
    }, {
      once: true
    });
    window.addEventListener("favoritesFetched", () => {
      this.addEventListenersToThumbs.bind(this)();
    });
    window.addEventListener("changedPage", () => {
      this.addEventListenersToThumbs.bind(this)();
      this.abortController.abort("ChangedPage");
      this.abortController = new AbortController();

      if (Caption.findCategoriesOnPageChangeCooldown.ready) {
        setTimeout(() => {
          this.findTagCategoriesOnPageChange();
        }, 100);
      }
    });
    window.addEventListener("originalFavoritesCleared", (event) => {
      const thumbs = event.detail;
      const tagNames = Array.from(thumbs)
        .map(thumb => Utils.getImageFromThumb(thumb).title)
        .join(" ")
        .split(" ")
        .filter(tagName => !Utils.isNumber(tagName) && Caption.tagCategoryAssociations[tagName] === undefined);

      this.findTagCategories(tagNames, () => {
        Caption.saveTagCategoriesCooldown.restart();
      });
    }, {
      once: true
    });
    window.addEventListener("newFavoritesFoundOnReload", (event) => {
      const favorites = event.detail;

      if (favorites.length > 0) {
        this.addEventListenersToThumbs.bind(this)(favorites);
      }
    }, {
      once: true
    });
    window.addEventListener("captionOverrideEnd", () => {
      if (this.currentThumb !== null) {
        this.attachToThumb(this.currentThumb);
      }
    });
  }

  /**
   * @param {HTMLElement[]} thumbs
   */
  async addEventListenersToThumbs(thumbs) {
    await Utils.sleep(500);
    thumbs = thumbs === undefined ? Utils.getAllThumbs() : thumbs;

    for (const thumb of thumbs) {
      const imageContainer = Utils.getImageFromThumb(thumb).parentElement;

      if (imageContainer.onmouseenter !== null) {
        continue;
      }
      imageContainer.onmouseenter = () => {
        this.currentThumb = thumb;
        this.attachToThumb(thumb);
      };

      imageContainer.onmouseleave = () => {
        this.currentThumb = null;
        this.removeFromThumb(thumb);
      };
    }
  }

  /**
   * @param {HTMLElement} thumb
   */
  attachToThumb(thumb) {
    if (this.hidden || thumb === null) {
      return;
    }
    this.attachToThumbHelper(thumb);
  }

  attachToThumbHelper(thumb) {
    thumb.querySelectorAll(".caption-wrapper-clone").forEach(element => element.remove());
    this.caption.classList.remove("inactive");
    this.caption.innerHTML = Caption.template;
    this.captionWrapper.removeAttribute("style");
    const captionIdHeader = this.caption.querySelector("#caption-id");
    const captionIdTag = document.createElement("li");

    captionIdTag.className = "caption-tag";
    captionIdTag.textContent = thumb.id;
    captionIdTag.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
    };
    captionIdTag.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });

    captionIdTag.onmousedown = (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.tagOnClick(thumb.id, event);
    };
    captionIdHeader.insertAdjacentElement("afterend", captionIdTag);
    thumb.children[0].appendChild(this.captionWrapper);
    this.populateTags(thumb);
  }

  /**
   * @param {HTMLElement} thumb
   */
  removeFromThumb(thumb) {
    if (this.hidden) {
      return;
    }

    this.removeFromThumbHelper(thumb);
  }

  /**
   * @param {HTMLElement} thumb
   */
  removeFromThumbHelper(thumb) {
    if (thumb !== null && thumb !== undefined) {
      this.animateRemoval(thumb);
    }
    this.animate(false);
    this.caption.classList.add("inactive");
    this.caption.classList.remove("transition-completed");
  }

  /**
   * @param {HTMLElement} thumb
   */
  animateRemoval(thumb) {
    const captionWrapperClone = this.captionWrapper.cloneNode(true);
    const captionClone = captionWrapperClone.children[0];

    thumb.querySelectorAll(".caption-wrapper-clone").forEach(element => element.remove());
    captionWrapperClone.classList.add("caption-wrapper-clone");
    captionWrapperClone.querySelectorAll("*").forEach(element => element.removeAttribute("id"));
    captionClone.ontransitionend = () => {
      captionWrapperClone.remove();
    };
    thumb.children[0].appendChild(captionWrapperClone);
    setTimeout(() => {
      captionClone.classList.remove("active");
    }, 4);
  }

  /**
   * @param {HTMLElement} thumb
   */
  resizeFont(thumb) {
    const columnInput = document.getElementById("column-resize-input");
    const heightCanBeDerivedWithoutRect = this.thumbMetadataExists(thumb) && columnInput !== null;
    let height;

    if (heightCanBeDerivedWithoutRect) {
      height = this.estimateThumbHeightFromMetadata(thumb, columnInput);
    } else {
      height = Utils.getImageFromThumb(thumb).getBoundingClientRect().height;
    }
    const captionListRect = this.caption.children[0].getBoundingClientRect();
    const ratio = height / captionListRect.height;
    const scale = ratio > 1 ? Math.sqrt(ratio) : ratio * 0.85;

    this.caption.parentElement.style.fontSize = `${Utils.roundToTwoDecimalPlaces(scale)}em`;
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {Boolean}
   */
  thumbMetadataExists(thumb) {
    if (Utils.onSearchPage()) {
      return false;
    }
    const post = Post.allPosts.get(thumb.id);

    if (post === undefined) {
      return false;
    }

    if (post.metadata === undefined) {
      return false;
    }

    if (post.metadata.width <= 0 || post.metadata.width <= 0) {
      return false;
    }
    return true;
  }

  /**
   * @param {HTMLElement} thumb
   * @param {HTMLInputElement} columnInput
   * @returns {Number}
   */
  estimateThumbHeightFromMetadata(thumb, columnInput) {
    const post = Post.allPosts.get(thumb.id);
    const gridGap = 16;
    const columnCount = Math.max(1, parseInt(columnInput.value));
    const thumbWidthEstimate = (window.innerWidth - (columnCount * gridGap)) / columnCount;
    const thumbWidthScale = post.metadata.width / thumbWidthEstimate;
    return post.metadata.height / thumbWidthScale;
  }

  /**
   * @param {String} tagCategory
   * @param {String} tagName
   */
  addTag(tagCategory, tagName) {
    if (!Caption.importantTagCategories.has(tagCategory)) {
      return;
    }
    const header = document.getElementById(this.getCategoryHeaderId(tagCategory));
    const tag = document.createElement("li");

    tag.className = `${tagCategory}-tag caption-tag`;
    tag.textContent = this.replaceUnderscoresWithSpaces(tagName);
    header.insertAdjacentElement("afterend", tag);
    header.style.display = "block";
    tag.onmouseover = (event) => {
      event.stopPropagation();
    };
    tag.onclick = (event) => {
      event.stopPropagation();
      event.preventDefault();
    };
    tag.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    tag.onmousedown = (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.tagOnClick(tagName, event);
    };
  }

  /**
   * @returns {Object.<String, Number>}
   */
  loadSavedTags() {
    return JSON.parse(localStorage.getItem(Caption.localStorageKeys.tagCategories) || "{}");
  }

  saveTagCategories() {
    localStorage.setItem(Caption.localStorageKeys.tagCategories, JSON.stringify(Caption.tagCategoryAssociations));
  }

  /**
   * @param {String} tagName
   * @param {MouseEvent} event
   */
  tagOnClick(tagName, event) {
    switch (event.button) {
      case Utils.clickCodes.left:
        if (event.shiftKey) {
          this.searchForTag(tagName);
        } else {
          this.tagOnClickHelper(tagName, event);
        }
        break;

      case Utils.clickCodes.middle:
        this.searchForTag(tagName);
        break;

      case Utils.clickCodes.right:
        this.tagOnClickHelper(`-${tagName}`, event);
        break;

      default:
        break;
    }
  }

  /**
   * @param {String} tagName
   */
  searchForTag(tagName) {
    dispatchEvent(new CustomEvent("searchForTag", {
      detail: tagName
    }));
  }

  /**
   * @param {String} value
   * @param {MouseEvent} mouseEvent
   */
  tagOnClickHelper(value, mouseEvent) {
    if (mouseEvent.ctrlKey) {
      Utils.openSearchPage(value);
      return;
    }
    const searchBox = Utils.onSearchPage() ? document.getElementsByName("tags")[0] : document.getElementById("favorites-search-box");
    const searchBoxDoesNotIncludeTag = true;

    navigator.clipboard.writeText(value);

    if (searchBoxDoesNotIncludeTag) {
      searchBox.value += ` ${value}`;
      searchBox.focus();
      value = searchBox.value;
      searchBox.value = "";
      searchBox.value = value;
    }
  }

  /**
   * @param {String} tagName
   * @returns {String}
   */
  replaceUnderscoresWithSpaces(tagName) {
    return tagName.replaceAll(/_/gm, " ");
  }

  /**
   * @param {String} tagName
   * @returns {String}
   */
  replaceSpacesWithUnderscores(tagName) {
    return tagName.replaceAll(/\s/gm, "_");
  }

  /**
   * @returns {Boolean}
   */
  getVisibilityPreference() {
    return Utils.getPreference(Caption.preferences.visibility, true);
  }

  /**
   * @param {Boolean} value
   */
  animate(value) {
    this.caption.classList.toggle("active", value);
  }

  /**
   * @param {String} tagCategory
   * @returns {String}
   */
  getCategoryHeaderId(tagCategory) {
    return `caption${Utils.capitalize(tagCategory)}`;
  }

  /**
   * @param {HTMLElement} thumb
   */
  populateTags(thumb) {
    const tagNames = Utils.getTagsFromThumb(thumb);

    tagNames.delete(thumb.id);
    const unknownThumbTags = Array.from(tagNames)
      .filter(tagName => this.tagCategoryIsUnknown(thumb, tagName));

    this.currentThumbId = thumb.id;

    if (this.allTagsAreProblematic(unknownThumbTags)) {
      this.correctAllProblematicTagsFromThumb(thumb, () => {
        this.addTags(tagNames, thumb);
      });
      return;
    }

    if (unknownThumbTags.length > 0) {
      this.findTagCategories(unknownThumbTags, () => {
        this.addTags(tagNames, thumb);
      }, 3);
      return;
    }
    this.addTags(tagNames, thumb);
  }

  /**
   * @param {Set.<String>} tags
   * @param {HTMLElement} thumb
   */
  addTags(tags, thumb) {
    Caption.saveTagCategoriesCooldown.restart();

    if (this.currentThumbId !== thumb.id) {
      return;
    }

    if (thumb.getElementsByClassName("caption-tag").length > 1) {
      return;
    }
    tags = Array.from(tags).reverse();

    for (const tagName of tags) {
      const category = this.getTagCategory(tagName);

      this.addTag(category, tagName);
    }
    this.resizeFont(thumb);
    this.animate(true);
  }

  /**
   * @param {String} tagName
   * @returns {String}
   */
  getTagCategory(tagName) {
    const encoding = Caption.tagCategoryAssociations[tagName];

    if (encoding === undefined) {
      return "general";
    }
    return Caption.tagCategoryEncodings[encoding];
  }

  /**
   * @param {String[]} tags
   * @returns {Boolean}
   */
  allTagsAreProblematic(tags) {
    for (const tag of tags) {
      if (!this.problematicTags.has(tag)) {
        return false;
      }
    }
    return tags.length > 0;
  }

  /**
   * @param {HTMLElement} thumb
   * @param {Function} onProblematicTagsCorrected
   */
  correctAllProblematicTagsFromThumb(thumb, onProblematicTagsCorrected) {
    fetch(Utils.getPostPageURL(thumb.id))
      .then((response) => {
        return response.text();
      })
      .then((html) => {
        const tagCategoryMap = this.getTagCategoryMapFromPostPage(html);

        for (const [tagName, tagCategory] of tagCategoryMap.entries()) {
          Caption.tagCategoryAssociations[tagName] = Caption.encodeTagCategory(tagCategory);
          this.problematicTags.delete(tagName);
        }
        onProblematicTagsCorrected();
      })
      .catch((error) => {
        console.error(error);
      });
  }

  /**
   * @param {String} html
   * @returns {Map.<String, String>}
   */
  getTagCategoryMapFromPostPage(html) {
    const dom = new DOMParser().parseFromString(html, "text/html");
    return Array.from(dom.querySelectorAll(".tag"))
      .reduce((map, element) => {
        const tagCategory = element.classList[0].replace("tag-type-", "");
        const tagName = this.replaceSpacesWithUnderscores(element.children[1].textContent);

        map.set(tagName, tagCategory);
        return map;
      }, new Map());
  }

  /**
   * @param {String} tag
   */
  setAsProblematic(tag) {
    if (Caption.tagCategoryAssociations[tag] === undefined && !Utils.customTags.has(tag)) {
      this.problematicTags.add(tag);
    }
  }

  findTagCategoriesOnPageChange() {
    if (!Caption.flags.finishedLoading) {
      return;
    }
    const tagNames = this.getTagNamesWithUnknownCategories(Utils.getAllThumbs().slice(0, 200));

    this.findTagCategories(tagNames, () => {
      Caption.saveTagCategoriesCooldown.restart();
    });
  }

  /**
   * @param {String[]} tagNames
   * @param {Function} onAllCategoriesFound
   * @param {Number} fetchDelay
   */
  async findTagCategories(tagNames, onAllCategoriesFound, fetchDelay) {
    const parser = new DOMParser();
    const lastTagName = tagNames[tagNames.length - 1];
    const uniqueTagNames = new Set(tagNames);

    for (const tagName of uniqueTagNames) {
      if (Utils.isNumber(tagName) && tagName.length > 5) {
        Caption.tagCategoryAssociations[tagName] = 0;
        continue;
      }

      if (tagName.includes("'")) {
        this.setAsProblematic(tagName);
      }

      if (this.problematicTags.has(tagName)) {
        if (tagName === lastTagName) {
          onAllCategoriesFound();
        }
        continue;
      }

      const apiURL = `https://api.rule34.xxx//index.php?page=dapi&s=tag&q=index&name=${encodeURIComponent(tagName)}`;

      try {
        fetch(apiURL, {
          signal: this.abortController.signal
        })
          .then((response) => {
            if (response.ok) {
              return response.text();
            }
            throw new Error(response.statusText);
          })
          .then((html) => {
            const dom = parser.parseFromString(html, "text/html");
            const encoding = dom.getElementsByTagName("tag")[0].getAttribute("type");

            if (encoding === "array") {
              this.setAsProblematic(tagName);
              return;
            }
            Caption.tagCategoryAssociations[tagName] = parseInt(encoding);

            if (tagName === lastTagName) {
              onAllCategoriesFound();
            }
          }).catch(() => {
            onAllCategoriesFound();
          });
      } catch (error) {
        console.error(error);
      }
      await Utils.sleep(fetchDelay || Caption.tagFetchDelay);
    }
  }

  /**
   * @param {HTMLElement[]} thumbs
   * @returns {String[]}
   */
  getTagNamesWithUnknownCategories(thumbs) {
    const tagNamesWithUnknownCategories = new Set();

    for (const thumb of thumbs) {
      const tagNames = Array.from(Utils.getTagsFromThumb(thumb));

      for (const tagName of tagNames) {
        if (this.tagCategoryIsUnknown(thumb, tagName)) {
          tagNamesWithUnknownCategories.add(tagName);
        }
      }
    }
    return Array.from(tagNamesWithUnknownCategories);
  }

  /**
   * @param {HTMLElement} thumb
   * @param {String} tagName
   * @returns
   */
  tagCategoryIsUnknown(thumb, tagName) {
    return tagName !== thumb.id && Caption.tagCategoryAssociations[tagName] === undefined && !Utils.customTags.has(tagName);
  }
}
