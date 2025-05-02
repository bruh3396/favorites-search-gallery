class Caption {
  static localStorageKeys = {
    tagCategories: "tagCategories"
  };

  /** @type {Set<TagCategory>} */
  static importantTagCategories = new Set([
    "copyright",
    "character",
    "artist",
    "metadata"
  ]);
  static template = `
    <ul id="caption-list">
        <li id="caption-id" style="display: block;"><h6>ID</h6></li>
        ${Caption.getCategoryHeaderHTML()}
    </ul>
  `;
  /** @type {Record<String, TagCategory>} */
  static tagCategoryMappings = {};
  /** @type {Set<String>} */
  static pendingRequests = new Set();
  static settings = {
    tagFetchDelayAfterFinishedLoading: 30,
    tagFetchDelayBeforeFinishedLoading: 100,
    maxPendingRequestsAllowed: 75
  };
  static flags = {
    finishedLoading: false
  };

  /** @type {Record<Number, TagCategory>} */
  static tagCategoryDecodings = {
    0: "general",
    1: "artist",
    2: "unknown",
    3: "copyright",
    4: "character",
    5: "metadata"
  };
  static databaseName = "TagCategories";
  static objectStoreName = "tagMappings";
  /** @type {Database<TagCategoryMapping>} */
  static database = new Database(Caption.databaseName);
  /** @type {BatchExecutor<TagCategoryMapping>} */
  static scheduler = new BatchExecutor(500, 2000, Caption.saveTagCategories);
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
   * @param {TagCategoryMapping[]} mappings
   */
  static saveTagCategories(mappings) {
    Caption.database.store(mappings, Caption.objectStoreName);
  }

  /** @type {Boolean} */
  get hidden() {
    return this.caption.classList.contains("hide") || this.caption.classList.contains("disabled") || this.caption.classList.contains("remove");
  }

  /** @type {Number} */
  static get tagFetchDelay() {
    if (Caption.flags.finishedLoading) {
      return Caption.settings.tagFetchDelayAfterFinishedLoading;
    }
    return Caption.settings.tagFetchDelayBeforeFinishedLoading;
  }

  /** @type {HTMLDivElement} */
  captionWrapper;
  /** @type {HTMLDivElement} */
  caption;
  /** @type {HTMLElement | null} */
  currentThumb;
  /** @type {Set<String>} */
  problematicTags;
  /** @type {String | null} */
  currentThumbId;
  /** @type {AbortController} */
  abortController;

  constructor() {
    if (Flags.captionsDisabled) {
      return;
    }
    this.initializeFields();
    this.createHTMLElement();
    this.insertHTML();
    this.toggleVisibility(this.getVisibilityPreference());
    this.addEventListeners();
  }

  initializeFields() {
    this.loadTagCategoryMappings();
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
    Utils.insertStyleHTML(HTMLStrings.caption, "caption");
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
    Preferences.showCaptions.set(value);
  }

  addEventListeners() {
    this.addCommonEventListeners();
    this.addFavoritesPageEventListeners();
  }

  addCommonEventListeners() {
    this.caption.addEventListener("transitionend", () => {
      if (this.caption.classList.contains("active")) {
        this.caption.classList.add("transition-completed");
      }
      this.caption.classList.remove("transitioning");
    });
    this.caption.addEventListener("transitionstart", () => {
      this.caption.classList.add("transitioning");
    });
    Events.favorites.captionsToggled.on((value) => {
      this.toggleVisibility(value);

      if (this.currentThumb !== null && !this.caption.classList.contains("remove")) {
        if (value) {
          this.attachToThumbHelper(this.currentThumb);
        } else {
          this.removeFromThumbHelper(this.currentThumb);
        }
      }
    });
    Events.global.mouseover.on((mouseOverEvent) => {
      if (mouseOverEvent.insideOfThumb) {
        const insideOfDifferentThumb = this.currentThumb !== null && mouseOverEvent.thumb !== null && this.currentThumb.id !== mouseOverEvent.thumb.id;

        if (insideOfDifferentThumb) {
          this.removeFromThumb(this.currentThumb);
        }
        this.attachToThumb(mouseOverEvent.thumb);
        this.currentThumb = mouseOverEvent.thumb;
      } else {
        if (this.currentThumb !== null) {
          this.removeFromThumb(this.currentThumb);
        }
        this.currentThumb = null;
      }
    });
  }

  addFavoritesPageEventListeners() {
    Events.favorites.favoritesLoaded.on(() => {
      Caption.flags.finishedLoading = true;
    }, {
      once: true
    });
    // Events.favorites.favoritesLoadedFromDatabase.on(() => {
    //   Caption.flags.finishedLoading = true;
    //   this.findTagCategoriesOnPageChange();
    // }, {
    //   once: true
    // });
    Events.favorites.pageChanged.on(Utils.debounceAfterFirstCall(() => {
      this.abortAllRequests("Changed Page");
      this.abortController = new AbortController();
      setTimeout(() => {
        this.findTagCategoriesOnPageChange();
      }, 100);
    }, 2000));

    Events.favorites.captionsReEnabled.on(() => {
      if (this.currentThumb !== null) {
        this.attachToThumb(this.currentThumb);
      }
    });
    Events.favorites.reset.on(() => {
      Caption.database.delete();
    });
  }

  /**
   * @param {HTMLElement | null} thumb
   */
  attachToThumb(thumb) {
    if (this.hidden || thumb === null) {
      return;
    }
    this.attachToThumbHelper(thumb);
  }

  /**
   * @param {HTMLElement} thumb
   */
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
      Events.caption.idClicked.emit(thumb.id);
    };
    captionIdHeader?.insertAdjacentElement("afterend", captionIdTag);
    thumb.children[0].appendChild(this.captionWrapper);
    this.populateTags(thumb);
  }

  /**
   * @param {HTMLElement | null} thumb
   */
  removeFromThumb(thumb) {
    if (this.hidden || thumb === null) {
      return;
    }

    this.removeFromThumbHelper(thumb);
  }

  /**
   * @param {HTMLElement} thumb
   */
  removeFromThumbHelper(thumb) {
    this.animateRemoval(thumb);
    this.caption.classList.add("inactive");
    this.animate(false);
    this.caption.classList.remove("transition-completed");
  }

  /**
   * @param {HTMLElement} thumb
   */
  animateRemoval(thumb) {
    const captionWrapperClone = this.captionWrapper.cloneNode(true);

    if (!(captionWrapperClone instanceof HTMLElement)) {
      return;
    }
    const captionClone = captionWrapperClone.children[0];

    thumb.querySelectorAll(".caption-wrapper-clone").forEach(element => element.remove());
    captionWrapperClone.classList.add("caption-wrapper-clone");
    captionWrapperClone.querySelectorAll("*").forEach(element => element.removeAttribute("id"));

    if (!(captionClone instanceof HTMLElement)) {
      return;
    }
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
    const columnInput = document.getElementById("column-count");
    const heightCanBeDerivedWithoutRect = this.thumbMetadataExists(thumb) && columnInput !== null;
    const image = Utils.getImageFromThumb(thumb);
    let height = 200;

    if (heightCanBeDerivedWithoutRect && columnInput instanceof HTMLInputElement) {
      height = this.estimateThumbHeightFromMetadata(thumb, columnInput);
    } else if (image !== null) {

      height = image.getBoundingClientRect().height;
    }
    const fancyImageHoveringStyle = document.getElementById("fancy-image-hovering-fsg-style");
    const fancyHoveringEnabled = fancyImageHoveringStyle !== null && fancyImageHoveringStyle.innerHTML.length > 10;
    const captionListRect = this.caption.children[0].getBoundingClientRect();
    const ratio = height / captionListRect.height;
    const scale = ratio > 1 ? Math.sqrt(ratio) : ratio * 0.85;
    const finalScale = fancyHoveringEnabled ? scale * 0.8 : scale;

    if (this.caption !== null && this.caption.parentElement !== null) {
      this.caption.parentElement.style.fontSize = `${Utils.roundToTwoDecimalPlaces(finalScale)}em`;
    }
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {Boolean}
   */
  thumbMetadataExists(thumb) {
    if (Flags.onSearchPage) {
      return false;
    }
    const post = Post.get(thumb.id);

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
    const post = Post.get(thumb.id);

    if (post === undefined) {
      return 200;
    }
    const gridGap = 16;
    const columnCount = Math.max(1, parseInt(columnInput.value));
    const thumbWidthEstimate = (window.innerWidth - (columnCount * gridGap)) / columnCount;
    const thumbWidthScale = post.metadata.width / thumbWidthEstimate;
    return post.metadata.height / thumbWidthScale;
  }

  /**
   * @param {TagCategory} tagCategory
   * @param {String} tagName
   */
  addTag(tagCategory, tagName) {
    if (!Caption.importantTagCategories.has(tagCategory)) {
      return;
    }
    const header = document.getElementById(this.getCategoryHeaderId(tagCategory));
    const tag = document.createElement("li");

    if (header === null) {
      return;
    }

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

  async loadTagCategoryMappings() {
    const mappings = await Caption.database.load(Caption.objectStoreName);

    for (const mapping of mappings) {
      Caption.tagCategoryMappings[mapping.id] = mapping.category;
    }
  }

  saveTagCategoryMappings() {
    localStorage.setItem(Caption.localStorageKeys.tagCategories, JSON.stringify(Caption.tagCategoryMappings));
  }

  /**
   * @param {String} tagName
   * @param {MouseEvent} event
   */
  tagOnClick(tagName, event) {
    switch (event.button) {
      case Utils.clickCodes.left:
        if (event.shiftKey && Utils.isOnlyDigits(tagName)) {
          Events.favorites.findFavoriteInAllStarted.emit(tagName);
        } else {
          this.tagOnClickHelper(tagName, event);
        }
        break;

      case Utils.clickCodes.middle:
        Events.caption.searchForTag.emit(tagName);
        break;

      case Utils.clickCodes.right:
        this.tagOnClickHelper(`-${tagName}`, event);
        break;

      default:
        break;
    }
  }

  /**
   * @param {String} value
   * @param {MouseEvent} mouseEvent
   */
  tagOnClickHelper(value, mouseEvent) {
    if (Flags.onSearchPage) {
      return;
    }

    if (mouseEvent.ctrlKey) {
      Utils.openSearchPage(value);
      return;
    }
    navigator.clipboard.writeText(value);
    const currentSearchBoxValue = Utils.getMainSearchBoxValue();

    Utils.setMainSearchBoxValue(`${currentSearchBoxValue} ${value}`);
    Utils.focusMainSearchBox();
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
    return Preferences.showCaptions.value;
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
    const tagNames = Utils.getTagSetFromThumb(thumb);

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
   * @param {Set<String>} tags
   * @param {HTMLElement} thumb
   */
  addTags(tags, thumb) {
    if (this.currentThumbId !== thumb.id) {
      return;
    }

    if (thumb.getElementsByClassName("caption-tag").length > 1) {
      return;
    }

    for (const tagName of Array.from(tags).reverse()) {
      const category = this.getTagCategory(tagName);

      this.addTag(category, tagName);
    }
    this.resizeFont(thumb);
    setTimeout(() => {
      this.animate(true);
    }, 0);
  }

  /**
   * @param {String} tagName
   * @returns {TagCategory}
   */
  getTagCategory(tagName) {
    return Caption.tagCategoryMappings[tagName] || "general";
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
    PostPage.fetch(thumb.id)
      .then((html) => {
        const tagCategoryMap = this.getTagCategoryMapFromPostPage(html);

        for (const [tagName, tagCategory] of tagCategoryMap.entries()) {
          this.addTagCategoryMapping(tagName, Types.isTagCategory(tagCategory) ? tagCategory : "general");
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
   * @returns {Map<String, String>}
   */
  getTagCategoryMapFromPostPage(html) {
    const dom = new DOMParser().parseFromString(html, "text/html");
    return Array.from(dom.querySelectorAll(".tag"))
      .reduce((map, element) => {
        const tagCategory = element.classList[0].replace("tag-type-", "");
        const tagName = this.replaceSpacesWithUnderscores(element.children[1].textContent || "");

        map.set(tagName, tagCategory);
        return map;
      }, new Map());
  }

  /**
   * @param {String} tag
   */
  setAsProblematic(tag) {
    if (Caption.tagCategoryMappings[tag] === undefined && !Utils.customTags.has(tag)) {
      this.problematicTags.add(tag);
    }
  }

  findTagCategoriesOnPageChange() {
    if (!Caption.flags.finishedLoading) {
      return;
    }
    const tagNames = this.getTagNamesWithUnknownCategories(Utils.getAllThumbs().slice(0, 200));

    this.findTagCategories(tagNames, Constants.doNothing, Caption.tagFetchDelay);
  }

  /**
   * @param {String} reason
   */
  abortAllRequests(reason) {
    this.abortController.abort(reason);
    this.abortController = new AbortController();
    Caption.pendingRequests.clear();
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
      if (Utils.isOnlyDigits(tagName) && tagName.length > 5) {
        this.addTagCategoryMapping(tagName, "general");
        continue;
      }

      if (Caption.pendingRequests.size > Caption.settings.maxPendingRequestsAllowed) {
        this.abortAllRequests(`Too many pending requests: ${Caption.pendingRequests.size}`);
        return;
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
        Caption.pendingRequests.add(tagName);
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
            Caption.pendingRequests.delete(tagName);
            const dom = parser.parseFromString(html, "text/html");
            const encoding = dom.getElementsByTagName("tag")[0].getAttribute("type");

            if (encoding === "array") {
              this.setAsProblematic(tagName);
              return;
            }
            this.addTagCategoryMapping(tagName, this.decodeTagCategory(parseInt(encoding || "0")));

            if (tagName === lastTagName) {
              onAllCategoriesFound();
            }
          }).catch(() => {
            onAllCategoriesFound();
          });
      } catch (error) {
        Caption.pendingRequests.delete(tagName);
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
      const tagNames = Array.from(Utils.getTagSetFromThumb(thumb));

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
    return tagName !== thumb.id && Caption.tagCategoryMappings[tagName] === undefined && !Utils.customTags.has(tagName);
  }

  /**
   * @param {String} tagCategory
   * @returns {TagCategory}
   */
  convertToTagCategory(tagCategory) {
    return Types.isTagCategory(tagCategory) ? tagCategory : "general";
  }

  /**
   * @param {Number} encoding
   * @returns {TagCategory}
   */
  decodeTagCategory(encoding) {
    return Caption.tagCategoryDecodings[encoding] || "general";
  }

  /**
   * @param {String} id
   * @param {TagCategory} category
   */
  addTagCategoryMapping(id, category) {
    if (Caption.tagCategoryMappings[id] !== undefined) {
      return;
    }
    Caption.tagCategoryMappings[id] = category;
    Caption.scheduler.add({
      id,
      category
    });
  }
}
