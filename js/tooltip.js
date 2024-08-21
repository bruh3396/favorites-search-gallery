const tooltipHTML = `<div id="tooltip-container">
  <style>
    #tooltip {
      max-width: 750px;
      border: 1px solid black;
      padding: 0.25em;
      position: absolute;
      box-sizing: border-box;
      z-index: 25;
      pointer-events: none;
      visibility: hidden;
      opacity: 0;
      transition: visibility 0s, opacity 0.25s linear;
      font-size: 1.05em;
    }

    #tooltip.visible {
      visibility: visible;
      opacity: 1;
    }
  </style>
  <span id="tooltip" class="light-green-gradient"></span>
</div>`;

class Tooltip {
  /**
   * @type {HTMLDivElement}
   */
  tooltip;
  /**
   * @type {String}
   */
  defaultTransition;
  /**
   * @type {Boolean}
   */
  enabled;
  /**
   * @type {Object.<String,String>}
   */
  tagColorCodes;
  /**
   * @type {HTMLTextAreaElement}
   */
  searchBox;
  /**
   * @type {String}
   */
  previousSearch;

  constructor() {
    if (onMobileDevice() || getPerformanceProfile() > 1) {
      return;
    }
    this.enabled = getPreference("showTooltip", true);
    document.body.insertAdjacentHTML("afterbegin", tooltipHTML);
    this.tooltip = document.getElementById("tooltip");
    this.defaultTransition = this.tooltip.style.transition;
    this.tagColorCodes = {};
    this.setTheme();
    this.addEventListeners();
    this.assignColorsToMatchedTags();
  }

  addEventListeners() {
    if (onPostPage()) {
      window.addEventListener("load", () => {
        this.addEventListenersToThumbs.bind(this)();
      });
    } else {
      this.addFavoritesOptions();
      window.addEventListener("favoritesFetched", (event) => {
        this.addEventListenersToThumbs.bind(this)(event.detail);
      });
      window.addEventListener("favoritesLoaded", () => {
        this.addEventListenersToThumbs.bind(this)();
      });
      window.addEventListener("thumbUnderCursorOnLoad", (event) => {
        this.showOnLoadIfHoveringOverThumb(event.detail);
      }, {
        once: true
      });
    }
  }

  setTheme() {
    if (usingDarkTheme()) {
      this.tooltip.classList.remove("light-green-gradient");
      this.tooltip.classList.add("dark-green-gradient");
    }
  }

  assignColorsToMatchedTags() {
    if (onPostPage()) {
      this.assignColorsToMatchedTagsOnPostPage();
    } else {
      this.searchBox = document.getElementById("favorites-search-box");
      this.assignColorsToMatchedTagsOnFavoritesPage();
      this.searchBox.addEventListener("input", () => {
        this.assignColorsToMatchedTagsOnFavoritesPage();
      });
      window.addEventListener("searchStarted", () => {
        this.assignColorsToMatchedTagsOnFavoritesPage();
      });

    }
  }

  /**
   * @param {HTMLCollectionOf.<Element>} thumbs
   */
  addEventListenersToThumbs(thumbs) {
    thumbs = thumbs === undefined ? getAllThumbs() : thumbs;

    for (const thumb of thumbs) {
      const image = getImageFromThumb(thumb);

      if (image.hasAttribute("hasTooltipListener")) {
        return;
      }
      image.onmouseenter = () => {
        if (this.enabled) {
          this.show(image);
        }
      };
      image.onmouseleave = (event) => {
        if (!enteredOverCaptionTag(event)) {
          this.hide();
        }
      };
      image.setAttribute("hasTooltipListener", true);
    }
  }

  /**
   * @param {HTMLImageElement} image
   */
  setPosition(image) {
    const imageRect = image.getBoundingClientRect();
    let tooltipRect;
    const offset = 7;

    this.tooltip.style.top = `${imageRect.bottom + offset + window.scrollY}px`;
    this.tooltip.style.left = `${imageRect.x - 3}px`;
    this.tooltip.classList.toggle("visible", true);
    tooltipRect = this.tooltip.getBoundingClientRect();
    const toolTipIsClippedAtBottom = tooltipRect.bottom > window.innerHeight;

    if (!toolTipIsClippedAtBottom) {
      return;
    }
    this.tooltip.style.top = `${imageRect.top - tooltipRect.height + window.scrollY - offset}px`;
    tooltipRect = this.tooltip.getBoundingClientRect();
    const favoritesTopBar = document.getElementById("favorites-top-bar");
    const elementAboveTooltip = favoritesTopBar === null ? document.getElementById("header") : favoritesTopBar;
    const elementAboveTooltipRect = elementAboveTooltip.getBoundingClientRect();
    const toolTipIsClippedAtTop = tooltipRect.top < elementAboveTooltipRect.bottom;

    if (!toolTipIsClippedAtTop) {
      return;
    }
    const tooltipIsLeftOfCenter = tooltipRect.left < (window.innerWidth / 2);

    this.tooltip.style.top = `${imageRect.top + window.scrollY + (imageRect.height / 2) - offset}px`;

    if (tooltipIsLeftOfCenter) {
      this.tooltip.style.left = `${imageRect.right + offset}px`;
    } else {
      this.tooltip.style.left = `${imageRect.left - 750 - offset}px`;
    }
  }

