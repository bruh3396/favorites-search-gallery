class Utils {
  static localStorageKeys = {
    imageExtensions: "imageExtensions",
    preferences: "preferences"
  };
  static settings = {
    extensionsFoundBeforeSavingCount: 100
  };
  static mainSearchBoxId = "favorites-search-box";
  static idsToRemoveOnReloadLocalStorageKey = "recentlyRemovedIds";
  static tagBlacklist = Utils.getTagBlacklist();
  static addedFavoriteStatuses = {
    error: 0,
    alreadyAdded: 1,
    notLoggedIn: 2,
    success: 3
  };
  static removedFavoriteStatuses = {
    error: 0,
    removeNotAllowed: 1,
    success: 3
  };
  static styles = {
    darkTheme: `
    input[type=number] {
      background-color: #303030;
      color: white;
      }

    .number {
      background-color: #303030;

      >hold-button,
      button {
        color: white;
      }
    }

    #favorites-pagination-container {
      >button {
        border: 1px solid white !important;
        color: white !important;
      }
    }
  `,
    fancyHovering: `
    #caption-list {
      transform: scale(0.8);
    }
     #favorites-search-gallery-content {
          padding: 40px 40px 30px !important;
          grid-gap: 1cqw !important;
        }

        .favorite,
        .thumb {
          >a,
          >span,
          >div {
            box-shadow: 0 1px 2px rgba(0,0,0,0.15);
            transition: transform 0.2s ease-in-out;
            position: relative;

            &::after {
              content: '';
              position: absolute;
              z-index: -1;
              width: 100%;
              height: 100%;
              opacity: 0;
              top: 0;
              left: 0;
              border-radius: 5px;
              box-shadow: 5px 10px 15px rgba(0,0,0,0.45);
              transition: opacity 0.3s ease-in-out;
            }

            &:hover {
              outline: none !important;
              transform: scale(1.2, 1.2);
              z-index: 10;

              img {
                outline: none !important;
              }

              &::after {
                opacity: 1;
              }
            }
          }
        }
    `
  };
  static clickCodes = {
    left: 0,
    middle: 1,
    right: 2
  };
  static customTags = Utils.loadCustomTags();
  static favoriteItemClassName = "favorite";
  static imageExtensions = Utils.loadDiscoveredImageExtensions();
  /** @type {RegExp} */
  static thumbnailSourceCompressionRegex = /thumbnails\/+([0-9]+)\/+thumbnail_([0-9a-f]+)/;
  /** @type {Cooldown} */
  static imageExtensionAssignmentCooldown;
  static recentlyDiscoveredImageExtensionCount = 0;
  /** @type {Record<Number, MediaExtension>} */
  static extensionDecodings = {
    0: "jpg",
    1: "png",
    2: "jpeg",
    3: "gif",
    4: "mp4"
  };
  /** @type {Record<MediaExtension, Number>} */
  static extensionEncodings = {
    "jpg": 0,
    "png": 1,
    "jpeg": 2,
    "gif": 3,
    "mp4": 4
  };
  /** @type {Function[]} */
  static staticInitializers = [];

  /** @type {String} */
  static get itemClassName() {
    return Flags.onSearchPage ? "thumb" : Utils.favoriteItemClassName;
  }

  static setup() {
    Utils.invokeStaticInitializers();
    Utils.removeUnusedScripts();
    Utils.insertCommonStyleHTML();
    Utils.setTheme();
    Utils.setTitle();
    Utils.initializeSearchPage();
    Utils.setupOriginalImageLinksOnSearchPage();
    Utils.initializeImageExtensionAssignmentCooldown();
  }

  /**
   * @param {String} key
   * @param {any} value
   */
  static setCookie(key, value) {
    let cookieString = `${key}=${value || ""}`;
    const expirationDate = new Date();

    expirationDate.setFullYear(expirationDate.getFullYear() + 1);
    cookieString += `; expires=${expirationDate.toUTCString()}`;
    cookieString += "; path=/";
    document.cookie = cookieString;
  }

  /**
   * @param {String} key
   * @param {any} defaultValue
   * @returns {String | null}
   */
  static getCookie(key, defaultValue) {
    const nameEquation = `${key}=`;
    const cookies = document.cookie.split(";").map(cookie => cookie.trimStart());

    for (const cookie of cookies) {
      if (cookie.startsWith(nameEquation)) {
        return cookie.substring(nameEquation.length, cookie.length);
      }
    }
    return defaultValue === undefined ? null : defaultValue;
  }

  /**
   * @returns {String}
   */
  static getUserId() {
    return Utils.getCookie("user_id", "") || "";
  }

  /**
   * @returns {String | null}
   */
  static getFavoritesPageId() {
    const match = (/(?:&|\?)id=(\d+)/).exec(window.location.href);
    return match ? match[1] : null;
  }

  /**
   * @param {Number} value
   * @param {Number} min
   * @param {Number} max
   * @returns {Number}
   */
  static clamp(value, min, max) {
    if (value <= min) {
      return min;
    } else if (value >= max) {
      return max;
    }
    return value;
  }

  /**
   * @param {Number} milliseconds
   * @returns {Promise<any>}
   */
  static sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }

  /**
   * @param {Boolean} value
   */
  static forceHideCaptions(value) {
    Utils.insertStyleHTML(`
        .caption {
          display: ${value ? "none" : ""} !important;
        }
      `, "caption-hiding");

    document.getElementById("caption-hiding-fsg-style");
  }

  /**
   * @param {HTMLImageElement} image
   */
  static removeTitleFromImage(image) {
    if (image.hasAttribute("title")) {
      image.setAttribute("tags", image.title);

      image.removeAttribute("title");
    }
  }

  /**
   * @param {HTMLElement} image
   * @returns {HTMLElement | null}
   */
  static getThumbFromImage(image) {
    return image.closest(`.${Utils.itemClassName}`);
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {HTMLImageElement | null}
   */
  static getImageFromThumb(thumb) {
    return thumb.querySelector("img");
  }

  /**
   * @returns {HTMLElement[]}
   */
  static getAllThumbs() {
    return Array.from(document.getElementsByClassName(Utils.itemClassName))
      .filter(thumb => thumb instanceof HTMLElement);
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {String}
   */
  static getOriginalImageURLFromThumb(thumb) {
    return Utils.getOriginalImageURL(thumb);
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {String}
   */
  static getOriginalImageURL(thumb) {
    const image = Utils.getImageFromThumb(thumb);
    const thumbURL = image === null ? "" : image.src;
    return Utils.getOriginalImageURLFromIdAndThumbURL(thumb.id, thumbURL);
  }

  /**
   * @param {String} id
   * @param {String} thumbURL
   * @returns {String}
   */
  static getOriginalImageURLFromIdAndThumbURL(id, thumbURL) {
    const cleanedThumbSource = Utils.cleanThumbnailSource(thumbURL, id);
    return cleanedThumbSource
      .replace("thumbnails", "/images")
      .replace("thumbnail_", "")
      .replace("us.rule34", "rule34");
  }

  /**
   * @param {String} imageURL
   * @returns {MediaExtension}
   */
  static getExtensionFromImageURL(imageURL) {
    const match = (/\.(png|jpg|jpeg|gif|mp4)/g).exec(imageURL);

    if (match === null || !Types.isMediaExtension(match[1])) {
      return Settings.defaultExtension;
    }
    return match[1];
  }

  /**
   * @param {HTMLElement | Post} thumb
   * @returns {Set<String>}
   */
  static getTagsFromThumb(thumb) {
    if (Flags.onSearchPage) {
      if (!(thumb instanceof HTMLElement)) {
        return new Set();
      }
      const image = Utils.getImageFromThumb(thumb);

      if (image === null) {
        return new Set();
      }
      const tags = image.hasAttribute("tags") ? image.getAttribute("tags") : image.title;
      return Utils.convertToTagSet(tags || "");
    }
    const post = Post.allPosts.get(thumb.id);
    return post === undefined ? new Set() : new Set(post.tagSet);
  }

  /**
   * @param {String} tag
   * @param {Set<String>} tags
   * @returns
   */
  static includesTag(tag, tags) {
    return tags.has(tag);
  }

  /**
   * @param {HTMLElement | Post} thumb
   * @returns {Boolean}
   */
  static isVideo(thumb) {
    const tags = Utils.getTagsFromThumb(thumb);
    return tags.has("video") || tags.has("mp4");
  }

  /**
   * @param {HTMLElement | Post} thumb
   * @returns {Boolean}
   */
  static isGif(thumb) {
    if (Utils.isVideo(thumb)) {
      return false;
    }
    const tags = Utils.getTagsFromThumb(thumb);
    return tags.has("gif") || tags.has("animated") || tags.has("animated_png") || Utils.hasGifAttribute(thumb);
  }

  /**
   * @param {HTMLElement | Post} thumb
   * @returns {Boolean}
   */
  static hasGifAttribute(thumb) {
    if (thumb instanceof Post) {
      return false;
    }
    const image = Utils.getImageFromThumb(thumb);
    return image !== null && image.hasAttribute("gif");
  }

  /**
   * @param {HTMLElement | Post} thumb
   * @returns {Boolean}
   */
  static isImage(thumb) {
    return !Utils.isVideo(thumb) && !Utils.isGif(thumb);
  }

  /**
   * @param {HTMLElement | Post} thumb
   * @returns {Boolean}
   */
  static isAnimated(thumb) {
    return !Utils.isImage(thumb);
  }

  /**
   * @param {Number} maximum
   * @returns {Number}
   */
  static getRandomInteger(maximum) {
    return Math.floor(Math.random() * maximum);
  }

  /**
   * @param {any[]} array
   * @returns {any[]}
   */
  static shuffleArray(array) {
    let maxIndex = array.length;
    let randomIndex;

    while (maxIndex > 0) {
      randomIndex = Utils.getRandomInteger(maxIndex);
      maxIndex -= 1;
      [
        array[maxIndex],
        array[randomIndex]
      ] = [
          array[randomIndex],
          array[maxIndex]
        ];
    }
    return array;
  }

  /**
   * @param {String} tags
   * @returns {String}
   */
  static negateTags(tags) {
    return tags.replace(/(\S+)/g, "-$1");
  }

  /**
   * @param {HTMLInputElement | HTMLTextAreaElement} input
   * @returns {HTMLElement | null}
   */
  static getAwesompleteFromInput(input) {
    const awesomplete = input.parentElement;

    if (awesomplete === null || awesomplete.className !== "awesomplete") {
      return null;
    }
    return awesomplete;
  }

  /**
   * @param {HTMLInputElement | HTMLTextAreaElement} input
   * @returns {Boolean}
   */
  static awesompleteIsVisible(input) {
    const awesomplete = Utils.getAwesompleteFromInput(input);

    if (awesomplete === null) {
      return false;
    }
    const awesompleteSuggestions = awesomplete.querySelector("ul");
    return awesompleteSuggestions !== null && !awesompleteSuggestions.hasAttribute("hidden");
  }

  /**
   * @param {HTMLInputElement | HTMLTextAreaElement} input
   * @returns {Boolean}
   */
  static awesompleteIsSelected(input) {
    return !Utils.awesompleteIsUnselected(input);
  }

  /**
   * @param {HTMLInputElement | HTMLTextAreaElement} input
   * @returns {Boolean}
   */
  static awesompleteIsUnselected(input) {
    const awesomplete = Utils.getAwesompleteFromInput(input);

    if (awesomplete === null) {
      return true;
    }

    if (!Utils.awesompleteIsVisible(input)) {
      return true;
    }
    const searchSuggestions = Array.from(awesomplete.querySelectorAll("li"));

    if (searchSuggestions.length === 0) {
      return true;
    }
    const somethingIsSelected = searchSuggestions.map(li => li.getAttribute("aria-selected"))
      .some(element => element === "true");
    return !somethingIsSelected;
  }

  /**
   * @param {String} optionId
   * @param {String} optionText
   * @param {String} optionTitle
   * @param {Boolean} optionIsChecked
   * @param {Function} onOptionChanged
   * @param {Boolean} optionIsVisible
   * @param {String} optionHint
   * @returns {HTMLElement | null}
   */
  static createFavoritesOption(optionId, optionText, optionTitle, optionIsChecked, onOptionChanged, optionIsVisible, optionHint = "") {
    const id = Flags.onMobileDevice ? "favorite-options" : "dynamic-favorite-options";
    const placeToInsert = document.getElementById(id);
    const checkboxId = `${optionId}-checkbox`;
    let display;

    if (placeToInsert === null) {
      return null;
    }

    if (optionIsVisible === undefined || optionIsVisible) {
      display = "block";
    } else {
      display = "none";
    }
    placeToInsert.insertAdjacentHTML("beforeend", `
      <div id="${optionId}" style="display: ${display}">
        <label class="checkbox" title="${optionTitle}">
        <input id="${checkboxId}" type="checkbox">
        <span> ${optionText}</span>
        <span class="option-hint"> ${optionHint}</span></label>
      </div>
    `);
    const newOptionsCheckbox = document.getElementById(checkboxId);

    if (newOptionsCheckbox instanceof HTMLInputElement) {
      newOptionsCheckbox.checked = optionIsChecked;
      newOptionsCheckbox.onchange = (event) => {
        onOptionChanged(event);
      };
    }
    return document.getElementById(optionId);
  }

  /**
   * @returns {String[]}
   */
  static getIdsToDeleteOnReload() {
    return JSON.parse(localStorage.getItem(Utils.idsToRemoveOnReloadLocalStorageKey) || "[]");
  }

  /**
   * @param {String} postId
   */
  static setIdToBeRemovedOnReload(postId) {
    const idsToRemoveOnReload = Utils.getIdsToDeleteOnReload();

    idsToRemoveOnReload.push(postId);
    localStorage.setItem(Utils.idsToRemoveOnReloadLocalStorageKey, JSON.stringify(idsToRemoveOnReload));
  }

  static clearIdsToDeleteOnReload() {
    localStorage.removeItem(Utils.idsToRemoveOnReloadLocalStorageKey);
  }

  /**
   * @param {String} html
   * @param {String | undefined} id
   */
  static insertStyleHTML(html, id = undefined) {
    const style = document.createElement("style");

    style.textContent = html.replace("<style>", "").replace("</style>", "");

    if (id !== undefined) {
      id += "-fsg-style";
      const oldStyle = document.getElementById(id);

      if (oldStyle !== null) {
        oldStyle.remove();
      }
      style.id = id;
    }
    document.head.appendChild(style);
  }

  static insertCommonStyleHTML() {
    Utils.insertStyleHTML(HTMLStrings.utilities, "common");
    setTimeout(() => {
      if (Flags.onSearchPage) {
        Utils.removeInlineImgStyles();
      }
      Utils.configureVideoOutlines();
    }, 100);
  }

  /**
   * @param {Boolean} value
   */
  static toggleFancyImageHovering(value) {
    if (Flags.onMobileDevice || Flags.onSearchPage) {
      value = false;
    }
    Utils.insertStyleHTML(value ? Utils.styles.fancyHovering : "", "fancy-image-hovering");
  }

  static configureVideoOutlines() {
    const size = Flags.onMobileDevice ? 2 : 3;
    const videoSelector = Flags.onFavoritesPage ? "&:has(img.video)" : ">img.video";
    const gifSelector = Flags.onFavoritesPage ? "&:has(img.gif)" : ">img.gif";
    const videoRule = `${videoSelector} {outline: ${size}px solid blue}`;
    const gifRule = `${gifSelector} {outline: ${size}px solid hotpink}`;

    Utils.insertStyleHTML(`
      #favorites-search-gallery-content {
        &.row,
        &.square,
        &.column
        {
          .favorite {
            ${videoRule}
            ${gifRule}
          }
        }
      }

      #favorites-search-gallery-content.grid .favorite, .thumb {
        >a,
        >div {
          ${videoRule}

          ${gifRule}
        }
      }
      `, "video-gif-borders");
  }

  static removeInlineImgStyles() {
    for (const image of Array.from(document.getElementsByTagName("img"))) {
      image.removeAttribute("style");
    }
  }

  static setTheme() {
    Events.global.postProcess.on(() => {
      Utils.toggleDarkTheme(Utils.usingDarkTheme());
    });
  }

  static setTitle() {
    if (Flags.onFavoritesPage && Flags.onDesktopDevice) {
      document.title = "Favorites Search Gallery";
    }
  }

  /**
   * @param {Boolean} value
   */
  static toggleDarkTheme(value) {
    Utils.insertStyleHTML(value ? Utils.styles.darkTheme : "", "dark-theme");
    Utils.toggleDarkStyleSheet(value);
    const currentTheme = value ? "light-green-gradient" : "dark-green-gradient";
    const targetTheme = value ? "dark-green-gradient" : "light-green-gradient";

    for (const element of Array.from(document.querySelectorAll(`.${currentTheme}`))) {
      element.classList.remove(currentTheme);
      element.classList.add(targetTheme);
    }
    Utils.setCookie("theme", value ? "dark" : "light");
  }

  /**
   * @param {Boolean} value
   */
  static toggleDarkStyleSheet(value) {
    const platform = Flags.onMobileDevice ? "mobile" : "desktop";
    const darkSuffix = value ? "-dark" : "";

    Utils.setStyleSheet(`https://rule34.xxx//css/${platform}${darkSuffix}.css?44`);
  }

  /**
   * @param {String} url
   */
  static setStyleSheet(url) {
    const styleSheet = Utils.getMainStyleSheet();

    if (styleSheet !== null && styleSheet !== undefined) {
      styleSheet.href = url;
    }
  }

  /**
   * @returns {HTMLLinkElement}
   */
  static getMainStyleSheet() {
    return Array.from(document.querySelectorAll("link")).filter(link => link.rel === "stylesheet")[0];
  }

  /**
   * @param {String} script
   * @returns {String}
   */
  static getWorkerURL(script) {
    return URL.createObjectURL(new Blob([script], {
      type: "text/javascript"
    }));
  }

  /**
   * @param {String} url
   * @returns {HTMLLinkElement}
   */
  static createPrefetchLink(url) {
    const link = document.createElement("link");

    link.rel = "prefetch";
    link.href = url;
    return link;

  }

  /**
   * @returns {String}
   */
  static getTagBlacklist() {
    let tags = Utils.getCookie("tag_blacklist", "") || "";

    for (let i = 0; i < 3; i += 1) {
      tags = decodeURIComponent(tags).replace(/(?:^| )-/, "");
    }
    return tags;
  }

  /**
   * @param {String} word
   * @returns {String}
   */
  static capitalize(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  /**
   * @param {Number} number
   * @returns {Number}
   */
  static roundToTwoDecimalPlaces(number) {
    return Math.round((number + Number.EPSILON) * 100) / 100;
  }

  /**
   * @param {Number} n
   * @param {Number} number
   */
  static roundToNDecimalPlaces(n, number) {
    const x = 10 ** n;
    return Math.round((number + Number.EPSILON) * x) / x;
  }

  /**
   * @returns {Boolean}
   */
  static usingDarkTheme() {
    return Utils.getCookie("theme", "") === "dark";
  }

  /**
   * @param {MouseEvent} event
   * @returns {Boolean}
   */
  static enteredOverCaptionTag(event) {
    if (!(event.relatedTarget instanceof HTMLElement) || !(event.target instanceof HTMLElement)) {
      return false;
    }
    return event.relatedTarget.classList.contains("caption-tag") || event.target.classList.contains("caption-tag");
  }

  /**
   * @param {any} element
   */
  static insideOfThumb(element) {
    return element instanceof HTMLElement && element.closest(`.${Utils.itemClassName}`) !== null;
  }

  /**
   * @param {HTMLElement} thumb
   */
  static assignContentType(thumb) {
    const image = Utils.getImageFromThumb(thumb);

    if (image === null) {
      return;
    }
    const tagAttribute = image.hasAttribute("tags") ? "tags" : "title";
    const tags = image.getAttribute(tagAttribute);

    Utils.setContentType(image, Utils.getContentType(tags || ""));
  }

  /**
   * @param {HTMLImageElement} image
   * @param {String} type
   */
  static setContentType(image, type) {
    image.classList.remove("image");
    image.classList.remove("gif");
    image.classList.remove("video");
    image.classList.add(type);
  }

  /**
   * @param {String} tags
   * @returns {String}
   */
  static getContentType(tags) {
    tags += " ";
    const hasVideoTag = (/(?:^|\s)video(?:$|\s)/).test(tags);
    const hasAnimatedTag = (/(?:^|\s)animated(?:$|\s)/).test(tags);
    const isAnimated = hasAnimatedTag || hasVideoTag;
    const isAGif = hasAnimatedTag && !hasVideoTag;
    return isAGif ? "gif" : isAnimated ? "video" : "image";
  }

  /**
   * @param {String} searchQuery
   * @returns {{orGroups: String[][], remainingSearchTags: String[]}}
   */
  static extractTagGroups(searchQuery) {
    searchQuery = searchQuery.toLowerCase();
    const orRegex = /(?:^|\s+)\(\s+((?:\S+)(?:(?:\s+~\s+)\S+)*)\s+\)/g;
    const orGroups = Array.from(Utils.removeExtraWhiteSpace(searchQuery)
      .matchAll(orRegex))
      .map((orGroup) => orGroup[1].split(" ~ "));
    const remainingSearchTags = Utils.removeExtraWhiteSpace(searchQuery
      .replace(orRegex, ""))
      .split(" ")
      .filter((searchTag) => searchTag !== "");
    return {
      orGroups,
      remainingSearchTags
    };
  }

  /**
   * @param {String} string
   * @returns {String}
   */
  static removeExtraWhiteSpace(string) {
    return string.trim().replace(/\s\s+/g, " ");
  }

  /**
   * @param {String} string
   * @param {String} replacement
   * @returns {String}
   */
  static replaceLineBreaks(string, replacement = "") {
    return string.replace(/(\r\n|\n|\r)/gm, replacement);
  }

  /**
   *
   * @param {HTMLImageElement} image
   * @returns {Boolean}
   */
  static imageIsLoaded(image) {
    return image.complete || image.naturalWidth !== 0;
  }

  /**
   * @param {String} tagName
   * @returns {Promise<Boolean>}
   */
  static isOfficialTag(tagName) {
    const tagPageURL = `https://rule34.xxx/index.php?page=tags&s=list&tags=${tagName}`;
    return fetch(tagPageURL)
      .then((response) => {
        if (response.ok) {
          return response.text();
        }
        throw new Error(response.statusText);
      })
      .then((html) => {
        const dom = new DOMParser().parseFromString(html, "text/html");
        const columnOfFirstRow = dom.getElementsByClassName("highlightable")[0].getElementsByTagName("td");
        return columnOfFirstRow.length === 3;
      })
      .catch((error) => {
        console.error(error);
        return false;
      });
  }

  /**
   * @param {String} searchQuery
   */
  static openSearchPage(searchQuery) {
    window.open(`https://rule34.xxx/index.php?page=post&s=list&tags=${encodeURIComponent(searchQuery)}`);
  }

  /**
   * @param {Map<any, any>} map
   * @returns {Object}
   */
  static mapToObject(map) {
    return Array.from(map).reduce((object, [key, value]) => {
      // @ts-ignore
      object[key] = value;
      return object;
    }, {});
  }

  /**
   * @param {Object} object
   * @returns {Map<any, any>}
   */
  static objectToMap(object) {
    return new Map(Object.entries(object));
  }

  /**
   * @param {String} string
   * @returns {Boolean}
   */
  static isOnlyDigits(string) {
    return (/^\d+$/).test(string);
  }

  /**
   * @param {String} id
   * @returns {Promise<Number>}
   */
  static addFavorite(id) {
    fetch(`https://rule34.xxx/index.php?page=post&s=vote&id=${id}&type=up`);
    return fetch(`https://rule34.xxx/public/addfav.php?id=${id}`)
      .then((response) => {
        return response.text();
      })
      .then((html) => {
        return parseInt(html);
      })
      .catch(() => {
        return Utils.addedFavoriteStatuses.error;
      });
  }

  /**
   * @param {String} id
   */
  static removeFavorite(id) {
    Utils.setIdToBeRemovedOnReload(id);
    fetch(`https://rule34.xxx/index.php?page=favorites&s=delete&id=${id}`);
  }

  /**
   * @param {HTMLTextAreaElement} input
   */
  static hideAwesomplete(input) {
    const awesomplete = Utils.getAwesompleteFromInput(input);

    if (awesomplete !== null) {
      awesomplete.querySelector("ul")?.setAttribute("hidden", "");
    }
  }

  /**
   * @param {String} svg
   * @param {Number} duration
   */
  static showFullscreenIcon(svg, duration = 500) {
    const svgDocument = new DOMParser().parseFromString(svg, "image/svg+xml");
    const svgElement = svgDocument.documentElement;
    const svgOverlay = document.createElement("div");

    svgOverlay.classList.add("fullscreen-icon");
    svgOverlay.innerHTML = new XMLSerializer().serializeToString(svgElement);
    document.body.appendChild(svgOverlay);
    setTimeout(() => {
      svgOverlay.remove();
    }, duration);
  }

  /**
   * @param {String} svg
   * @returns {String}
   */
  static createObjectURLFromSvg(svg) {
    const blob = new Blob([svg], {
      type: "image/svg+xml"
    });
    return URL.createObjectURL(blob);
  }

  /**
   * @param {KeyboardEvent} event
   * @returns {Boolean}
   */
  static isHotkeyEvent(event) {
    return !event.repeat && event.target instanceof HTMLElement && !Types.isTypeableInput(event.target);
  }

  static removeUnusedScripts() {
    if (!Flags.onFavoritesPage) {
      return;
    }
    const scripts = Array.from(document.querySelectorAll("script"));

    for (const script of scripts) {
      if ((/(?:fluidplayer|awesomplete)/).test(script.src || "")) {
        script.remove();
      }
    }
  }

  /**
   * @param {String} tagString
   * @returns {Set<String>}
   */
  static convertToTagSet(tagString) {
    tagString = Utils.removeExtraWhiteSpace(tagString);

    if (tagString === "") {
      return new Set();
    }
    return new Set(tagString.split(" ").sort());
  }

  /**
   * @param {Set<String>} tagSet
   * @returns {String}
   */
  static convertToTagString(tagSet) {
    if (tagSet.size === 0) {
      return "";
    }
    return Array.from(tagSet).join(" ");
  }

  /**
   * @param {String} searchTag
   * @param {String[]} tags
   * @returns {Boolean}
   */
  static tagsMatchWildcardSearchTag(searchTag, tags) {
    try {
      const wildcardRegex = new RegExp(`^${searchTag.replace(/\*/g, ".*")}$`);
      return tags.some(tag => wildcardRegex.test(tag));
    } catch {
      return false;
    }
  }

  /**
   * @param {Number} milliseconds
   * @returns {Number}
   */
  static millisecondsToSeconds(milliseconds) {
    return Utils.roundToTwoDecimalPlaces(milliseconds / 1000);
  }

  /**
   * @returns {Set<String>}
   */
  static loadCustomTags() {
    return new Set(JSON.parse(localStorage.getItem("customTags") || "[]"));
  }

  /**
   * @param {String} tags
   */
  static async setCustomTags(tags) {
    for (const tag of Utils.removeExtraWhiteSpace(tags).split(" ")) {
      if (tag === "" || Utils.customTags.has(tag)) {
        continue;
      }
      const isAnOfficialTag = await Utils.isOfficialTag(tag);

      if (!isAnOfficialTag) {
        Utils.customTags.add(tag);
      }
    }
    localStorage.setItem("customTags", JSON.stringify(Array.from(Utils.customTags)));
  }

  /**
   * @returns {String[]}
   */
  static getSavedSearchValues() {
    return Array.from(document.getElementsByClassName("save-search-label"))
      .filter(element => element instanceof HTMLElement)
      .map(element => element.innerText);
  }

  /**
   * @param {{label: String, value: String, type: String}[]} officialTags
   * @param {String} searchQuery
   * @returns {{label: String, value: String, type: String}[]}
   */
  static addCustomTagsToAutocompleteList(officialTags, searchQuery) {
    const customTags = Array.from(Utils.customTags);
    const officialTagValues = new Set(officialTags.map(officialTag => officialTag.value));
    const mergedTags = officialTags;

    for (const customTag of customTags) {
      if (!officialTagValues.has(customTag) && customTag.startsWith(searchQuery)) {
        mergedTags.unshift({
          label: `${customTag} (custom)`,
          value: customTag,
          type: "custom"
        });
      }
    }
    return mergedTags;
  }

  /**
   * @param {String} searchTag
   * @param {String} savedSearch
   * @returns {Boolean}
   */
  static savedSearchMatchesSearchTag(searchTag, savedSearch) {
    const sanitizedSavedSearch = Utils.removeExtraWhiteSpace(savedSearch.replace(/[~())]/g, ""));
    const savedSearchTagList = sanitizedSavedSearch.split(" ");

    for (const savedSearchTag of savedSearchTagList) {
      if (savedSearchTag.startsWith(searchTag)) {
        return true;
      }
    }
    return false;
  }

  /**
   * @param {String} searchTag
   * @returns {{label: String, value: String, type: String}[]}
   */
  static getSavedSearchesForAutocompleteList(searchTag) {
    const minimumSearchTagLength = 3;

    if (searchTag.length < minimumSearchTagLength) {
      return [];
    }
    const maxMatchedSavedSearches = 5;
    const matchedSavedSearches = [];
    let i = 0;

    for (const savedSearch of Utils.getSavedSearchValues()) {
      if (Utils.savedSearchMatchesSearchTag(searchTag, savedSearch)) {
        matchedSavedSearches.push({
          label: `${savedSearch}`,
          value: `${searchTag}_saved_search ${savedSearch}`,
          type: "saved"
        });
        i += 1;
      }

      if (matchedSavedSearches.length > maxMatchedSavedSearches) {
        break;
      }
    }
    return matchedSavedSearches;
  }

  /**
   * @param {String} suggestion
   */
  static removeSavedSearchPrefix(suggestion) {
    return suggestion.replace(/^\S+_saved_search /, "");
  }

  /**
   * @param {Number} timestamp
   * @returns {String}
   */
  static convertTimestampToDate(timestamp) {
    const date = new Date(timestamp);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  }

  /**
   * @param {HTMLElement} element
   * @param {InsertPosition} position
   * @param {String} html
   */
  static insertHTMLAndExtractStyle(element, position, html) {
    const dom = new DOMParser().parseFromString(html, "text/html");
    const styles = Array.from(dom.querySelectorAll("style"));

    for (const style of styles) {
      Utils.insertStyleHTML(style.innerHTML);
      style.remove();
    }
    element.insertAdjacentHTML(position, dom.body.innerHTML);
  }

  /**
   * @param {String} str
   * @returns {String}
   */
  static removeNonNumericCharacters(str) {
    return str.replace(/\D/g, "");
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {String}
   */
  static getIdFromThumb(thumb) {
    const id = thumb.getAttribute("id");

    if (id !== null) {
      return Utils.removeNonNumericCharacters(id);
    }
    const anchor = thumb.querySelector("a");

    if (anchor !== null && anchor.hasAttribute("id")) {
      return Utils.removeNonNumericCharacters(anchor.id);
    }

    if (anchor !== null && anchor.hasAttribute("href")) {
      const match = (/id=(\d+)$/).exec(anchor.href);

      if (match !== null) {
        return match[1];
      }
    }
    const image = thumb.querySelector("img");

    if (image === null) {
      return "NA";
    }
    const match = (/\?(\d+)$/).exec(image.src);
    return match === null ? "NA" : match[1];
  }

  static deletePersistentData() {
    const desktopSuffix = Flags.onMobileDevice ? "" : " Tag modifications and saved searches will be preserved.";

    const message = `Are you sure you want to reset? This will delete all cached favorites, and preferences.${desktopSuffix}`;

    if (confirm(message)) {
      const persistentLocalStorageKeys = new Set(["customTags", "savedSearches"]);

      Object.keys(localStorage).forEach((key) => {
        if (!persistentLocalStorageKeys.has(key)) {
          localStorage.removeItem(key);
        }
      });
      indexedDB.deleteDatabase(FavoritesDatabase.databaseName);
    }
  }

  /**
   * @param {String} id
   * @returns {String}
   */
  static getPostPageURL(id) {
    return `https://rule34.xxx/index.php?page=post&s=view&id=${id}`;
  }

  /**
   * @param {String} id
   */
  static openPostInNewTab(id) {
    window.open(Utils.getPostPageURL(id), "_blank");
  }

  /**
   * @param {Function} initializer
   */
  static addStaticInitializer(initializer) {
    Utils.staticInitializers.push(initializer);
  }

  static invokeStaticInitializers() {
    for (const initializer of Utils.staticInitializers) {
      initializer();
    }
    Utils.staticInitializers = [];
  }

  /**
   * @returns {Number}
   */
  static loadAllowedRatings() {
    return Preferences.allowedRatings.value;
  }

  /**
   * @param {String} id
   * @returns {String}
   */
  static getPostAPIURL(id) {
    return `https://api.rule34.xxx//index.php?page=dapi&s=post&q=index&id=${id}`;
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {Promise<MediaExtension>}
   */
  static getImageExtensionFromThumb(thumb) {
    if (Utils.isVideo(thumb)) {
      return Promise.resolve("mp4");
    }

    if (Utils.isGif(thumb)) {
      return Promise.resolve("gif");
    }
    return Utils.getImageExtensionFromId(thumb.id);
  }

  /**
   * @param {String} id
   * @returns {Promise<MediaExtension>}
   */
  static getImageExtensionFromId(id) {
    if (Utils.extensionIsKnown(id)) {
      return Promise.resolve(Utils.getImageExtension(id));
    }
    return Utils.fetchImageExtension(id);
  }

  /**
   * @param {String} id
   * @returns {Promise<MediaExtension>}
   */
  static fetchImageExtension(id) {
    return new APIPost(id).fetch()
      .then((apiPost) => {
        Utils.assignImageExtension(id, apiPost.extension);
        return apiPost.extension;
      });
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {Promise<String>}
   */
  static async getOriginalImageURLWithExtension(thumb) {
    const extension = await Utils.getImageExtensionFromThumb(thumb);
    return Utils.getOriginalImageURL(thumb).replace(".jpg", `.${extension}`);
  }

  /**
   * @param {HTMLElement} thumb
   */
  static async openOriginalImageInNewTab(thumb) {
    try {
      const imageURL = await Utils.getOriginalImageURLWithExtension(thumb);

      window.open(imageURL);
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * @param {String} id
   * @param {String} thumbURL
   */
  static async getOriginalImageURLWithExtensionFromIdAndThumbURL(id, thumbURL) {
    const extension = await this.getImageExtensionFromId(id);
    return Utils.getOriginalImageURLFromIdAndThumbURL(id, thumbURL).replace(".jpg", `.${extension}`);
  }

  /**
   * @param {Number | undefined} desiredPageNumber
   * @returns {String}
   */
  static getSearchPageAPIURL(desiredPageNumber) {
    const postsPerPage = 42;
    const apiURL = `https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&limit=${postsPerPage}`;
    const blacklistedTags = ` ${Utils.negateTags(Utils.tagBlacklist)}`.replace(/\s-/g, "+-");
    const searchTags = (/&tags=([^&]*)/).exec(location.href);
    let pageNumber;

    if (desiredPageNumber === undefined) {
      const pageNumberMatch = (/&pid=(\d+)/).exec(location.href);

      pageNumber = pageNumberMatch === null ? 0 : Math.floor(parseInt(pageNumberMatch[1]) / postsPerPage);
    } else {
      pageNumber = desiredPageNumber;
    }
    let tags = searchTags === null ? "" : searchTags[1];

    if (tags === "all") {
      tags = "";
    }
    return `${apiURL}&tags=${tags}${blacklistedTags}&pid=${pageNumber}`;
  }

  /**
   * @param {Number | undefined} pageNumber
   * @param {Function | undefined} callback
   */
  static findImageExtensionsOnSearchPage(pageNumber = undefined, callback = undefined) {
    const searchPageAPIURL = Utils.getSearchPageAPIURL(pageNumber);
    return fetch(searchPageAPIURL)
      .then((response) => {
        if (response.ok) {
          return response.text();
        }
        return null;
      })
      .then((html) => {
        if (html === null) {
          console.error(`Failed to fetch: ${searchPageAPIURL}`);
        }
        const dom = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
        const posts = Array.from(dom.getElementsByTagName("post"));

        for (const post of posts) {
          const tags = post.getAttribute("tags");
          const id = post.getAttribute("id");
          const originalImageURL = post.getAttribute("file_url");

          if (id === null || tags === null || originalImageURL === null) {
            return;
          }
          const tagSet = Utils.convertToTagSet(tags);
          const thumb = document.getElementById(id);

          if (thumb === null) {
            return;
          }
          const image = Utils.getImageFromThumb(thumb);

          if (image === null) {
            return;
          }

          if (!tagSet.has("video") && originalImageURL.endsWith("mp4") && thumb !== null) {

            image.setAttribute("tags", `${image.getAttribute("tags")} video`);
            Utils.setContentType(image, "video");
          } else if (!tagSet.has("gif") && originalImageURL.endsWith("gif") && thumb !== null) {

            image.setAttribute("tags", `${image.getAttribute("tags")} gif`);
            Utils.setContentType(image, "gif");
          }
          const isAnImage = Utils.getContentType(tags) === "image";
          const isBlacklisted = originalImageURL === "https://api-cdn.rule34.xxx/images//";

          if (!isAnImage || isBlacklisted) {
            continue;
          }
          const extension = Utils.getExtensionFromImageURL(originalImageURL);

          Utils.assignImageExtension(id, extension);
        }

        if (callback !== undefined) {

          callback(html);
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }

  static async setupOriginalImageLinksOnSearchPage() {
    if (!Flags.onSearchPage) {
      return;
    }

    if (Flags.galleryDisabled) {
      Utils.setupOriginalImageLinksOnSearchPageHelper();
      await Utils.findImageExtensionsOnSearchPage();
    } else {
      window.addEventListener("foundExtensionsOnSearchPage", () => {
        Utils.setupOriginalImageLinksOnSearchPageHelper();
      }, {
        once: true
      });
    }
  }

  static async setupOriginalImageLinksOnSearchPageHelper() {
    try {
      for (const thumb of Utils.getAllThumbs()) {
        await Utils.setupOriginalImageLinkOnSearchPage(thumb);
      }
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * @param {HTMLElement} thumb
   */
  static async setupOriginalImageLinkOnSearchPage(thumb) {
    const anchor = thumb.querySelector("a");

    if (anchor === null) {
      return;
    }
    const imageURL = await Utils.getOriginalImageURLWithExtension(thumb);
    const thumbURL = anchor.href;

    anchor.href = imageURL;
    anchor.onclick = (event) => {
      if (!event.ctrlKey) {
        event.preventDefault();
      }
    };
    anchor.onmousedown = (event) => {
      if (event.ctrlKey) {
        return;
      }
      event.preventDefault();
      const middleClick = event.button === Utils.clickCodes.middle;
      const leftClick = event.button === Utils.clickCodes.left;
      const shiftClick = leftClick && event.shiftKey;

      if (leftClick && Flags.galleryDisabled) {
        document.location = thumbURL;
      } else if (middleClick || shiftClick) {
        window.open(thumbURL);
      }
    };
  }

  static initializeSearchPage() {
    if (!Flags.onSearchPage) {
      return;
    }
    Utils.prepareSearchPageThumbs(Utils.getAllThumbs());
  }

  /**
   * @param {HTMLElement[]} thumbs
   */
  static prepareSearchPageThumbs(thumbs) {
    for (const thumb of thumbs) {
      Utils.prepareSearchPageThumb(thumb);
    }
  }

  /**
   * @param {HTMLElement} thumb
   */
  static prepareSearchPageThumb(thumb) {
    const image = Utils.getImageFromThumb(thumb);

    if (image !== null) {
      Utils.removeTitleFromImage(image);
    }
    Utils.assignContentType(thumb);
    thumb.id = Utils.removeNonNumericCharacters(Utils.getIdFromThumb(thumb));
  }

  /**
   * @returns {Record<String, Number>}
   */
  static loadDiscoveredImageExtensions() {
    return JSON.parse(localStorage.getItem(Utils.localStorageKeys.imageExtensions) || "{}");
  }

  /**
   * @param {String | Number} id
   * @returns {MediaExtension}
   */
  static getImageExtension(id) {
    return Utils.extensionDecodings[Utils.imageExtensions[Number(id)]];
  }

  /**
   * @param {String | Number} id
   * @param {MediaExtension} extension
   */
  static setImageExtension(id, extension) {
    Utils.imageExtensions[String(id)] = Utils.extensionEncodings[extension];
  }

  /**
   * @param {String} id
   * @returns {Boolean}
   */
  static extensionIsKnown(id) {
    return Utils.getImageExtension(id) !== undefined;
  }

  static updateStoredImageExtensions() {
    Utils.recentlyDiscoveredImageExtensionCount += 1;

    if (Utils.recentlyDiscoveredImageExtensionCount >= Utils.settings.extensionsFoundBeforeSavingCount) {
      Utils.storeAllImageExtensions();
    }
  }

  static storeAllImageExtensions() {
    if (!Flags.onFavoritesPage) {
      return;
    }
    Utils.recentlyDiscoveredImageExtensionCount = 0;
    localStorage.setItem(Utils.localStorageKeys.imageExtensions, JSON.stringify(Utils.imageExtensions));
  }

  /**
   * @param {String} id
   * @param {MediaExtension} extension
   */
  static assignImageExtension(id, extension) {
    if (Utils.extensionIsKnown(id) || extension === "mp4" || extension === "gif") {
      return;
    }
    Utils.imageExtensionAssignmentCooldown.restart();
    Utils.setImageExtension(id, extension);
    Utils.updateStoredImageExtensions();
  }

  static initializeImageExtensionAssignmentCooldown() {
    Utils.imageExtensionAssignmentCooldown = new Cooldown(1000);
    Utils.imageExtensionAssignmentCooldown.onCooldownEnd = () => {
      if (Utils.recentlyDiscoveredImageExtensionCount > 0) {
        Utils.storeAllImageExtensions();
      }
    };
  }

  /**
   * @param {Post[]} thumbs
   * @returns {String[]}
   */
  static getIdsWithUnknownExtensions(thumbs) {
    return thumbs
      .filter(thumb => Utils.isImage(thumb) && !Utils.extensionIsKnown(thumb.id))
      .map(thumb => thumb.id);
  }

  /**
   * @returns {Boolean}
   */
  static usingIOS() {
    return (/iPhone|iPad|iPod/).test(navigator.userAgent);
  }

  /**
   * @param {String} string
   * @returns {Boolean}
   */
  static isEmptyString(string) {
    return string.trim() === "";
  }

  /**
   * @param {String} str
   * @returns {String}
   */
  static escapeParenthesis(str) {
    return str.replace(/([()])/g, "\\$&");
  }

  /**
   * @returns {Promise<Number | null>}
   */
  static getExpectedFavoritesCount() {
    const profileURL = `https://rule34.xxx/index.php?page=account&s=profile&id=${Utils.getFavoritesPageId()}`;
    return fetch(profileURL)
      .then((response) => {
        if (response.ok) {
          return response.text();
        }
        throw new Error(String(response.status));
      })
      .then((html) => {
        const favoritesURL = Array.from(new DOMParser().parseFromString(html, "text/html").querySelectorAll("a"))
          .find(a => a.href.includes("page=favorites&s=view"));

        if (favoritesURL === undefined || favoritesURL.textContent === null) {
          return 0;
        }
        return parseInt(favoritesURL.textContent);
      })
      .catch(() => {
        console.error(`Could not find total favorites count from ${profileURL}, are you logged in?`);
        return null;
      });
  }

  /**
   * @param {String} name
   * @param {Object} detail
   */
  static broadcastEvent(name, detail = {}) {
    dispatchEvent(new CustomEvent(name, {
      detail
    }));
  }

  /**
   * @param {String} string
   */
  static convertDashedToCamelCase(string) {
    return string.replace(/-([a-z])/g, (match) => match[1].toUpperCase());
  }

  /**
   * @param {String} searchQuery
   * @returns {String}
   */
  static formatSearchQueryIds(searchQuery) {
    return searchQuery.replace(/(?:^|\s)(\d+)(?:$|\s)/g, " id:$1 ");
  }

  /**
   * @param {String} value
   */
  static setMainSearchBoxValue(value) {
    const searchBox = document.getElementById(Utils.mainSearchBoxId);

    if (searchBox !== null && (searchBox instanceof HTMLInputElement || searchBox instanceof HTMLTextAreaElement)) {
      searchBox.value = value;
      searchBox.dispatchEvent(new CustomEvent("updatedProgrammatically"));
    }
  }

  /**
   * @returns {String}
   */
  static getMainSearchBoxValue() {
    const searchBox = document.getElementById(Utils.mainSearchBoxId);

    if (searchBox !== null && (searchBox instanceof HTMLInputElement || searchBox instanceof HTMLTextAreaElement)) {
      return searchBox.value;
    }
    return "";
  }

  static focusMainSearchBox() {
    const searchBox = document.getElementById(Utils.mainSearchBoxId);

    if (searchBox !== null) {
      searchBox.focus();
    }
  }

  /**
   * @param {HTMLElement | EventTarget} element
   * @param {String} tagName
   * @returns {Boolean}
   */
  static hasTagName(element, tagName) {
    return element instanceof HTMLElement && element.tagName !== undefined && element.tagName.toLowerCase() === tagName;
  }

  static scrollToTop() {
    window.scrollTo(0, Flags.onMobileDevice ? 10 : 0);
  }

  /**
   * @param {Number} value
   * @param {Number} fromMin
   * @param {Number} fromMax
   * @param {Number} toMin
   * @param {Number} toMax
   * @returns
   */
  static mapRange(value, fromMin, fromMax, toMin, toMax) {
    return Math.round(toMin + (((value - fromMin) / (fromMax - fromMin)) * (toMax - toMin)));
  }

  /**
   * @param {any[]} array
   * @param {Number} index
   * @returns {Boolean}
   */
  static indexInBounds(array, index) {
    return index >= 0 && index < array.length;
  }

  /**
   * @param {any[]} array
   * @param {Number} startIndex
   * @param {Number} limit
   * @returns
   */
  static getElementsAroundIndex(array, startIndex, limit) {
    if (!Utils.indexInBounds(array, startIndex) || limit === 0) {
      return [];
    }
    const result = [array[startIndex]];
    let i = 1;

    while (result.length < limit) {
      const leftIndex = startIndex - i;
      const rightIndex = startIndex + i;
      const leftIndexInBounds = Utils.indexInBounds(array, leftIndex);
      const rightIndexInBounds = Utils.indexInBounds(array, rightIndex);
      const bothIndexesOutOfBounds = !leftIndexInBounds && !rightIndexInBounds;

      if (bothIndexesOutOfBounds) {
        break;
      }

      if (leftIndexInBounds) {
        result.push(array[leftIndex]);
      }

      if (rightIndexInBounds && result.length < limit) {
        result.push(array[rightIndex]);
      }
      i += 1;
    }
    return result;
  }

  /**
   * @param {any[]} array
   * @param {Number} startIndex
   * @param {Number} limit
   * @returns
   */
  static getWrappedElementsAroundIndex(array, startIndex, limit) {
    if (!Utils.indexInBounds(array, startIndex) || limit === 0) {
      return [];
    }
    const result = [array[startIndex]];
    let i = 1;

    while (result.length < limit && result.length < array.length) {
      const leftIndex = (startIndex - i + array.length) % array.length;
      const rightIndex = (startIndex + i) % array.length;

      result.push(array[leftIndex]);

      if (result.length < limit && result.length < array.length) {
        result.push(array[rightIndex]);
      }

      i += 1;
    }
    return result;
  }

  /**
   * @param {any} templates
   */
  static createDynamicElements(templates) {
    for (const [elementType, elements] of Object.entries(templates)) {
      for (const element of elements.reverse()) {
        if (element.enabled !== false) {
          const template = new ElementTemplate(element);
          const functionName = `create${Utils.capitalize(elementType)}`;

          // @ts-ignore
          if (ElementFactory[functionName] !== undefined) {
            // @ts-ignore
            ElementFactory[functionName](template);
          }
        }
      }
    }
  }

  /**
   * @param {HTMLElement} element
   * @returns {Boolean}
   */
  static elementIsInView(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  /**
   * @param {Worker} worker
   * @param {Object} message
   * @returns {Promise<any>}
   */
  static sendPostedMessage(worker, message) {
    return new Promise((resolve) => {
      const id = Date.now() + Math.random();
      const handleMessage = (/** @type {{ data: { id: number; response: any; }; }} */ event) => {
        if (event.data.id === id) {
          worker.removeEventListener("message", handleMessage);
          resolve(event.data.response);
        }
      };

      worker.addEventListener("message", handleMessage);
      worker.postMessage({
        ...message,
        id
      });
    });
  }

  /**
   * @param {Function} func
   * @param {Number} delay
   * @returns {any}
   */
  static debounceAfterFirstCall(func, delay) {
    /** @type {Timeout} */
    let timeoutId;
    let firstCall = true;
    let calledDuringDebounce = false;
    return (/** @type {any} */ ...args) => {
      if (firstCall) {
        Reflect.apply(func, this, args);
        firstCall = false;
      } else {
        calledDuringDebounce = true;
      }

      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (calledDuringDebounce) {
          Reflect.apply(func, this, args);
          calledDuringDebounce = false;
        }
        firstCall = true;
      }, delay);
    };
  }

  /**
   * @param {Function} func
   * @param {Number} delay
   * @returns {any}
   */
  static debounceAlways(func, delay) {
    /** @type {Timeout} */
    let timeoutId;
    return (/** @type {any} */ ...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        Reflect.apply(func, this, args);
      }, delay);
    };
  }

  /**
   * @param {Function} func
   * @param {Number} delay
   * @returns {any}
   */
  static throttle(func, delay) {
    let throttling = false;
    return (/** @type {any} */ ...args) => {
      if (!throttling) {
        func(...args);
        throttling = true;
        setTimeout(() => {
          throttling = false;
        }, delay);
      }
    };
  }

  /**
   * @param {Number} margin
   */
  static updateOptionContentMargin(margin) {
    const menu = document.getElementById("favorites-search-gallery-menu");

    if (menu === null) {
      return;
    }
    margin = margin === undefined ? menu.getBoundingClientRect().height + 11 : margin;
    Utils.insertStyleHTML(`
        #favorites-search-gallery-content {
            margin-top: ${margin}px;
        }`, "options-content-margin");
  }

  /**
   * @param {String} compressedSource
   * @param {String} id
   * @returns {String}
   */
  static decompressThumbnailSource(compressedSource, id) {
    const splitSource = compressedSource.split("_");
    return `https://us.rule34.xxx/thumbnails//${splitSource[0]}/thumbnail_${splitSource[1]}.jpg?${id}`;
  }

  /**
   * @param {String} source
   * @returns {String}
   */
  static compressThumbSource(source) {
    const match = source.match(Utils.thumbnailSourceCompressionRegex);
    return match === null ? "" : match.splice(1).join("_");
  }

  /**
   * @param {String} source
   * @param {String} id
   * @returns {String}
   */
  static cleanThumbnailSource(source, id) {
    return Utils.decompressThumbnailSource(Utils.compressThumbSource(source), id);
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {String}
   */
  static getGIFSource(thumb) {
    const tags = Utils.getTagsFromThumb(thumb);
    const extension = tags.has("animated_png") ? "png" : "gif";
    return Utils.getOriginalImageURLFromThumb(thumb).replace("jpg", extension);
  }

  /**
   * @param {MouseEvent} mouseEvent
   * @returns {HTMLElement | null}
   */
  static getThumbUnderCursor(mouseEvent) {
    if (!(mouseEvent.target instanceof HTMLElement) || mouseEvent.target.matches(".caption-tag")) {
      return null;
    }
    const imageSelector = Flags.onSearchPage ? ".thumb img" : ".favorite img:first-child";
    const image = mouseEvent.target.matches(imageSelector) ? mouseEvent.target : null;
    const thumb = image === null ? null : Utils.getThumbFromImage(image);
    return thumb;
  }

  /**
   * @param {DOMRectReadOnly} rect1
   * @param {DOMRectReadOnly} rect2
   * @returns {Number}
   */
  static getDistance(rect1, rect2) {
    const x1 = rect1.left + (rect1.width / 2);
    const y1 = rect1.top + (rect1.height / 2);
    const x2 = rect2.left + (rect2.width / 2);
    const y2 = rect2.top + (rect2.height / 2);
    return Math.sqrt(((x2 - x1) ** 2) + ((y2 - y1) ** 2));
  }

  /**
   * @param {DOMRectReadOnly} rect1
   * @param {DOMRectReadOnly} rect2
   * @returns {Number}
   */
  static getDistanceByYThenX(rect1, rect2) {
    const y1 = rect1.top + (rect1.height / 2);
    const y2 = rect2.top + (rect2.height / 2);

    if (y1 !== y2) {
      return Math.abs(y1 - y2) + 10000;
    }
    const x1 = rect1.left + (rect1.width / 2);
    const x2 = rect2.left + (rect2.width / 2);
    return Math.abs(x1 - x2);
  }

  /**
   * @param {CanvasRenderingContext2D | null} context
   * @param {ImageBitmap} imageBitmap
   */
  static drawCanvas(context, imageBitmap) {
    if (context === null) {
      return;
    }
    const canvas = context.canvas;
    const ratio = Math.min(canvas.width / imageBitmap.width, canvas.height / imageBitmap.height);
    const centerShiftX = (canvas.width - (imageBitmap.width * ratio)) / 2;
    const centerShiftY = (canvas.height - (imageBitmap.height * ratio)) / 2;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(
      imageBitmap, 0, 0, imageBitmap.width, imageBitmap.height,
      centerShiftX, centerShiftY, imageBitmap.width * ratio, imageBitmap.height * ratio
    );
  }

  /**
   * @param {String | undefined} dimensionString
   * @returns {{x: Number, y: Number}}
   */
  static getDimensions(dimensionString) {
    if (dimensionString === undefined) {
      return {
        x: 100,
        y: 100
      };
    }
    const match = dimensionString.match(/^(\d+)x(\d+)$/);
    const [x, y] = match ? [parseInt(match[1]), parseInt(match[2])] : [0, 0];
    return {
      x,
      y
    };
  }

  /**
   * @returns {Promise<any>}
   */
  static waitForAllThumbnailsToLoad() {
    const unloadedImages = Utils.getAllThumbs()
      .map(thumb => Utils.getImageFromThumb(thumb))
      .filter(image => image instanceof HTMLImageElement)
      .filter(image => !Utils.imageIsLoaded(image));
    return Promise.all(unloadedImages
      .map(image => new Promise(resolve => {
        image.addEventListener("load", resolve, {
          once: true
        });
        image.addEventListener("error", resolve, {
          once: true
        });
      })));
  }

  /**
   * @returns {FavoriteLayout}
   */
  static loadFavoritesLayout() {
    const layout = Preferences.layout.value;
    return Types.isFavoritesLayout(layout) ? layout : "column";
  }

  /**
   * @param {HTMLElement | undefined} thumb
   * @returns {Promise<{status: Number, id: String}>}
   */
  static addFavoriteInGallery(thumb) {
    if (thumb === undefined) {
      return Promise.resolve({
        status: Utils.addedFavoriteStatuses.error,
        id: ""
      });
    }
    return Utils.addFavorite(thumb.id)
      .then((status) => {
        return {
          status,
          id: thumb === undefined ? "" : thumb.id
        };
      });
  }

  /**
   * @param {HTMLElement | undefined} thumb
   * @returns {Promise<{status: Number, id: String}>}
   */
  static removeFavoriteInGallery(thumb) {
    const status = {
      status: Utils.removedFavoriteStatuses.error,
      id: ""
    };

    if (thumb === undefined) {
      return Promise.resolve(status);
    }
    const removeFavoriteButton = thumb.querySelector(".remove-favorite-button");
    const showRemoveFavoriteCheckbox = document.getElementById("show-remove-favorite-buttons");

    if (removeFavoriteButton === null || showRemoveFavoriteCheckbox === null) {
      return Promise.resolve(status);
    }
    const allowedToRemoveFavorites = (showRemoveFavoriteCheckbox instanceof HTMLInputElement) && showRemoveFavoriteCheckbox.checked;

    if (!allowedToRemoveFavorites) {
      status.status = Utils.removedFavoriteStatuses.removeNotAllowed;
      return Promise.resolve(status);
    }
    status.status = Utils.removedFavoriteStatuses.success;
    status.id = thumb.id;
    Utils.removeFavorite(thumb.id);
    return Promise.resolve(status);
  }

  /**
   * @param {Number[]} numbers
   * @returns {Number}
   */
  static sum(numbers) {
    return numbers.reduce((partialSum, newAddend) => partialSum + newAddend, 0);
  }

  /**
   * @param {Number[]} numbers
   * @returns {Number}
   */
  static average(numbers) {
    return numbers.length === 0 ? 0 : Utils.sum(numbers) / numbers.length;
  }

  /**
   * @returns {Boolean}
   */
  static inFullscreen() {
    return document.fullscreenElement !== null;
  }

  static toggleFullscreen() {
    const html = document.documentElement;
    const toggleFullScreenHelper = () => {
      if (Utils.inFullscreen()) {
        document.exitFullscreen();
      } else {
        html.requestFullscreen();
      }
    };

    toggleFullScreenHelper();

    // html.className = "";
    // html.addEventListener("transitionend", async() => {
    //   await Utils.sleep(200);
    //   toggleFullScreenHelper();
    //   await Utils.sleep(100);
    //   html.classList.add(Utils.transitionDisableClassName);
    //   await Utils.sleep(5);
    //   html.classList.remove(Utils.fullscreenEffectClassName);
    //   await Utils.sleep(5);
    //   html.classList.remove(Utils.transitionDisableClassName);
    // }, {
    //   once: true
    // });
    // html.classList.add(Utils.fullscreenEffectClassName);
  }

  /**
   * @param {MouseEvent} event
   * @returns {Boolean}
   */
  static overGalleryMenu(event) {
    if (!(event.target instanceof HTMLElement)) {
      return false;
    }
    return event.target.classList.contains(".gallery-sub-menu") || event.target.closest(".gallery-sub-menu") !== null;
  }

  /**
   * @template T
   * @param {Promise<T>} promise
   * @param {number} milliseconds
   * @returns {Promise<T>}
   */
  static withTimeout(promise, milliseconds) {
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new PromiseTimeoutError()), milliseconds));
    return Promise.race([promise, timeout]);
  }

  /**
   * @param {Boolean} value
   */
  static toggleGalleryMenu(value) {
    Utils.insertStyleHTML(`
        #gallery-menu {
          visibility: ${value ? "visible" : "hidden"} !important;
        }`, "enable-gallery-menu");
  }

  /**
   * @returns {Promise<Boolean>}
   */
  static inGallery() {
    if (Flags.galleryDisabled) {
      return Promise.resolve(false);
    }
    return new Promise((resolve) => {
      Events.gallery.inGalleryResponse.timeout(10)
        .then((inGallery) => {
          resolve(inGallery);
        })
        .catch(() => {
          resolve(false);
        });
      Events.favorites.inGalleryRequest.emit();
    });
  }

  /**
   * @param {Post[]} posts;
   * @returns {HTMLElement[]}
   */
  static getThumbsFromPosts(posts) {
    return posts.map((post) => {
      post.activateHTMLElement();
      return post.root;
    });
  }

  /**
   * @param {HTMLElement | null} thumb
   * @returns {Promise<String>}
   */
  static getMedianHexColor(thumb) {
    const defaultColor = Promise.resolve("white");
    const useCleanOrigin = true;

    if (thumb === null) {
      return defaultColor;
    }
    const image = Utils.getImageFromThumb(thumb);

    if (image === null) {
      return defaultColor;
    }
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (context === null) {
      return defaultColor;
    }
    const getMedianHexColor = (/** @type {HTMLImageElement} */ img) => {
      canvas.width = img.width;
      canvas.height = img.height;
      context.drawImage(img, 0, 0);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = [];

      for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        // eslint-disable-next-line no-bitwise
        const hex = `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1).toUpperCase()}`;

        pixels.push(hex);
      }
      pixels.sort();
      const medianIndex = Math.floor(pixels.length / 2);
      return pixels[medianIndex];
    };

    if (useCleanOrigin) {
      return Utils.getCleanOriginThumbImage(image).then(getMedianHexColor);
    }
    image.crossOrigin = "Anonymous";
    return Promise.resolve(getMedianHexColor(image));
  }

  /**
   * @param {HTMLImageElement} image
   * @returns {Promise<HTMLImageElement>}
   */
  static getCleanOriginThumbImage(image) {
    return Utils.loadImage(image.src.replace("us.", ""));
  }

  /**
   * @param {String} color
   */
  static setColorScheme(color) {
    Utils.setGalleryBackgroundColor(color);
    Preferences.colorScheme.set(color);
    // Utils.setGradient(color);
  }

  /**
   * @param {String} color
   */
  static setGalleryBackgroundColor(color) {
    Utils.insertStyleHTML(`
        #gallery-background,
        #gallery-menu,
        #gallery-menu-button-container,
        #autoplay-menu,
        #autoplay-settings-menu {
          background: ${color} !important;
        }

        .gallery-menu-button:not(:hover) {
          >svg {
              fill: ${color} !important;
              filter: invert(100%);
            }
        }


      `, "gallery-background-color");
  }

  /**
   * @param {String} color
   */
  static setGradient(color) {
    const isHex = (/^#[0-9A-Fa-f]{6}$/).test(color);
    const hexColor = isHex ? color : Utils.getHexColor(color);
    const gradient = Utils.createGradient(hexColor);

    Utils.insertStyleHTML(`
        .light-green-gradient, .dark-green-gradient {
          background: linear-gradient(to bottom, ${gradient.light}, ${gradient.dark}) !important;
        }

        body {
          background: ${gradient.light} !important;
        }
      `, "gradient-background");
  }

  /**
   * @param {String} hexColor
   * @returns {{light: String, dark: String}}
   */
  static createGradient(hexColor) {
    hexColor = hexColor.substring(1);
    const colorValue = parseInt(hexColor, 16);
    return {
      light: Utils.getHexString(colorValue),
      dark: Utils.getHexString(Utils.darkenColor(colorValue, 20))
    };
  }

  /**
   *
   * @param {Number} hexNumber
   * @returns {String}
   */
  static getHexString(hexNumber) {
    return `#${hexNumber.toString(16).padStart(6, "0")}`;
  }

  /**
   * @param {String} color
   * @returns {String}
   */
  static getHexColor(color) {
    const element = document.createElement("div");

    element.style.color = color;
    document.body.appendChild(element);
    const computedColor = window.getComputedStyle(element).color;

    document.body.removeChild(element);

    const rgbValues = computedColor.match(/\d+/g);
    // @ts-ignore
    const r = parseInt(rgbValues[0]);
    // @ts-ignore
    const g = parseInt(rgbValues[1]);
    // @ts-ignore
    const b = parseInt(rgbValues[2]);
    // eslint-disable-next-line no-bitwise
    return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1).toUpperCase()}`;
  }

  /**
   * @param {Number} hex
   * @param {Number} percent
   * @returns {Number}
   */
  static darkenColor(hex, percent) {
    // eslint-disable-next-line no-bitwise
    let r = (hex >> 16) & 0xFF;
    // eslint-disable-next-line no-bitwise
    let g = (hex >> 8) & 0xFF;
    // eslint-disable-next-line no-bitwise
    let b = hex & 0xFF;

    r = Math.max(0, r - (r * percent / 100));
    g = Math.max(0, g - (g * percent / 100));
    b = Math.max(0, b - (b * percent / 100));
    // eslint-disable-next-line no-bitwise
    return (r << 16) | (g << 8) | b;
  }

  /**
   * @param {String} hex
   */
  static brightenColor(hex) {
    hex = hex.substring(1);
    const percent = 26;
    let r = parseInt(hex.slice(0, 2), 16);
    let g = parseInt(hex.slice(2, 4), 16);
    let b = parseInt(hex.slice(4, 6), 16);

    r = Math.min(255, Math.floor(r + ((percent / 100) * (255 - r))));
    g = Math.min(255, Math.floor(g + ((percent / 100) * (255 - g))));
    b = Math.min(255, Math.floor(b + ((percent / 100) * (255 - b))));
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }

  /**
   * @param {String} source
   * @returns {Promise<HTMLImageElement>}
   */
  static loadImage(source) {
    const image = new Image();

    image.src = source;
    return new Promise((resolve, reject) => {
      image.onload = () => resolve(image);
      image.onerror = (error) => reject(error);
    });
  }

  /**
   * @template V
   * @param {V[]} array
   * @param {Number} chunkSize
   * @returns {V[][]}
   */
  static splitIntoChunks(array, chunkSize) {
    const result = [];

    for (let i = 0; i < array.length; i += chunkSize) {
      result.push(array.slice(i, i + chunkSize));
    }
    return result;
  }

  /**
   * @returns {Promise<void>}
   */
  static yield() {
    return Utils.sleep(0);
  }
}
