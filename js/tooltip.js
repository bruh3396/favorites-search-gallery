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
   * @type {Boolean}
  */
  static get disabled() {
    return onMobileDevice() || getPerformanceProfile() > 1 || onPostPage();
  }

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
  visible;
  /**
   * @type {Object.<String,String>}
   */
  searchTagColorCodes;
  /**
   * @type {HTMLTextAreaElement}
   */
  searchBox;
  /**
   * @type {String}
   */
  previousSearch;
  /**
   * @type {HTMLImageElement}
  */
  currentImage;

  constructor() {
    if (Tooltip.disabled) {
      return;
    }
    this.visible = getPreference("showTooltip", true);
    document.body.insertAdjacentHTML("afterbegin", tooltipHTML);
    this.tooltip = document.getElementById("tooltip");
    this.defaultTransition = this.tooltip.style.transition;
    this.searchTagColorCodes = {};
    this.currentImage = null;
    this.setTheme();
    this.addEventListeners();
    this.addFavoritesOptions();
    this.assignColorsToMatchedTags();
  }

  addEventListeners() {
    this.addAllPageEventListeners();
    this.addSearchPageEventListeners();
    this.addFavoritesPageEventListeners();
  }

  addAllPageEventListeners() {
    document.addEventListener("keydown", (event) => {
      if (event.key.toLowerCase() !== "t" || event.repeat || isTypeableInput(event.target)) {
        return;
      }

      if (onFavoritesPage()) {
        const showTooltipsCheckbox = document.getElementById("show-tooltips-checkbox");

        if (showTooltipsCheckbox !== null) {
          showTooltipsCheckbox.click();

          if (this.currentImage !== null) {
            if (this.visible) {
              this.show(this.currentImage);
            } else {
              this.hide();
            }
          }
        }
      } else if (onSearchPage()) {
        this.toggleVisibility();

        if (this.currentImage !== null) {
          this.hide();
        }
      }
    }, {
      passive: true
    });
  }

  addSearchPageEventListeners() {
    if (!onSearchPage()) {
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
    if (!onFavoritesPage()) {
      return;
    }
    window.addEventListener("favoritesFetched", (event) => {
      this.addEventListenersToThumbs.bind(this)(event.detail);
    });
    window.addEventListener("favoritesLoaded", () => {
      this.addEventListenersToThumbs.bind(this)();
    }, {
      once: true
    });
    window.addEventListener("changedPage", () => {
      this.currentImage = null;
      this.addEventListenersToThumbs.bind(this)();
    });
    window.addEventListener("newFavoritesFetchedOnReload", (event) => {
      if (!event.detail.empty) {
        this.addEventListenersToThumbs.bind(this)(event.detail.thumbs);
      }
    }, {
      once: true
    });
  }

  setTheme() {
    if (usingDarkTheme()) {
      this.tooltip.classList.remove("light-green-gradient");
      this.tooltip.classList.add("dark-green-gradient");
    }
  }

  assignColorsToMatchedTags() {
    if (onSearchPage()) {
      this.assignColorsToMatchedTagsOnSearchPage();
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

      image.onmouseenter = (event) => {
        if (enteredOverCaptionTag(event)) {
          return;
        }
        this.currentImage = image;

        if (this.visible) {
          this.show(image);
        }
      };
      image.onmouseleave = (event) => {
        if (!enteredOverCaptionTag(event)) {
          this.currentImage = null;
          this.hide();
        }
      };
    }
  }

  /**
   * @param {HTMLImageElement} image
   */
  setPosition(image) {
    const imageChangesSizeOnHover = document.getElementById("fancy-image-hovering") !== null;
    let rect;

    if (imageChangesSizeOnHover) {
      const imageContainer = image.parentElement;
      const sizeCalculationDiv = document.createElement("div");

      sizeCalculationDiv.className = "size-calculation-div";
      imageContainer.appendChild(sizeCalculationDiv);
      rect = sizeCalculationDiv.getBoundingClientRect();
      sizeCalculationDiv.remove();
    } else {
      rect = image.getBoundingClientRect();
    }
    const offset = 7;
    let tooltipRect;

    this.tooltip.style.top = `${rect.bottom + offset + window.scrollY}px`;
    this.tooltip.style.left = `${rect.x - 3}px`;
    this.tooltip.classList.toggle("visible", true);
    tooltipRect = this.tooltip.getBoundingClientRect();
    const toolTipIsClippedAtBottom = tooltipRect.bottom > window.innerHeight;

    if (!toolTipIsClippedAtBottom) {
      return;
    }
    this.tooltip.style.top = `${rect.top - tooltipRect.height + window.scrollY - offset}px`;
    tooltipRect = this.tooltip.getBoundingClientRect();
    const favoritesTopBar = document.getElementById("favorites-top-bar");
    const elementAboveTooltip = favoritesTopBar === null ? document.getElementById("header") : favoritesTopBar;
    const elementAboveTooltipRect = elementAboveTooltip.getBoundingClientRect();
    const toolTipIsClippedAtTop = tooltipRect.top < elementAboveTooltipRect.bottom;

    if (!toolTipIsClippedAtTop) {
      return;
    }
    const tooltipIsLeftOfCenter = tooltipRect.left < (window.innerWidth / 2);

    this.tooltip.style.top = `${rect.top + window.scrollY + (rect.height / 2) - offset}px`;

    if (tooltipIsLeftOfCenter) {
      this.tooltip.style.left = `${rect.right + offset}px`;
    } else {
      this.tooltip.style.left = `${rect.left - 750 - offset}px`;
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
    this.setText(this.getTagsFromImageWithIdRemoved(image));
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
   * @returns {String}
   */
  getTagsFromImageWithIdRemoved(image) {
    const thumb = getThumbFromImage(image);
    let tags = getTagsFromThumb(thumb);

    if (this.searchTagColorCodes[thumb.id] === undefined) {
      tags = tags.replace(` ${thumb.id}`, "");
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

    this.searchTagColorCodes = {};
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

    if (this.searchTagColorCodes[tag] === undefined) {
      this.searchTagColorCodes[tag] = color;
    }
  }

  /**
   * @param {String} tag
   * @returns {String | null}
   */
  getColorCode(tag) {
    if (this.searchTagColorCodes[tag] !== undefined) {
      return this.searchTagColorCodes[tag];
    }

    for (const searchTag of Object.keys(this.searchTagColorCodes)) {
      if (tagsMatchWildcardSearchTag(searchTag, [tag])) {
        return this.searchTagColorCodes[searchTag];
      }
    }
    return undefined;
  }

  addFavoritesOptions() {
    addOptionToFavoritesPage(
      "show-tooltips",
      " Tooltips",
      "Show tags when hovering over a thumbnail and see which ones were matched by a search",
      this.visible, (event) => {
        this.toggleVisibility(event.target.checked);
      },
      true
    );
  }

  /**
   * @param {Boolean} value
   */
  toggleVisibility(value) {
    if (value === undefined) {
      value = !this.visible;
    }
    setPreference("showTooltip", value);
    this.visible = value;
  }

  /**
   * @param {HTMLElement | null} thumb
   */
  showOnLoadIfHoveringOverThumb(thumb) {
    if (thumb !== null) {
      this.show(getImageFromThumb(thumb));
    }
  }

  assignColorsToMatchedTagsOnSearchPage() {
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
