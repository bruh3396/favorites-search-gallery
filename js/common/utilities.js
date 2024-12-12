class Utils {
  static utilitiesHTML = `
<style>
  .light-green-gradient {
    background: linear-gradient(to bottom, #aae5a4, #89e180);
    color: black;
  }

  .dark-green-gradient {
    background: linear-gradient(to bottom, #5e715e, #293129);
    color: white;
  }

  img {
    border: none !important;
  }

  .not-highlightable {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  input[type=number] {
    border: 1px solid #767676;
    border-radius: 2px;
  }

  .size-calculation-div {
    position: absolute !important;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    visibility: hidden;
    transition: none !important;
    transform: scale(1.05, 1.05);
  }

  .number {
    white-space: nowrap;
    position: relative;
    margin-top: 5px;
    border: 1px solid;
    padding: 0;
    border-radius: 20px;
    background-color: white;

    >hold-button,
    button {
      position: relative;
      top: 0;
      left: 0;
      font-size: inherit;
      outline: none;
      background: none;
      cursor: pointer;
      border: none;
      margin: 0px 8px;
      padding: 0;

      &::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 200%;
        height: 100%;
        /* outline: 1px solid greenyellow; */
        /* background-color: hotpink; */
      }

      &:hover {
        >span {
          color: #0075FF;
        }

      }

      >span {
        font-weight: bold;
        font-family: Verdana, Geneva, Tahoma, sans-serif;
        position: relative;
        pointer-events: none;
        border: none;
        outline: none;
        top: 0;
        z-index: 5;
        font-size: 1.2em !important;
      }

      &.number-arrow-up {
        >span {
          transition: left .1s ease;
          left: 0;
        }

        &:hover>span {
          left: 3px;
        }
      }

      &.number-arrow-down {
        >span {
          transition: right .1s ease;
          right: 0;
        }

        &:hover>span {
          right: 3px;
        }
      }
    }

    >input[type="number"] {
      font-size: inherit;
      text-align: center;
      width: 2ch;
      padding: 0;
      margin: 0;
      font-weight: bold;
      padding: 3px;
      background: none;
      border: none;

      &:focus {
        outline: none;
      }
    }

    >input[type="number"]::-webkit-outer-spin-button,
    >input[type="number"]::-webkit-inner-spin-button {
      -webkit-appearance: none;
      appearance: none;
      margin: 0;
    }
  }

  .fullscreen-icon {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10010;
    pointer-events: none;
    width: 30vw;
  }

  input[type="checkbox"] {
    accent-color: #0075FF;
  }

  .thumb {
    >a {
      pointer-events: none;

      >img {
        pointer-events: all;
      }
    }
  }
</style>
`;
  static favoritesSearchGalleryContainer = Utils.createFavoritesSearchGalleryContainer();
  static idsToRemoveOnReloadLocalStorageKey = "recentlyRemovedIds";
  static tagBlacklist = Utils.getTagBlacklist();
  static preferencesLocalStorageKey = "preferences";
  static flags = {
    set: false,
    onSearchPage: {
      set: false,
      value: undefined
    },
    onFavoritesPage: {
      set: false,
      value: undefined
    },
    onPostPage: {
      set: false,
      value: undefined
    },
    usingFirefox: {
      set: false,
      value: undefined
    },
    onMobileDevice: {
      set: false,
      value: undefined
    },
    userIsOnTheirOwnFavoritesPage: {
      set: false,
      value: undefined
    },
    galleryEnabled: {
      set: false,
      value: undefined
    }
  };
  static icons = {
    delete: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"feather feather-trash\"><polyline points=\"3 6 5 6 21 6\"></polyline><path d=\"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2\"></path></svg>",
    edit: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"feather feather-edit\"><path d=\"M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7\"></path><path d=\"M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z\"></path></svg>",
    upArrow: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"feather feather-arrow-up\"><line x1=\"12\" y1=\"19\" x2=\"12\" y2=\"5\"></line><polyline points=\"5 12 12 5 19 12\"></polyline></svg>",
    heartPlus: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 -960 960 960\" fill=\"#FF69B4\"><path d=\"M440-501Zm0 381L313-234q-72-65-123.5-116t-85-96q-33.5-45-49-87T40-621q0-94 63-156.5T260-840q52 0 99 22t81 62q34-40 81-62t99-22q81 0 136 45.5T831-680h-85q-18-40-53-60t-73-20q-51 0-88 27.5T463-660h-46q-31-45-70.5-72.5T260-760q-57 0-98.5 39.5T120-621q0 33 14 67t50 78.5q36 44.5 98 104T440-228q26-23 61-53t56-50l9 9 19.5 19.5L605-283l9 9q-22 20-56 49.5T498-172l-58 52Zm280-160v-120H600v-80h120v-120h80v120h120v80H800v120h-80Z\"/></svg>",
    heartMinus: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 -960 960 960\" fill=\"#FF0000\"><path d=\"M440-501Zm0 381L313-234q-72-65-123.5-116t-85-96q-33.5-45-49-87T40-621q0-94 63-156.5T260-840q52 0 99 22t81 62q34-40 81-62t99-22q84 0 153 59t69 160q0 14-2 29.5t-6 31.5h-85q5-18 8-34t3-30q0-75-50-105.5T620-760q-51 0-88 27.5T463-660h-46q-31-45-70.5-72.5T260-760q-57 0-98.5 39.5T120-621q0 33 14 67t50 78.5q36 44.5 98 104T440-228q26-23 61-53t56-50l9 9 19.5 19.5L605-283l9 9q-22 20-56 49.5T498-172l-58 52Zm160-280v-80h320v80H600Z\"/></svg>",
    heartCheck: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 -960 960 960\" fill=\"#51b330\"><path d=\"M718-313 604-426l57-56 57 56 141-141 57 56-198 198ZM440-501Zm0 381L313-234q-72-65-123.5-116t-85-96q-33.5-45-49-87T40-621q0-94 63-156.5T260-840q52 0 99 22t81 62q34-40 81-62t99-22q81 0 136 45.5T831-680h-85q-18-40-53-60t-73-20q-51 0-88 27.5T463-660h-46q-31-45-70.5-72.5T260-760q-57 0-98.5 39.5T120-621q0 33 14 67t50 78.5q36 44.5 98 104T440-228q26-23 61-53t56-50l9 9 19.5 19.5L605-283l9 9q-22 20-56 49.5T498-172l-58 52Z\"/></svg>",
    error: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 -960 960 960\" fill=\"#FF0000\"><path d=\"M480-280q17 0 28.5-11.5T520-320q0-17-11.5-28.5T480-360q-17 0-28.5 11.5T440-320q0 17 11.5 28.5T480-280Zm-40-160h80v-240h-80v240Zm40 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z\"/></svg>",
    warning: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 -960 960 960\" fill=\"#DAB600\"><path d=\"m40-120 440-760 440 760H40Zm138-80h604L480-720 178-200Zm302-40q17 0 28.5-11.5T520-280q0-17-11.5-28.5T480-320q-17 0-28.5 11.5T440-280q0 17 11.5 28.5T480-240Zm-40-120h80v-200h-80v200Zm40-100Z\"/></svg>",
    empty: "<button>123</button>",
    play: "<svg id=\"autoplay-play-button\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 -960 960 960\" fill=\"white\"><path d=\"M320-200v-560l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z\" /></svg>",
    pause: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 -960 960 960\" fill=\"white\"><path d=\"M520-200v-560h240v560H520Zm-320 0v-560h240v560H200Zm400-80h80v-400h-80v400Zm-320 0h80v-400h-80v400Zm0-400v400-400Zm320 0v400-400Z\"/></svg>",
    changeDirection: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 -960 960 960\" fill=\"white\"><path d=\"M280-160 80-360l200-200 56 57-103 103h287v80H233l103 103-56 57Zm400-240-56-57 103-103H440v-80h287L624-743l56-57 200 200-200 200Z\"/></svg>",
    changeDirectionAlt: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 -960 960 960\" fill=\"#0075FF\"><path d=\"M280-160 80-360l200-200 56 57-103 103h287v80H233l103 103-56 57Zm400-240-56-57 103-103H440v-80h287L624-743l56-57 200 200-200 200Z\"/></svg>",
    tune: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 -960 960 960\" fill=\"white\"><path d=\"M440-120v-240h80v80h320v80H520v80h-80Zm-320-80v-80h240v80H120Zm160-160v-80H120v-80h160v-80h80v240h-80Zm160-80v-80h400v80H440Zm160-160v-240h80v80h160v80H680v80h-80Zm-480-80v-80h400v80H120Z\"/></svg>",
    settings: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 -960 960 960\" fill=\"white\"><path d=\"m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z\"/></svg>"
  };
  static defaults = {
    columnCount: 6,
    resultsPerPage: 200
  };
  static addedFavoriteStatuses = {
    error: 0,
    alreadyAdded: 1,
    notLoggedIn: 2,
    success: 3
  };
  static styles = {
    thumbHoverOutline: `
    .favorite,
    .thumb {
      >a,
      >span,
      >div {
        &:hover {
          outline: 3px solid #0075FF !important;
        }
      }
    }`,
    thumbHoverOutlineDisabled: `
    .favorite,
    .thumb {
      >a,
      >span,
      >div:not(:has(img.video)) {
        &:hover {
          outline: none;
        }
      }
    }`
  };
  static typeableInputs = new Set([
    "color",
    "email",
    "number",
    "password",
    "search",
    "tel",
    "text",
    "url",
    "datetime"
  ]);
  static clickCodes = {
    left: 0,
    middle: 1,
    right: 2
  };
  static customTags = Utils.loadCustomTags();
  static favoriteItemClassName = "favorite";
  /**
   * @type {Function[]}
   */
  static staticInitializers = [];

  /**
   * @type {Boolean}
   */
  static get disabled() {
    if (Utils.onPostPage()) {
      return true;
    }

    if (Utils.onFavoritesPage()) {
      return false;
    }
    // const enabledOnSearchPages = Utils.getPreference("enableOnSearchPages", false) && Utils.getPerformanceProfile() === 0;
    const enabledOnSearchPages = Utils.getPreference("enableOnSearchPages", false);
    return !enabledOnSearchPages;
  }

  /**
   * @type {Boolean}
   */
  static get enabled() {
    return !Utils.disabled;
  }

  static initialize() {
    if (Utils.disabled) {
      throw new Error("Favorites Search Gallery disabled");
    }
    Utils.invokeStaticInitializers();
    Utils.removeUnusedScripts();
    Utils.insertCommonStyleHTML();
    Utils.setupCustomWebComponents();
    Utils.toggleFancyImageHovering(true);
    Utils.setTheme();
    Utils.prepareSearchPage();
    Utils.prefetchAdjacentSearchPages();
    Utils.setupOriginalImageLinksOnSearchPage();
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
   * @param {String} key
   * @param {any} value
   */
  static setPreference(key, value) {
    const preferences = JSON.parse(localStorage.getItem(Utils.preferencesLocalStorageKey) || "{}");

    preferences[key] = value;
    localStorage.setItem(Utils.preferencesLocalStorageKey, JSON.stringify(preferences));
  }

  /**
   * @param {String} key
   * @param {any} defaultValue
   * @returns {String | null}
   */
  static getPreference(key, defaultValue) {
    const preferences = JSON.parse(localStorage.getItem(Utils.preferencesLocalStorageKey) || "{}");
    const preference = preferences[key];

    if (preference === undefined) {
      return defaultValue === undefined ? null : defaultValue;
    }
    return preference;
  }

  /**
   * @returns {String | null}
   */
  static getUserId() {
    return Utils.getCookie("user_id");
  }

  /**
   * @returns {String | null}
   */
  static getFavoritesPageId() {
    const match = (/(?:&|\?)id=(\d+)/).exec(window.location.href);
    return match ? match[1] : null;
  }

  /**
   * @returns {Boolean}
   */
  static userIsOnTheirOwnFavoritesPage() {
    if (!Utils.flags.userIsOnTheirOwnFavoritesPage.set) {
      Utils.flags.userIsOnTheirOwnFavoritesPage.value = Utils.getUserId() === Utils.getFavoritesPageId();
      Utils.flags.userIsOnTheirOwnFavoritesPage.set = true;
    }
    return Utils.flags.userIsOnTheirOwnFavoritesPage.value;
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
   * @returns
   */
  static sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }

  /**
   * @param {Boolean} value
   */
  static forceHideCaptions(value) {
    for (const caption of document.getElementsByClassName("caption")) {
      if (value) {
        caption.classList.add("remove");
        caption.classList.add("inactive");
      } else {
        caption.classList.remove("remove");
      }
    }
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {String | null}
   */
  static getRemoveFavoriteButtonFromThumb(thumb) {
    return thumb.querySelector(".remove-favorite-button");
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {String | null}
   */
  static getAddFavoriteButtonFromThumb(thumb) {
    return thumb.querySelector(".add-favorite-button");
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
   * @param {HTMLImageElement} image
   * @returns {HTMLElement}
   */
  static getThumbFromImage(image) {
    const className = Utils.onSearchPage() ? "thumb" : Utils.favoriteItemClassName;
    return image.closest(`.${className}`);
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {HTMLImageElement}
   */
  static getImageFromThumb(thumb) {
    return thumb.querySelector("img");
  }

  /**
   * @returns {HTMLElement[]}
   */
  static getAllThumbs() {
    const className = Utils.onSearchPage() ? "thumb" : Utils.favoriteItemClassName;
    return Array.from(document.getElementsByClassName(className));
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {String}
   */
  static getOriginalImageURLFromThumb(thumb) {
    return Utils.getOriginalImageURL(Utils.getImageFromThumb(thumb).src);
  }

  /**
   * @param {String} thumbURL
   * @returns {String}
   */
  static getOriginalImageURL(thumbURL) {
    return thumbURL
      .replace("thumbnails", "/images")
      .replace("thumbnail_", "")
      .replace("us.rule34", "rule34");
  }

  /**
   * @param {String} imageURL
   * @returns {String}
   */
  static getExtensionFromImageURL(imageURL) {
    try {
      return (/\.(png|jpg|jpeg|gif)/g).exec(imageURL)[1];

    } catch (error) {
      return "jpg";
    }
  }

  /**
   * @param {String} originalImageURL
   * @returns {String}
   */
  static getThumbURL(originalImageURL) {
    return originalImageURL
      .replace(/\/images\/\/(\d+)\//, "thumbnails/$1/thumbnail_")
      .replace(/(?:gif|jpeg|png)/, "jpg")
      .replace("us.rule34", "rule34");
  }

  /**
   * @param {HTMLElement | Post} thumb
   * @returns {Set.<String>}
   */
  static getTagsFromThumb(thumb) {
    if (Utils.onSearchPage()) {
      const image = Utils.getImageFromThumb(thumb);
      const tags = image.hasAttribute("tags") ? image.getAttribute("tags") : image.title;
      return Utils.convertToTagSet(tags);
    }
    const post = Post.allPosts.get(thumb.id);
    return post === undefined ? new Set() : new Set(post.tagSet);
  }

  /**
   * @param {String} tag
   * @param {Set.<String>} tags
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
    return Utils.getImageFromThumb(thumb).hasAttribute("gif");
  }

  /**
   * @param {HTMLElement | Post} thumb
   * @returns {Boolean}
   */
  static isImage(thumb) {
    return !Utils.isVideo(thumb) && !Utils.isGif(thumb);
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
   * @returns {HTMLDivElement | null}
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
   *
   * @param {HTMLInputElement | HTMLTextAreaElement} input
   * @returns
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
      .some(element => element === true || element === "true");
    return !somethingIsSelected;
  }

  /**
   * @param {HTMLInputElement | HTMLTextAreaElement} input
   * @returns
   */
  static clearAwesompleteSelection(input) {
    const awesomplete = input.parentElement;

    if (awesomplete === null) {
      return;
    }
    const searchSuggestions = Array.from(awesomplete.querySelectorAll("li"));

    if (searchSuggestions.length === 0) {
      return;
    }

    for (const li of searchSuggestions) {
      li.setAttribute("aria-selected", false);
    }
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
    const id = Utils.onMobileDevice() ? "favorite-options" : "dynamic-favorite-options";
    const placeToInsert = document.getElementById(id);
    const checkboxId = `${optionId}-checkbox`;

    if (placeToInsert === null) {
      return null;
    }

    if (optionIsVisible === undefined || optionIsVisible) {
      optionIsVisible = "block";
    } else {
      optionIsVisible = "none";
    }
    placeToInsert.insertAdjacentHTML("beforeend", `
    <div id="${optionId}" style="display: ${optionIsVisible}">
      <label class="checkbox" title="${optionTitle}">

      <input id="${checkboxId}" type="checkbox"> ${optionText}<span class="option-hint"> ${optionHint}</span></label>
    </div>
  `);
    const newOptionsCheckbox = document.getElementById(checkboxId);

    newOptionsCheckbox.checked = optionIsChecked;
    newOptionsCheckbox.onchange = onOptionChanged;
    return document.getElementById(optionId);
  }

  /**
   * @returns {Boolean}
   */
  static onSearchPage() {
    if (!Utils.flags.onSearchPage.set) {
      Utils.flags.onSearchPage.value = location.href.includes("page=post&s=list");
      Utils.flags.onSearchPage.set = true;
    }
    return Utils.flags.onSearchPage.value;
  }

  /**
   * @returns {Boolean}
   */
  static onFavoritesPage() {
    if (!Utils.flags.onFavoritesPage.set) {
      Utils.flags.onFavoritesPage.value = location.href.includes("page=favorites");
      Utils.flags.onFavoritesPage.set = true;
    }
    return Utils.flags.onFavoritesPage.value;
  }

  /**
   * @returns {Boolean}
   */
  static onPostPage() {
    if (!Utils.flags.onPostPage.set) {
      Utils.flags.onPostPage.value = location.href.includes("page=post&s=view");
      Utils.flags.onPostPage.set = true;
    }
    return Utils.flags.onPostPage.value;
  }

  /**
   * @returns {String[]}
   */
  static getIdsToDeleteOnReload() {
    return JSON.parse(localStorage.getItem(Utils.idsToRemoveOnReloadLocalStorageKey)) || [];
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
   * @param {String} id
   */
  static insertStyleHTML(html, id) {
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

  static getTagDistribution() {
    const images = Utils.getAllThumbs().map(thumb => Utils.getImageFromThumb(thumb));
    const tagOccurrences = {};

    images.forEach((image) => {
      const tags = image.getAttribute("tags").replace(/ \d+$/, "").split(" ");

      tags.forEach((tag) => {
        const occurrences = tagOccurrences[tag];

        tagOccurrences[tag] = occurrences === undefined ? 1 : occurrences + 1;
      });
    });
    const sortedTagOccurrences = Utils.sortObjectByValues(tagOccurrences);
    let result = "";
    let i = 0;
    const max = 50;

    sortedTagOccurrences.forEach(item => {
      if (i < max) {
        result += `${item.key}: ${item.value}\n`;
      }
      i += 1;
    });
  }

  /**
   * @param {{key: any, value: any}} obj
   * @returns {{key: any, value: any}}
   */
  static sortObjectByValues(obj) {
    const sortable = Object.entries(obj);

    sortable.sort((a, b) => b[1] - a[1]);
    return sortable.map(item => ({
      key: item[0],
      value: item[1]
    }));
  }

  static insertCommonStyleHTML() {
    Utils.insertStyleHTML(Utils.utilitiesHTML, "common");
    Utils.toggleThumbHoverOutlines(false);
    setTimeout(() => {
      if (Utils.onSearchPage()) {
        Utils.removeInlineImgStyles();
      }
      Utils.configureVideoOutlines();
    }, 100);
  }

  /**
   * @param {Boolean} value
   */
  static toggleFancyImageHovering(value) {
    if (Utils.onMobileDevice() || Utils.onSearchPage()) {
      value = false;
    }
    let html = "";

    if (value) {
      html = `
    #favorites-search-gallery-content {
      padding: 40px 40px 30px !important;
      grid-gap: 2.5em !important;
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
          transform: scale(1.05, 1.05);
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
    `;
    }
    Utils.insertStyleHTML(html, "fancy-image-hovering");
  }

  static configureVideoOutlines() {
    const size = Utils.onMobileDevice() ? 2 : 3;
    const videoSelector = Utils.onFavoritesPage() ? "&:has(img.video)" : ">img.video";
    const gifSelector = Utils.onFavoritesPage() ? "&:has(img.gif)" : ">img.gif";

    Utils.insertStyleHTML(`
    .favorite, .thumb {

      >a,
      >div {
        ${videoSelector} {
            outline: ${size}px solid blue;
        }

        ${gifSelector} {
          outline: 2px solid hotpink;
        }
      }
    }
    `, "video-gif-borders");
  }

  static removeInlineImgStyles() {
    for (const image of document.getElementsByTagName("img")) {
      image.removeAttribute("style");
    }
  }

  static setTheme() {
    setTimeout(() => {
      if (Utils.usingDarkTheme()) {
        for (const element of document.querySelectorAll(".light-green-gradient")) {
          element.classList.remove("light-green-gradient");
          element.classList.add("dark-green-gradient");

          Utils.insertStyleHTML(`
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
          `, "dark-theme");
        }
      }
    }, 10);
  }

  /**
   * @param {String} content
   * @returns {Blob | MediaSource}
   */
  static getWorkerURL(content) {
    return URL.createObjectURL(new Blob([content], {
      type: "text/javascript"
    }));
  }

  static prefetchAdjacentSearchPages() {
    if (!Utils.onSearchPage()) {
      return;
    }
    const id = "search-page-prefetch";
    const alreadyPrefetched = document.getElementById(id) !== null;

    if (alreadyPrefetched) {
      return;
    }
    const container = document.createElement("div");

    try {
      const currentPage = document.getElementById("paginator").children[0].querySelector("b");

      for (const sibling of [currentPage.previousElementSibling, currentPage.nextElementSibling]) {
        if (sibling !== null && sibling.tagName.toLowerCase() === "a") {
          container.appendChild(Utils.createPrefetchLink(sibling.href));
        }
      }
      container.id = "search-page-prefetch";
      document.head.appendChild(container);
    } catch (error) {
      console.error(error);
    }
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
    let tags = Utils.getCookie("tag_blacklist", "");

    for (let i = 0; i < 3; i += 1) {
      tags = decodeURIComponent(tags).replace(/(?:^| )-/, "");
    }
    return tags;
  }

  /**
   * @returns {Boolean}
   */
  static galleryEnabled() {
    if (!Utils.flags.galleryEnabled.set) {
      Utils.flags.galleryEnabled.value = document.getElementById("gallery-container") !== null;
      Utils.flags.galleryEnabled.set = true;
    }
    return Utils.flags.galleryEnabled.value;
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
   * @param {Event} event
   * @returns {Boolean}
   */
  static enteredOverCaptionTag(event) {
    return event.relatedTarget !== null && event.relatedTarget.classList.contains("caption-tag");
  }

  /**
   * @param {String[]} postId
   * @param {Boolean} endingAnimation
   * @param {Boolean} smoothTransition
   */
  static scrollToThumb(postId, endingAnimation, smoothTransition) {
    const element = document.getElementById(postId);
    const elementIsNotAThumb = element === null || (!element.classList.contains("thumb") && !element.classList.contains(Utils.favoriteItemClassName));

    if (elementIsNotAThumb) {
      return;
    }
    const rect = element.getBoundingClientRect();
    const menu = document.getElementById("favorites-search-gallery-menu");
    const favoritesSearchHeight = menu === null ? 0 : menu.getBoundingClientRect().height;

    window.scroll({
      top: rect.top + window.scrollY + (rect.height / 2) - (window.innerHeight / 2) - (favoritesSearchHeight / 2),
      behavior: smoothTransition ? "smooth" : "instant"
    });

    if (!endingAnimation) {
      return;
    }
    const image = Utils.getImageFromThumb(element);

    image.classList.add("found");
    setTimeout(() => {
      image.classList.remove("found");
    }, 2000);
  }

  /**
   * @param {HTMLElement} thumb
   */
  static assignContentType(thumb) {
    const image = Utils.getImageFromThumb(thumb);
    const tagAttribute = image.hasAttribute("tags") ? "tags" : "title";
    const tags = image.getAttribute(tagAttribute);

    Utils.setContentType(image, Utils.getContentType(tags));
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

  static correctMisspelledTags(tags) {
    if ((/vide(?:\s|$)/).test(tags)) {
      tags += " video";
    }
    return tags;
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
   * @returns {Boolean}
   */
  static usingFirefox() {
    if (!Utils.flags.usingFirefox.set) {
      Utils.flags.usingFirefox.value = navigator.userAgent.toLowerCase().includes("firefox");
      Utils.flags.usingFirefox.set = true;
    }
    return Utils.flags.usingFirefox.value;
  }

  /**
   * @returns  {Boolean}
   */
  static onMobileDevice() {
    if (!Utils.flags.onMobileDevice.set) {
      Utils.flags.onMobileDevice.value = (/iPhone|iPad|iPod|Android/i).test(navigator.userAgent);
      Utils.flags.onMobileDevice.set = true;
    }
    return Utils.flags.onMobileDevice.value;
  }

  /**
   * @returns {Number}
   */
  static getPerformanceProfile() {
    return parseInt(Utils.getPreference("performanceProfile", 0));
  }

  /**
   * @param {String} tagName
   * @returns {Promise.<Boolean>}
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
   * @param {Map} map
   * @returns {Object}
   */
  static mapToObject(map) {
    return Array.from(map).reduce((object, [key, value]) => {
      object[key] = value;
      return object;
    }, {});
  }

  /**
   * @param {Object} object
   * @returns {Map}
   */
  static objectToMap(object) {
    return new Map(Object.entries(object));
  }

  /**
   * @param {String} string
   * @returns {Boolean}
   */
  static isNumber(string) {
    return (/^\d+$/).test(string);
  }

  /**
   * @param {String} id
   * @returns {Promise.<Number>}
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
   * @param {HTMLInputElement | HTMLTextAreaElement} input
   * @param {String} suggestion
   */
  static insertSuggestion(input, suggestion) {
    const cursorAtEnd = input.selectionStart === input.value.length;
    const firstHalf = input.value.slice(0, input.selectionStart);
    const secondHalf = input.value.slice(input.selectionStart);
    const firstHalfWithPrefixRemoved = firstHalf.replace(/(\s?)(-?)\S+$/, "$1$2");
    const combinedHalves = Utils.removeExtraWhiteSpace(`${firstHalfWithPrefixRemoved}${suggestion} ${secondHalf}`);
    const result = cursorAtEnd ? `${combinedHalves} ` : combinedHalves;
    const selectionStart = firstHalfWithPrefixRemoved.length + suggestion.length + 1;

    input.value = result;
    input.selectionStart = selectionStart;
    input.selectionEnd = selectionStart;
  }

  /**
   * @param {HTMLInputElement | HTMLTextAreaElement} input
   */
  static hideAwesomplete(input) {
    Utils.getAwesompleteFromInput(input).querySelector("ul").setAttribute("hidden", "");
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
   * @param {HTMLElement} element
   * @returns {Boolean}
   */
  static isTypeableInput(element) {
    const tagName = element.tagName.toLowerCase();

    if (tagName === "textarea") {
      return true;
    }

    if (tagName === "input") {
      return Utils.typeableInputs.has(element.getAttribute("type"));
    }
    return false;
  }

  /**
   * @param {KeyboardEvent} event
   * @returns {Boolean}
   */
  static isHotkeyEvent(event) {
    return !event.repeat && !Utils.isTypeableInput(event.target);
  }

  /**
   * @param {Set} a
   * @param {Set} b
   * @returns {Set}
   */
  static union(a, b) {
    const c = new Set(a);

    for (const element of b.values()) {
      c.add(element);
    }
    return c;
  }

  /**
   * @param {Set} a
   * @param {Set} b
   * @returns {Set}
   */
  static difference(a, b) {
    const c = new Set(a);

    for (const element of b.values()) {
      c.delete(element);
    }
    return c;
  }

  static removeUnusedScripts() {
    if (!Utils.onFavoritesPage()) {
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
   * @returns {Set.<String>}
   */
  static convertToTagSet(tagString) {
    tagString = Utils.removeExtraWhiteSpace(tagString);

    if (tagString === "") {
      return new Set();
    }
    return new Set(tagString.split(" ").sort());
  }

  /**
   * @param {Set.<String>} tagSet
   * @returns {String}
   */
  static convertToTagString(tagSet) {
    if (tagSet.size === 0) {
      return "";
    }
    return Array.from(tagSet).join(" ");
  }

  /**
   * @returns {String | null}
   */
  static getPostPageId() {
    const match = (/id=(\d+)/).exec(window.location.href);
    return match === null ? null : match[1];
  }

  /**
   * @param {String} searchTag
   * @param {String[]} tags
   * @returns {Boolean}
   */
  static tagsMatchWildcardSearchTag(searchTag, tags) {
    try {
      const wildcardRegex = new RegExp(`^${searchTag.replaceAll(/\*/g, ".*")}$`);
      return tags.some(tag => wildcardRegex.test(tag));
    } catch {
      return false;
    }
  }

  static setupCustomWebComponents() {
    Utils.setupCustomNumberWebComponents();
  }

  static async setupCustomNumberWebComponents() {
    await Utils.sleep(400);
    const numberComponents = Array.from(document.querySelectorAll(".number"));

    for (const element of numberComponents) {
      const numberComponent = new NumberComponent(element);
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
   * @returns {Set.<String>}
   */
  static loadCustomTags() {
    return new Set(JSON.parse(localStorage.getItem("customTags")) || []);
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
   * @param {String} tag
   * @returns {String}
   */
  static removeStartingHyphen(tag) {
    return tag.replace(/^-/, "");
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

  static removeSavedSearchPrefix(suggestion) {
    return suggestion.replace(/^\S+_saved_search /, "");
  }

  /**
   * @param {Boolean} value
   */
  static toggleThumbHoverOutlines(value) {
    // insertStyleHTML(value ? STYLES.thumbHoverOutlineDisabled : STYLES.thumbHoverOutline, "thumb-hover-outlines");
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
   * @returns {String}
   */
  static getSortingMethod() {
    const sortingMethodSelect = document.getElementById("sorting-method");
    return sortingMethodSelect === null ? "default" : sortingMethodSelect.value;
  }

  /**
   * @returns {HTMLDivElement}
   */
  static createFavoritesSearchGalleryContainer() {
    const container = document.createElement("div");

    container.id = "favorites-search-gallery";
    document.body.appendChild(container);
    return container;
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
   * @param {InsertPosition} position
   * @param {String} html
   */
  static insertFavoritesSearchGalleryHTML(position, html) {
    Utils.insertHTMLAndExtractStyle(Utils.favoritesSearchGalleryContainer, position, html);
  }

  /**
   * @param {String} str
   * @returns {String}
   */
  static removeNonNumericCharacters(str) {
    return str.replaceAll(/\D/g, "");
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
    const match = (/\?(\d+)$/).exec(image.src);
    return match[1];
  }

  static deletePersistentData() {
    const message = `
Are you sure you want to reset?
This will delete all cached favorites, and preferences.
Tag modifications and saved searches will be preserved.
  `;

    if (confirm(message)) {
      const persistentLocalStorageKeys = new Set(["customTags", "savedSearches"]);

      Object.keys(localStorage).forEach((key) => {
        if (!persistentLocalStorageKeys.has(key)) {
          localStorage.removeItem(key);
        }
      });
      indexedDB.deleteDatabase(FavoritesDatabaseWrapper.databaseName);
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
    Utils.staticInitializers = null;
  }

  /**
   * @returns {Number}
   */
  static loadAllowedRatings() {
    return parseInt(Utils.getPreference("allowedRatings", 7));
  }

  /**
   * @param {Set} a
   * @param {Set} b
   * @returns {Set}
   */
  static symmetricDifference(a, b) {
    return Utils.union(Utils.difference(a, b), Utils.difference(b, a));
  }

  static clearOriginalFavoritesPage() {
    const thumbs = Array.from(document.getElementsByClassName("thumb"));
    let content = document.getElementById("content");

    if (content === null && thumbs.length > 0) {
      content = thumbs[0].closest("body>div");
    }

    if (content !== null) {
      content.remove();
    }
    setTimeout(() => {
      dispatchEvent(new CustomEvent("originalFavoritesCleared", {
        detail: thumbs
      }));
    }, 1000);
  }

  /**
   * @param {String} id
   * @returns {String}
   */
  static getPostAPIURL(id) {
    return `https://api.rule34.xxx//index.php?page=dapi&s=post&q=index&id=${id}`;
  }

  /**
   * @returns {Promise<String>}
   */
  static getImageExtension(thumb) {
    if (Utils.isVideo(thumb)) {
      return "mp4";
    }

    if (Utils.isGif(thumb)) {
      return "gif";
    }

    if (Gallery.extensionIsKnown(thumb.id)) {
      return Gallery.getImageExtension(thumb.id);
    }
    return Utils.fetchImageExtension(thumb);
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {Promise<String>}
   */
  static fetchImageExtension(thumb) {
    return fetch(Utils.getPostAPIURL(thumb.id))
      .then((response) => {
        return response.text();
      })
      .then((html) => {
        const dom = new DOMParser().parseFromString(html, "text/html");
        const metadata = dom.querySelector("post");
        const extension = Utils.getExtensionFromImageURL(metadata.getAttribute("file_url"));

        Gallery.assignImageExtension(thumb.id, extension);
        return extension;
      })
      .catch((error) => {
        console.error(error);
        return "jpg";
      });
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {Promise<String>}
   */
  static async getOriginalImageURLWithExtension(thumb) {
    const extension = await Utils.getImageExtension(thumb);
    return Utils.getOriginalImageURL(thumb.querySelector("img").src).replace(".jpg", `.${extension}`);
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
   * @returns {String}
   */
  static getSearchPageAPIURL() {
    const postsPerPage = 42;
    const apiURL = `https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&limit=${postsPerPage}`;
    let blacklistedTags = ` ${Utils.negateTags(Utils.tagBlacklist)}`.replace(/\s-/g, "+-");
    let pageNumber = (/&pid=(\d+)/).exec(location.href);
    let searchTags = (/&tags=([^&]*)/).exec(location.href);

    pageNumber = pageNumber === null ? 0 : Math.floor(parseInt(pageNumber[1]) / postsPerPage);
    searchTags = searchTags === null ? "" : searchTags[1];

    if (searchTags === "all") {
      searchTags = "";
      blacklistedTags = "";
    }
    return `${apiURL}&tags=${searchTags}${blacklistedTags}&pid=${pageNumber}`;
  }

  static findImageExtensionsOnSearchPage() {
    const searchPageAPIURL = Utils.getSearchPageAPIURL();
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
          const tagSet = Utils.convertToTagSet(tags);
          const thumb = document.getElementById(id);

          if (!tagSet.has("video") && originalImageURL.endsWith("mp4") && thumb !== null) {
            const image = Utils.getImageFromThumb(thumb);

            image.setAttribute("tags", `${image.getAttribute("tags")} video`);
            Utils.setContentType(image, "video");
          } else if (!tagSet.has("gif") && originalImageURL.endsWith("gif") && thumb !== null) {
            const image = Utils.getImageFromThumb(thumb);

            image.setAttribute("tags", `${image.getAttribute("tags")} gif`);
            Utils.setContentType(image, "gif");
          }
          const isAnImage = Utils.getContentType(tags) === "image";
          const isBlacklisted = originalImageURL === "https://api-cdn.rule34.xxx/images//";

          if (!isAnImage || isBlacklisted) {
            continue;
          }
          const extension = Utils.getExtensionFromImageURL(originalImageURL);

          Gallery.assignImageExtension(id, extension);
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }

  static async setupOriginalImageLinksOnSearchPage() {
    if (Gallery.disabled) {
      await Utils.findImageExtensionsOnSearchPage();
      Utils.setupOriginalImageLinksOnSearchPageHelper();
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
    const imageURL = await Utils.getOriginalImageURLWithExtension(thumb);
    const thumbURL = anchor.href;

    anchor.href = imageURL;
    anchor.onclick = (event) => {
      if (!event.ctrlKey) {
        event.preventDefault();
      }
    };
    anchor.onmousedown = (event) => {
      if (!event.ctrlKey) {
        if (event.button === Utils.clickCodes.left && Gallery.disabled) {
          document.location = thumbURL;
        } else if (event.button === Utils.clickCodes.middle) {
          window.open(thumbURL);
        }
        event.preventDefault();
      }
    };
  }

  static prepareSearchPage() {
    for (const thumb of Utils.getAllThumbs()) {
      Utils.removeTitleFromImage(Utils.getImageFromThumb(thumb));
      Utils.assignContentType(thumb);
      thumb.id = Utils.removeNonNumericCharacters(Utils.getIdFromThumb(thumb));
    }
  }
}
