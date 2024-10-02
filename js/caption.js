const captionHTML = `<style>
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
    padding-top: 4px;
    padding-left: 7px;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;

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

  #caption-list {
    /* padding-left: 5px; */
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
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: block !important;
  }
</style>`;

class Caption {
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

   /**
   * @type {Object.<String, Number>}
   */
 static tagCategoryAssociations;

  /**
   * @returns {String}
   */
  static getCategoryHeaderHTML() {
    let html = "";

    for (const category of Caption.importantTagCategories) {
      const capitalizedCategory = capitalize(category);
      const header = capitalizedCategory === "Metadata" ? "Meta" : capitalizedCategory;

      html += `<li id="caption${capitalizedCategory}" style="display: none;"><h6>${header}</h6></li>`;
    }
    return html;
  }

  /**
   * @param {String} tagCategory
   * @returns {Number}
   */
  static getTagCategoryEncoding(tagCategory) {
    for (const [encoding, category] of Object.entries(Caption.tagCategoryEncodings)) {
      if (category === tagCategory) {
        return encoding;
      }
    }
    return 0;
  }

  /**
   * @type {Boolean}
   */
  get disabled() {
    return this.caption.classList.contains("hide") || this.caption.classList.contains("disabled") || this.caption.classList.contains("remove");
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
   * @type {String[]}
   */
  problematicTags;
  /**
   * @type {Boolean}
   */
  currentlyCorrectingProblematicTags;
  /**
   * @type {String}
   */
  currentThumbId;

  constructor() {
    const captionDisabled = (onPostPage() || onMobileDevice()) || getPerformanceProfile() > 1;

    if (captionDisabled) {
      return;
    }
    Caption.tagCategoryAssociations = this.loadSavedTags();
    this.problematicTags = [];
    this.currentlyCorrectingProblematicTags = false;
    this.previousThumb = null;
    this.currentThumbId = null;
    this.findCategoriesOfAllTags();
    this.create();
    this.injectHTML();
    this.setVisibility(this.getVisibilityPreference());
    this.addEventListeners();
  }

  create() {
    this.captionWrapper = document.createElement("div");
    this.captionWrapper.className = "caption-wrapper";
    this.caption = document.createElement("div");
    this.caption.className = "caption";
    this.captionWrapper.appendChild(this.caption);
    document.head.appendChild(this.captionWrapper);
    this.caption.innerHTML = Caption.template;
  }

  injectHTML() {
    injectStyleHTML(captionHTML);
    addOptionToFavoritesPage(
      "show-captions",
      "Details",
      "Show details when hovering over thumbnail",
      this.getVisibilityPreference(),
      (event) => {
        this.setVisibility(event.target.checked);
      },
      true
    );
  }

  /**
   * @param {HTMLElement[]} thumbs
   */
  async addEventListenersToThumbs(thumbs) {
    await sleep(500);
    thumbs = thumbs === undefined ? getAllThumbs() : thumbs;

    for (const thumb of thumbs) {
      const imageContainer = getImageFromThumb(thumb).parentElement;

      imageContainer.onmouseenter = () => {
        this.show(thumb);
      };

      imageContainer.onmouseleave = () => {
        this.hide(thumb);
      };
    }
  }

  /**
   * @param {HTMLElement} thumb
   */
  show(thumb) {
    if (this.disabled || thumb === null) {
      return;
    }
    thumb.querySelectorAll(".caption-wrapper-clone").forEach(element => element.remove());
    this.caption.classList.remove("inactive");
    this.caption.innerHTML = Caption.template;
    this.captionWrapper.removeAttribute("style");
    const captionIdHeader = this.caption.querySelector("#caption-id");
    const captionIdTag = document.createElement("li");

    captionIdTag.className = "caption-tag";
    captionIdTag.textContent = thumb.id;
    captionIdTag.onclick = (event) => {
      event.stopPropagation();
      this.tagOnClick(thumb.id, event);
    };
    captionIdTag.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      this.tagOnClick(`-${thumb.id}`, event);
    });
    captionIdHeader.insertAdjacentElement("afterend", captionIdTag);
    thumb.children[0].appendChild(this.captionWrapper);
    this.populateTags(thumb);
  }

  /**
   * @param {HTMLElement} thumb
   */
  hide(thumb) {
    if (this.disabled) {
      return;
    }

    if (thumb !== null && thumb !== undefined) {
      this.animateExit(thumb);
    }
    this.animate(false);
    this.caption.classList.add("inactive");
    this.caption.classList.remove("transition-completed");
  }

  /**
   * @param {HTMLElement} thumb
   */
  animateExit(thumb) {
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
    const imageRect = getImageFromThumb(thumb).getBoundingClientRect();
    const captionListRect = this.caption.children[0].getBoundingClientRect();
    const ratio = imageRect.height / captionListRect.height;
    const scale = ratio > 1 ? Math.sqrt(ratio) : ratio * 0.85;

    this.caption.parentElement.style.fontSize = `${roundToTwoDecimalPlaces(scale)}em`;
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
      this.tagOnClick(tagName, event);
    };
    tag.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      this.tagOnClick(`-${this.replaceSpacesWithUnderscores(tag.textContent)}`, event);
    });
  }

  addEventListeners() {
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
      const thumb = caption.parentElement;

      if (event.detail) {
        this.hide(thumb);

        this.caption.classList.add("hide");
      } else {
        this.caption.classList.remove("hide");
      }
    });

    if (onPostPage()) {
      window.addEventListener("load", () => {
        this.addEventListenersToThumbs.bind(this)();
      }, {
        once: true,
        passive: true
      });
    } else {
      window.addEventListener("favoritesLoaded", this.addEventListenersToThumbs.bind(this)(), {
        once: true
      });
      window.addEventListener("favoritesFetched", () => {
        this.addEventListenersToThumbs.bind(this)();
      });
      window.addEventListener("changedPage", () => {
        this.addEventListenersToThumbs.bind(this)();
        const tagNames = this.getTagNamesWithUnknownCategories(getAllVisibleThumbs().slice(0, 100));

        this.findTagCategories(tagNames, 3, () => {
          this.saveTags();
        });

      });
      window.addEventListener("thumbUnderCursorOnLoad", (event) => {
        const showOnHoverCheckbox = document.getElementById("showOnHover");

        if (showOnHoverCheckbox !== null && showOnHoverCheckbox.checked) {
          this.show(event.detail);
        }
      });
      window.addEventListener("showCaption", (event) => {
        this.show(event.detail);
      });
      window.addEventListener("originalContentCleared", (event) => {
        const thumbs = event.detail;
        const tagNames = this.getTagNamesWithUnknownCategories(thumbs);

        this.findTagCategories(tagNames, 3, () => {
          this.saveTags();
        });
      });
      window.addEventListener("originalContentCleared", (event) => {
        const thumbs = event.detail;
        const tagNames = this.getTagNamesWithUnknownCategories(thumbs);

        this.findTagCategories(tagNames, 3, () => {
          this.saveTags();
        });
      });
      window.addEventListener("newFavoritesFetchedOnReload", (event) => {
        this.addEventListenersToThumbs.bind(this)(event.detail);
      }, {
        once: true
      });
    }
  }

  /**
   * @returns {Object.<String, Number>}
   */
  loadSavedTags() {
    return JSON.parse(localStorage.getItem(Caption.localStorageKeys.tagCategories) || "{}");
  }

  saveTags() {
    localStorage.setItem(Caption.localStorageKeys.tagCategories, JSON.stringify(Caption.tagCategoryAssociations));
  }

  /**
   * @param {String} value
   * @param {MouseEvent} mouseEvent
   */
  tagOnClick(value, mouseEvent) {
    if (mouseEvent.ctrlKey) {
      openSearchPage(value);
      return;
    }
    const searchBox = onPostPage() ? document.getElementsByName("tags")[0] : document.getElementById("favorites-search-box");
    const searchBoxDoesNotIncludeTag = true;
    // const searchBoxDoesNotIncludeTag = searchBox !== null && !searchBox.value.includes(` ${value}`);

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
    return tagName.replace(/_/gm, " ");
  }

  /**
   * @param {String} tagName
   * @returns {String}
   */
  replaceSpacesWithUnderscores(tagName) {
    return tagName.replace(/\s/gm, "_");
  }

  /**
   * @param {Boolean} value
   */
  setVisibility(value) {
    if (value) {
      this.caption.classList.remove("disabled");
    } else if (!this.caption.classList.contains("disabled")) {
      this.caption.classList.add("disabled");
    }
    setPreference(Caption.preferences.visibility, value);
  }

  /**
   * @returns {Boolean}
   */
  getVisibilityPreference() {
    return getPreference(Caption.preferences.visibility, true);
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
    return `caption${capitalize(tagCategory)}`;
  }

  /**
   * @param {HTMLElement} thumb
   */
  populateTags(thumb) {
    const tagNames = getTagsFromThumb(thumb).replace(/\s\d+$/, "")
      .split(" ");
    const unknownThumbTags = tagNames
      .filter(tag => Caption.tagCategoryAssociations[tag] === undefined);

    this.currentThumbId = thumb.id;

    if (unknownThumbTags.length > 0) {
      this.findTagCategories(unknownThumbTags, 1, () => {
        this.addTags(tagNames, thumb);
      });
      return;
    }
    this.addTags(tagNames, thumb);
  }

  /**
   * @param {String[]} tagNames
   * @param {HTMLElement} thumb
   */
  addTags(tagNames, thumb) {
    this.saveTags();

    if (this.currentThumbId !== thumb.id) {
      return;
    }

    if (thumb.getElementsByClassName("caption-tag").length > 1) {
      return;
    }

    for (const tagName of tagNames) {
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
   * @param {String} problematicTag
   */
  async correctProblematicTag(problematicTag) {
    this.problematicTags.push(problematicTag);

    if (this.currentlyCorrectingProblematicTags) {
      return;
    }
    this.currentlyCorrectingProblematicTags = true;

    while (this.problematicTags.length > 0) {
      const tagName = this.problematicTags.pop();
      const tagPageURL = `https://rule34.xxx/index.php?page=tags&s=list&tags=${tagName}`;

      await fetch(tagPageURL)
        .then((response) => {
          if (response.ok) {
            return response.text();
          }
          throw new Error(response.statusText);
        })
        .then((html) => {
          const dom = new DOMParser().parseFromString(html, "text/html");
          const columnOfFirstRow = dom.getElementsByClassName("highlightable")[0].getElementsByTagName("td");

          if (columnOfFirstRow.length !== 3) {
            Caption.tagCategoryAssociations[tagName] = 0;
            this.saveTags();
            return;
          }
          const category = columnOfFirstRow[2].textContent.split(",")[0].split(" ")[0];

          Caption.tagCategoryAssociations[tagName] = Caption.getTagCategoryEncoding(category);
          this.saveTags();
        });
    }
    this.currentlyCorrectingProblematicTags = false;
  }

  /**
   * @param {String[]} tagNames
   * @param {Number} fetchDelay
   * @param {Function} onAllCategoriesFound
   */
  async findTagCategories(tagNames, fetchDelay, onAllCategoriesFound) {
    const parser = new DOMParser();
    const lastTagName = tagNames[tagNames.length - 1];
    const uniqueTagNames = new Set(tagNames);

    for (const tagName of uniqueTagNames) {
      const apiURL = `https://api.rule34.xxx//index.php?page=dapi&s=tag&q=index&name=${encodeURIComponent(tagName)}`;

      try {
        fetch(apiURL)
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
              this.correctProblematicTag(tagName);
              return;
            }
            Caption.tagCategoryAssociations[tagName] = parseInt(encoding);

            if (tagName === lastTagName && onAllCategoriesFound !== undefined) {
              onAllCategoriesFound();
            }
          });
      } catch (error) {
        if (error.name !== "TypeError") {
          throw error;
        }
      }
      await sleep(fetchDelay);
    }
  }

  /**
   * @param {HTMLElement[]} thumbs
   * @returns {String[]}
   */
  getTagNamesWithUnknownCategories(thumbs) {
    return Array.from(thumbs)
      .map(thumb => getTagsFromThumb(thumb).replace(/ \d+$/, ""))
      .join(" ")
      .split(" ")
      .filter(tagName => Caption.tagCategoryAssociations[tagName] === undefined);
  }

  findCategoriesOfAllTags() {
    window.addEventListener("favoritesLoaded", () => {
      const allTagNames = this.getTagNamesWithUnknownCategories(getAllThumbs);

      if (allTagNames.length === 0) {
        return;
      }
      this.findTagCategories(allTagNames, 2, () => {
        this.saveTags();
      });
    });
  }
}

const caption = new Caption();
