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

  .artistTag {
    color: #f0a0a0;
  }

  .characterTag {
    color: #f0f0a0;
  }

  .copyrightTag {
    color: #e73ee7;
  }

  .metadataTag {
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
    captionTags: "captionTags"
  };
  static importantTagCategories = new Set([
      "copyright",
      "character",
      "artist"
      // "metadata"
    ]);
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
  /**
   * @type {Number}
   */
  recentlyAddedTagsCount;

  constructor() {
    this.recentlyAddedTagsCount = 0;
    this.savedTags = this.loadSavedTags();
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

    if (this.savedTags[thumb.id] === undefined) {
      this.fetchTags(thumb);
    } else {
      this.populateTagsFromLocalStorage(thumb);
      this.resizeFont(thumb);
    }
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
   * @param {HTMLElement} thumb
   */
  fetchTags(thumb) {
    const postPageURL = `https://rule34.xxx/index.php?page=post&s=view&id=${thumb.id}`;

    this.savedTags[thumb.id] = {};
    requestPageInformation(postPageURL, (response) => {
      const dom = new DOMParser().parseFromString(`<div>${response}</div>`, "text/html");

      for (const tagType of Caption.importantTagCategories) {
        const tags = Array.from(dom.getElementsByClassName(`tag-type-${tagType}`));

        this.addFetchedTags(tags, tagType, thumb.id);
      }
      this.saveTags();
      this.resizeFont(thumb);
    });
  }

  /**
   * @param {String} html
   * @returns {Object.<String, String[]>}
   */
  extractTags(html) {
    const dom = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
    const captionTags = {};

    for (const tagType of Caption.importantTagCategories) {
      const extractedTags = [];
      const tagsOnPostPage = Array.from(dom.getElementsByClassName(`tag-type-${tagType}`));

      for (const tagElement of tagsOnPostPage) {
        const tagValue = tagElement.children[1].textContent;

        extractedTags.push(tagValue);
      }
      captionTags[tagType] = extractedTags;
    }
    return captionTags;
  }

  /**
   * @param {HTMLElement} thumb
   */
  populateTagsFromLocalStorage(thumb) {
    for (const tagType of Caption.importantTagCategories) {
      try {
        for (const tagValue of this.savedTags[thumb.id][tagType]) {
          this.addTag(tagType, tagValue);
        }
      } catch (error) {
        Reflect.deleteProperty(this.savedTags, thumb.id);
      }
    }
  }

  /**
   * @param {String[]} tags
   * @param {String} tagCategory
   * @param {String} postId
   */
  addFetchedTags(tags, tagCategory, postId) {
    this.savedTags[postId][tagCategory] = [];

    if (tags.length === 0) {
      return;
    }

    for (const tag of tags) {
      const tagValue = tag.children[1].textContent;

      this.savedTags[postId][tagCategory].push(tagValue);
      this.addTag(tagCategory, tagValue);
    }
  }

  /**
   * @param {String} tagCategory
   * @param {String} tagValue
   */
  addTag(tagCategory, tagValue) {
    const header = document.getElementById(this.getCategoryHeaderId(tagCategory));
    const tag = document.createElement(Caption.htmlTagType);

    tag.className = `${tagCategory}Tag caption-tag`;
    tag.textContent = tagValue;
    header.insertAdjacentElement("afterend", tag);
    header.style.display = "block";
    tag.onclick = () => {
      this.tagOnClick(this.replaceSpacesWithUnderscores(tag.textContent));
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
      window.addEventListener("gotPostPageHTML", (event) => {
        this.savedTags[event.detail.postId] = this.extractTags(event.detail.html);
        this.saveTags();
      });
    }
  }

  /**
   * @returns {Object.<String, Object>}
   */
  loadSavedTags() {
    return JSON.parse(localStorage.getItem(Caption.localStorageKeys.captionTags) || "{}");
  }

  saveTags() {
    if (this.recentlyAddedTagsCount >= 3 && userIsOnTheirOwnFavoritesPage()) {
      this.recentlyAddedTagsCount = 0;
      localStorage.setItem(Caption.localStorageKeys.captionTags, JSON.stringify(this.savedTags));
    } else {
      this.recentlyAddedTagsCount += 1;
    }
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
   * @param {String} tagValue
   * @returns {String}
   */
  replaceSpacesWithUnderscores(tagValue) {
    return tagValue.replace(/ /gm, "_");
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

  collectTagTypes() {
    const tagTypes = {
      0: "general",
      1: "artist",
      2: "metadata",
      3: "copyright",
      4: "character"
    };
    const parser = new DOMParser();
    const tags = {};

    window.addEventListener("favoritesLoaded", async() => {
      const allTags = Array.from(getAllThumbNodeElements())
        .map(thumb => getTagsFromThumb(thumb).replace(/\d+$/, ""))
        .join(" ")
        .split(" ")
        .sort();

      if (allTags.length === 0) {
        return;
      }
      const lastTag = allTags[allTags.length - 1];
      const uniqueTags = new Set(allTags);

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

            tags[tagName] = type;

            if (tagName === lastTag) {
              // console.log(JSON.stringify(tags));
            }
          });
        await sleep(1);
      }
    });
  }
}

if (!onPostPage()) {
  const caption = new Caption();
}
