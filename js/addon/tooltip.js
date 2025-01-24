class Tooltip {
  static tooltipHTML = `
<div id="tooltip-container">
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
</div>
`;
  /**
   * @type {Boolean}
   */
  static get disabled() {
    return Utils.onMobileDevice() || Utils.getPerformanceProfile() > 1 || Utils.onPostPage();
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
    this.visible = Utils.getPreference("showTooltip", true);
    Utils.insertFavoritesSearchGalleryHTML("afterbegin", Tooltip.tooltipHTML);
    this.tooltip = document.getElementById("tooltip");
    this.defaultTransition = this.tooltip.style.transition;
    this.searchTagColorCodes = {};
    this.currentImage = null;
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
      if (event.key.toLowerCase() !== "t" || !Utils.isHotkeyEvent(event)) {
        return;
      }

      if (Utils.onFavoritesPage()) {
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
      } else if (Utils.onSearchPage()) {
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
    if (!Utils.onFavoritesPage()) {
      return;
    }
    window.addEventListener("favoritesFetched", () => {
      this.addEventListenersToThumbs.bind(this)();
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
    window.addEventListener("newFavoritesFoundOnReload", (event) => {
      const favorites = event.detail;

      if (favorites.length > 0) {
        this.addEventListenersToThumbs.bind(this)(favorites);
      }
    }, {
      once: true
    });
  }

  assignColorsToMatchedTags() {
    if (Utils.onSearchPage()) {
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
    thumbs = thumbs === undefined ? Utils.getAllThumbs() : thumbs;

    for (const thumb of thumbs) {
      const image = Utils.getImageFromThumb(thumb);

      if (image.onmouseenter !== null) {
        continue;
      }

      image.onmouseenter = (event) => {
        if (Utils.enteredOverCaptionTag(event)) {
          return;
        }
        this.currentImage = image;

        if (this.visible) {
          this.show(image);
        }
      };
      image.onmouseleave = (event) => {
        if (!Utils.enteredOverCaptionTag(event)) {
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
    const fancyHoveringStyle = document.getElementById("fancy-image-hovering-fsg-style");
    const imageChangesSizeOnHover = fancyHoveringStyle !== null && fancyHoveringStyle.textContent !== "";
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
    const menu = document.getElementById("favorites-search-gallery-menu");
    const elementAboveTooltip = menu === null ? document.getElementById("header") : menu;
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
   * @param {HTMLImageElement} image
   */
  show(image) {
    this.tooltip.innerHTML = this.formatHTML(this.getTags(image));
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
  getTags(image) {
    const thumb = Utils.getThumbFromImage(image);
    const tags = Utils.getTagsFromThumb(thumb);

    if (this.searchTagColorCodes[thumb.id] === undefined) {
      tags.delete(thumb.id);
    }
    return Array.from(tags).sort().join(" ");
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
   * @param {String} tags
   */
  formatHTML(tags) {
    let unmatchedTagsHTML = "";
    let matchedTagsHTML = "";

    const tagList = Utils.removeExtraWhiteSpace(tags).split(" ");

    for (let i = 0; i < tagList.length; i += 1) {
      const tag = tagList[i];
      const tagColor = this.getColorCode(tag);
      const tagWithSpace = `${tag} `;

      if (tagColor !== undefined) {
        matchedTagsHTML += `<span style="color:${tagColor}"><b>${tagWithSpace}</b></span>`;
      } else if (Utils.includesTag(tag, new Set(Utils.tagBlacklist.split(" ")))) {
        unmatchedTagsHTML += `<span style="color:red"><s><b>${tagWithSpace}</b></s></span>`;
      } else {
        unmatchedTagsHTML += tagWithSpace;
      }
    }
    const html = matchedTagsHTML + unmatchedTagsHTML;

    if (html === "") {
      return tags;
    }
    return html;
  }

  /**
   * @param {String} searchQuery
   */
  assignTagColors(searchQuery) {
    searchQuery = this.removeNotTags(searchQuery);
    const {orGroups, remainingSearchTags} = Utils.extractTagGroups(searchQuery);

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
      if (Utils.tagsMatchWildcardSearchTag(searchTag, [tag])) {
        return this.searchTagColorCodes[searchTag];
      }
    }
    return undefined;
  }

  addFavoritesOptions() {
    Utils.createFavoritesOption(
      "show-tooltips",
      " Tooltips",
      "Show tags when hovering over a thumbnail and see which ones were matched by a search",
      this.visible, (event) => {
        this.toggleVisibility(event.target.checked);
      },
      true,
      "(T)"
    );
  }

  /**
   * @param {Boolean} value
   */
  toggleVisibility(value) {
    if (value === undefined) {
      value = !this.visible;
    }
    Utils.setPreference("showTooltip", value);
    this.visible = value;
  }

  /**
   * @param {HTMLElement | null} thumb
   */
  showOnLoadIfHoveringOverThumb(thumb) {
    if (thumb !== null) {
      this.show(Utils.getImageFromThumb(thumb));
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
