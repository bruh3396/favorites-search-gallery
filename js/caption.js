const captionHTML = `<style>
  .caption {
    overflow: hidden;
    pointer-events: none;
    background: rgba(0, 0, 0, .7);
    z-index: 15;
    position: absolute;
    width: 100%;
    height: 100%;
    top: -100%;
    left: 0px;
    top: 0px;
    text-align: left;
    transition: transform 0.3s cubic-bezier(1, 0.2, 0.2, 1);

    h6 {
      display: block;
      color: white;
      padding-left: 5px;
      padding-top: 0px;
    }

    li {
      width: fit-content;
      list-style-type: none;
      display: inline-block;
    }
  }

  .caption.hide {
    display: none;
  }

  .caption.inactive {
    display: none;
  }

  .caption-tag {
    pointer-events: all;
    color: #6cb0ff;
    word-wrap: break-word;
    margin-left: 10px;

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
    color: #e73ee7;
  }

  .metadata-tag {
    color: #FF8800;
  }

  .thumb.selected {
    .caption {
      transform: translateY(50%);
    }
  }

  .captionWrapper {
    pointer-events: none;
    position: absolute !important;
    overflow: hidden;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: block !important;
  }

  #caption-id {
    display: block;
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
    "artist"
    // "metadata"
  ]);
  static tagCategoryAssociations = {
    0: "general",
    1: "artist",
    2: "metadata",
    3: "copyright",
    4: "character"
  };
  static htmlTagType = "li";
  static template = `
     <ul id="caption-list">
         <li id="caption-id"><h6>ID</h6></li>
         ${Caption.getCaptionHeaderHTML()}
     </ul>
 `;

  /**
   * @returns {String}
   */
  static getCaptionHeaderHTML() {
    let html = "";

    for (const category of Caption.importantTagCategories) {
      const capitalizedTagType = capitalize(category);
      const header = capitalizedTagType === "Metadata" ? "Meta" : capitalizedTagType;

      html += `<li id="caption${capitalizedTagType}" style="display: none;"><h6>${header}</h6></li>\n`;
    }
    return html;
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
  caption;
  /**
   * @type {Object.<String, Object>}
   */
  savedTags;

  constructor() {
    this.savedTags = this.loadSavedTags();
    this.collectAllTagTypes();
    this.createElement();
    this.injectHTML();
    this.setVisibility(this.getVisibilityPreference());
    this.addEventListeners();
  }

  createElement() {
    this.caption = document.createElement("div");
    this.caption.className = "caption";
    document.head.appendChild(this.caption);
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

  async addEventListenersToThumbs() {
    await sleep(500);

    for (const thumb of getAllThumbNodeElements()) {
      const image = getImageFromThumb(thumb);

      if (image.hasAttribute("hasCaptionListener")) {
        return;
      }
      image.setAttribute("hasCaptionListener", true);
      image.addEventListener("mouseenter", () => {
        this.selectThumb(thumb, true);
        this.show(thumb);
      });
      image.addEventListener("mouseleave", (event) => {
        if (enteredOverCaptionTag(event)) {
          return;
        }
        this.selectThumb(thumb, false);
        this.hide(thumb);
      });
    }
  }

  /**
   * @param {HTMLElement} thumb
   */
  show(thumb) {
    if (this.disabled || thumb === null) {
      return;
    }
    const captionWrapper = document.createElement("div");

    captionWrapper.className = "captionWrapper";
    this.caption.classList.toggle("inactive", false);
    this.caption.innerHTML = Caption.template;
    const captionIdHeader = document.getElementById("caption-id");
    const captionIdTag = document.createElement(Caption.htmlTagType);

    captionIdTag.className = "caption-tag";
    captionIdTag.textContent = thumb.id;
    captionIdTag.onclick = () => {
      this.tagOnClick(thumb.id);
    };
    captionIdTag.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      this.tagOnClick(`-${thumb.id}`);
    });
    captionIdHeader.insertAdjacentElement("afterend", captionIdTag);
    captionWrapper.appendChild(this.caption);
    thumb.appendChild(captionWrapper);
    this.resize(thumb);

    this.populateTags(thumb);
  }

  /**
   * @param {HTMLElement} thumb
   */
  hide(thumb) {
    if (this.disabled || !this.alreadyAttachedToThumb(thumb)) {
      return;
    }
    this.caption.classList.toggle("inactive", true);
    document.head.appendChild(this.caption);

    for (const captionWrapper of thumb.querySelectorAll(".captionWrapper")) {
      captionWrapper.remove();
    }
  }

  /**
   * @param {HTMLElement} thumb
   */
  resize(thumb) {
    const height = getImageFromThumb(thumb).getBoundingClientRect().height;

    this.caption.style.height = `${height}px`;
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
    const tag = document.createElement(Caption.htmlTagType);

    tag.className = `${tagCategory}-tag caption-tag`;
    tag.textContent = this.replaceUnderscoresWithSpaces(tagName);
    header.insertAdjacentElement("afterend", tag);
    header.style.display = "block";
    tag.onclick = () => {
      this.tagOnClick(tagName);
    };
    tag.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      this.tagOnClick(`-${this.replaceSpacesWithUnderscores(tag.textContent)}`);
    });
  }

  addEventListeners() {
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
      window.addEventListener("favoritesAdded", this.addEventListenersToThumbs.bind(this)());
      window.addEventListener("thumbUnderCursorOnLoad", (event) => {
        const showOnHoverCheckbox = document.getElementById("showOnHover");

        if (showOnHoverCheckbox !== null && showOnHoverCheckbox.checked) {
          this.show(event.detail);
        }
      });
      window.addEventListener("showCaption", (event) => {
        this.show(event.detail);
      });
    }
  }

  /**
   * @returns {Object.<String, Object>}
   */
  loadSavedTags() {
    return JSON.parse(localStorage.getItem(Caption.localStorageKeys.tagCategories) || "{}");
  }

  saveTags() {
    localStorage.setItem(Caption.localStorageKeys.tagCategories, JSON.stringify(this.savedTags));
  }

  /**
   * @param {String} value
   */
  tagOnClick(value) {
    const searchBox = onPostPage() ? document.getElementsByName("tags")[0] : document.getElementById("favorites-search-box");

    navigator.clipboard.writeText(value);

    if (searchBox !== null && !searchBox.value.includes(` ${value}`)) {
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
   * @param {HTMLElement} thumb
   * @returns {Boolean}
   */
  alreadyAttachedToThumb(thumb) {
    return this.caption.parentElement.parentElement.id === thumb.id;
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
    return getPreference(Caption.preferences.visibility, false);
  }

  /**
   * @param {HTMLElement} thumb
   * @param {Boolean} value
   */
  selectThumb(thumb, value) {
    if (usingRenderer()) {
      return;
    }
    setTimeout(() => {
      thumb.classList.toggle("selected", value);
    }, 10);
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
    const thumbTags = getTagsFromThumb(thumb).replace(/\s\d+$/, "")
      .split(" ");
    const unknownThumbTags = thumbTags
      .filter(tag => this.savedTags[tag] === undefined);

    if (unknownThumbTags.length > 0) {
      this.collectTagTypes(unknownThumbTags, () => {
        this.addTags(thumbTags, thumb);
      });
      return;
    }
    this.addTags(thumbTags, thumb);
  }

  /**
   * @param {String[]} thumbTags
   * @param {HTMLElement} thumb
   */
  addTags(thumbTags, thumb) {
    for (const tagName of thumbTags) {
      const category = this.getTagCategory(tagName);

      this.addTag(category, tagName);
    }
    this.saveTags();
    this.resizeFont(thumb);
  }

  /**
   * @param {String} tag
   * @returns {String}
   */
  getTagCategory(tag) {
    const typeNumber = this.savedTags[tag];

    if (typeNumber === undefined) {
      return "general";
    }
    return Caption.tagCategoryAssociations[typeNumber];
  }

  /**
   * @param {String[]} tags
   * @param { Function} onAllTagsFound
   */
  async collectTagTypes(tags, onAllTagsFound) {
    const parser = new DOMParser();
    const lastTag = tags[tags.length - 1];
    const uniqueTags = new Set(tags);

    for (const tagName of uniqueTags) {
      const apiURL = `https://api.rule34.xxx//index.php?page=dapi&s=tag&q=index&name=${encodeURIComponent(tagName)}`;

      fetch(apiURL)
        .then((response) => {
          if (response.ok) {
            return response.text();
          }
          throw new Error(response.statusText);
        })
        .then((html) => {
          const dom = parser.parseFromString(html, "text/html");
          const type = dom.getElementsByTagName("tag")[0].getAttribute("type");

          this.savedTags[tagName] = type;

          if (tagName === lastTag && onAllTagsFound !== undefined) {
            onAllTagsFound();
          }
        });
      await sleep(1);
    }
  }

  collectAllTagTypes() {
    window.addEventListener("favoritesLoaded", () => {
      const allTags = Array.from(getAllThumbNodeElements())
        .map(thumb => getTagsFromThumb(thumb).replace(/ \d+$/, ""))
        .join(" ")
        .split(" ")
        .filter(tag => this.savedTags[tag] === undefined)
        .sort();

      if (allTags.length === 0) {
        return;
      }
      this.collectTagTypes(allTags, () => {
        this.saveTags();
      });
    });
  }
}

if (!onPostPage()) {
  const caption = new Caption();
}