  /**
   * @param {String} tags
   */
  setText(tags) {
    this.tooltip.innerHTML = this.formatHTML(tags);
  }

  /**
   * @param {HTMLImageElement} image
   */
  show(image) {
    let tags = image.hasAttribute("tags") ? image.getAttribute("tags") : image.getAttribute("title");

    tags = this.removeIdFromTags(image, tags);
    this.setText(tags);
    this.setPosition(image);
  }

  hide() {
    this.tooltip.style.transition = "none";
    this.tooltip.classList.toggle("visible", false);
    setTimeout(() => {
      this.tooltip.style.transition = this.defaultTransition;
    }, 5);
  }

  /**
   * @param {HTMLImageElement} image
   * @param {String} tags
   * @returns
   */
  removeIdFromTags(image, tags) {
    const id = getThumbFromImage(image).id;

    if (this.tagColorCodes[id] === undefined) {
      tags = tags.replace(` ${id}`, "");
    }
    return tags;
  }

  /**
   * @returns {String}
   */
  getRandomColor() {
    const letters = "0123456789ABCDEF";
    let color = "#";

    for (let i = 0; i < 6; i += 1) {
      if (i === 2 || i === 3) {
        color += "0";
      } else {
        color += letters[Math.floor(Math.random() * letters.length)];
      }
    }
    return color;
  }

  /**
   * @param {String[]} allTags
   */
  formatHTML(allTags) {
    let html = "";
    const tags = allTags.split(" ");

    for (let i = tags.length - 1; i >= 0; i -= 1) {
      const tag = tags[i];
      const tagColor = this.getColorCode(tag);
      const tagWithSpace = `${tag} `;

      if (tagColor !== undefined) {
        html = `<span style="color:${tagColor}"><b>${tagWithSpace}</b></span>${html}`;
      } else if (includesTag(tag, TAG_BLACKLIST)) {
        html += `<span style="color:red"><s><b>${tagWithSpace}</b></s></span>`;
      } else {
        html += tagWithSpace;
      }

    }
    return html === "" ? allTags : html;
  }

  /**
   * @param {String} searchQuery
   */
  assignTagColors(searchQuery) {
    searchQuery = this.removeNotTags(searchQuery);
    const {orGroups, remainingSearchTags} = extractTagGroups(searchQuery);

    this.tagColorCodes = {};
    this.assignColorsToOrGroupTags(orGroups);
    this.assignColorsToRemainingTags(remainingSearchTags);
  }

  /**
   * @param {String[][]} orGroups
   */
  assignColorsToOrGroupTags(orGroups) {

    for (const orGroup of orGroups) {
      const color = this.getRandomColor();

      for (const tag of orGroup) {
        this.addColorCodedTag(tag, color);
      }
    }
  }

  /**
   * @param {String[]} remainingTags
   */
  assignColorsToRemainingTags(remainingTags) {
    for (const tag of remainingTags) {
      this.addColorCodedTag(tag, this.getRandomColor());
    }
  }

  /**
   * @param {String} tags
   * @returns {String}
   */
  removeNotTags(tags) {
    return tags.replace(/(?:^| )-\S+/gm, "");
  }

  sanitizeTags(tags) {
    return tags.toLowerCase().trim();
  }

  addColorCodedTag(tag, color) {
    tag = this.sanitizeTags(tag);

    if (this.tagColorCodes[tag] === undefined) {
      this.tagColorCodes[tag] = color;
    }
  }

  /**
   * @param {String} tag
   * @returns {String | null}
   */
  getColorCode(tag) {
    if (this.tagColorCodes[tag] !== undefined) {
      return this.tagColorCodes[tag];
    }

    for (const [tagPrefix, _] of Object.entries(this.tagColorCodes)) {
      if (tagPrefix.endsWith("*")) {
        if (tag.startsWith(tagPrefix.replace(/\*$/, ""))) {
          return this.tagColorCodes[tagPrefix];
        }
      }
    }
    return undefined;
  }

  addFavoritesOptions() {
    addOptionToFavoritesPage(
      "show-tooltip",
      " Tooltips",
      "Show related tags when hovering over a thumbnail",
      this.enabled, (event) => {
        setPreference("showTooltip", event.target.checked);
        this.setVisible(event.target.checked);
      },
      true
    );
  }

  /**
   * @param {HTMLElement | null} thumb
   */
  showOnLoadIfHoveringOverThumb(thumb) {
    if (thumb !== null) {
      this.show(getImageFromThumb(thumb));
    }
  }

  /**
   * @param {Boolean} value
   */
  setVisible(value) {
    this.enabled = value;
  }

  assignColorsToMatchedTagsOnPostPage() {
    const searchQuery = document.getElementsByName("tags")[0].getAttribute("value");

    this.assignTagColors(searchQuery);
  }

  assignColorsToMatchedTagsOnFavoritesPage() {
    if (this.searchBox.value === this.previousSearch) {
      return;
    }
    this.previousSearch = this.searchBox.value;
    this.assignTagColors(this.searchBox.value);
  }
}

const tooltip = new Tooltip();
