class Utils {
  static localStorageKeys = {
    imageExtensions: "imageExtensions",
    preferences: "preferences"
  };
  static settings = {
    extensionsFoundBeforeSavingCount: 100
  };
  static favoritesSearchGalleryContainer = Utils.createFavoritesSearchGalleryContainer();
  static mainSearchBoxId = "favorites-search-box";
  static idsToRemoveOnReloadLocalStorageKey = "recentlyRemovedIds";
  static tagBlacklist = Utils.getTagBlacklist();
  static flags = {
    onSearchPage: location.href.includes("page=post&s=list"),
    onFavoritesPage: location.href.includes("page=favorites"),
    onPostPage: location.href.includes("page=post&s=view"),
    usingFirefox: navigator.userAgent.toLowerCase().includes("firefox"),
    onMobileDevice: (/iPhone|iPad|iPod|Android/i).test(navigator.userAgent),
    userIsOnTheirOwnFavoritesPage: Utils.getUserId() === Utils.getFavoritesPageId()
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
    exit: "<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"#FFFFFF\" viewBox=\"0 -960 960 960\"><path d=\"m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z\"/></svg>",
    fullscreenEnter: "<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"#FFFFFF\" viewBox=\"0 -960 960 960\"><path d=\"M120-120v-200h80v120h120v80H120Zm520 0v-80h120v-120h80v200H640ZM120-640v-200h200v80H200v120h-80Zm640 0v-120H640v-80h200v200h-80Z\"/></svg>",
    fullscreenExit: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 -960 960 960\" fill=\"#FFFFFF\"><path d=\"M240-120v-120H120v-80h200v200h-80Zm400 0v-200h200v80H720v120h-80ZM120-640v-80h120v-120h80v200H120Zm520 0v-200h80v120h120v80H640Z\"/></svg>",
    openInNew: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 -960 960 960\" fill=\"#FFFFFF\"><path d=\"M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h560v-280h80v280q0 33-23.5 56.5T760-120H200Zm188-212-56-56 372-372H560v-80h280v280h-80v-144L388-332Z\"/></svg>",
    download: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 -960 960 960\" fill=\"#FFFFFF\"><path d=\"M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z\"/></svg>",
    pin: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 -960 960 960\" fill=\"#FFFFFF\"><path d=\"m640-480 80 80v80H520v240l-40 40-40-40v-240H240v-80l80-80v-280h-40v-80h400v80h-40v280Zm-286 80h252l-46-46v-314H400v314l-46 46Zm126 0Z\"/></svg>",
    dock: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 -960 960 960\" fill=\"#FFFFFF\"><path d=\"M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm440-80h120v-560H640v560Zm-80 0v-560H200v560h360Zm80 0h120-120Z\"/></svg>",
    bulb: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 -960 960 960\" fill=\"#FFFFFF\"><path d=\"M480-80q-26 0-47-12.5T400-126q-33 0-56.5-23.5T320-206v-142q-59-39-94.5-103T190-590q0-121 84.5-205.5T480-880q121 0 205.5 84.5T770-590q0 77-35.5 140T640-348v142q0 33-23.5 56.5T560-126q-12 21-33 33.5T480-80Zm-80-126h160v-36H400v36Zm0-76h160v-38H400v38Zm-8-118h58v-108l-88-88 42-42 76 76 76-76 42 42-88 88v108h58q54-26 88-76.5T690-590q0-88-61-149t-149-61q-88 0-149 61t-61 149q0 63 34 113.5t88 76.5Zm88-162Zm0-38Z\"/></svg>",
    settings: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 -960 960 960\" fill=\"white\"><path d=\"m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z\"/></svg>"
  };
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
    }`,
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
  static imageExtensions = Utils.loadDiscoveredImageExtensions();
  /**
   * @type {RegExp}
   */
  static thumbnailSourceCompressionRegex = /thumbnails\/+([0-9]+)\/+thumbnail_([0-9a-f]+)/;
  /**
   * @type {Cooldown}
   */
  static imageExtensionAssignmentCooldown;
  static recentlyDiscoveredImageExtensionCount = 0;
  static extensionDecodings = {
    0: "jpg",
    1: "png",
    2: "jpeg",
    3: "gif"
  };
  static extensionEncodings = {
    "jpg": 0,
    "png": 1,
    "jpeg": 2,
    "gif": 3
  };
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
    const enabledOnSearchPages = Boolean(Utils.getPreference("enhanceSearchPages", false));
    return !enabledOnSearchPages;
  }

  /**
   * @type {String}
   */
  static get itemClassName() {
    return Utils.onSearchPage() ? "thumb" : Utils.favoriteItemClassName;
  }

  static setup() {
    if (Utils.disabled) {
      throw new Error("Favorites Search Gallery disabled");
    }
    Utils.invokeStaticInitializers();
    Utils.removeUnusedScripts();
    Utils.insertCommonStyleHTML();
    Utils.setTheme();
    Utils.initializeSearchPage();
    Utils.prefetchAdjacentSearchPages();
    Utils.setupOriginalImageLinksOnSearchPage();
    Utils.initializeImageExtensionAssignmentCooldown();
  }

  static postProcess() {
    dispatchEvent(new Event("postProcess"));
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
    const preferences = JSON.parse(localStorage.getItem(Utils.localStorageKeys.preferences) || "{}");

    preferences[key] = value;
    localStorage.setItem(Utils.localStorageKeys.preferences, JSON.stringify(preferences));
  }

  /**
   * @param {String} key
   * @param {any} defaultValue
   * @returns {String}
   */
  static getPreference(key, defaultValue) {
    const preferences = JSON.parse(localStorage.getItem(Utils.localStorageKeys.preferences) || "{}");
    const preference = preferences[key];

    if (preference === undefined) {
      return defaultValue === undefined ? "" : defaultValue;
    }
    return preference;
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
   * @returns {Boolean}
   */
  static userIsOnTheirOwnFavoritesPage() {
    return Utils.flags.userIsOnTheirOwnFavoritesPage;
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
   * @returns {Promise.<any>}
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
    const thumbSource = image === null ? "" : image.src;
    const cleanedThumbSource = Utils.cleanThumbnailSource(thumbSource, thumb.id);
    return cleanedThumbSource
      .replace("thumbnails", "/images")
      .replace("thumbnail_", "")
      .replace("us.rule34", "rule34");
  }

  /**
   * @param {String} imageURL
   * @returns {String}
   */
  static getExtensionFromImageURL(imageURL) {
    const match = (/\.(png|jpg|jpeg|gif|mp4)/g).exec(imageURL);
    return match === null ? "jpg" : match[1];
  }

  /**
   * @param {HTMLElement | Post} thumb
   * @returns {Set.<String>}
   */
  static getTagsFromThumb(thumb) {
    if (this.onSearchPage()) {
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
    const image = this.getImageFromThumb(thumb);
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
        <input id="${checkboxId}" type="checkbox">
        <span> ${optionText}</span>
        <span class="option-hint"> ${optionHint}</span></label>
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
    return Utils.flags.onSearchPage;
  }

  /**
   * @returns {Boolean}
   */
  static onFavoritesPage() {
    return Utils.flags.onFavoritesPage;
  }

  /**
   * @returns {Boolean}
   */
  static onPostPage() {
    return Utils.flags.onPostPage;
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

  static insertCommonStyleHTML() {
    Utils.insertStyleHTML(HTMLStrings.utilities, "common");
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
    Utils.insertStyleHTML(value ? Utils.styles.fancyHovering : "", "fancy-image-hovering");
  }

  static configureVideoOutlines() {
    const size = Utils.onMobileDevice() ? 2 : 3;
    const videoSelector = Utils.onFavoritesPage() ? "&:has(img.video)" : ">img.video";
    const gifSelector = Utils.onFavoritesPage() ? "&:has(img.gif)" : ">img.gif";
    const videoRule = `${videoSelector} {outline: ${size}px solid blue}`;
    const gifRule = `${gifSelector} {outline: ${size}px solid hotpink}`;

    Utils.insertStyleHTML(`
      #favorites-search-gallery-content {
        &.masonry,
        &.row,
        &.square
        {
          >.favorite {
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
    window.addEventListener("postProcess", () => {
      Utils.toggleDarkTheme(Utils.usingDarkTheme());
    });
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
    const platform = Utils.onMobileDevice() ? "mobile" : "desktop";
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

  static prefetchAdjacentSearchPages() {
    if (!Utils.onSearchPage()) {
      return;
    }

    if (Utils.galleryIsEnabled() && GalleryConstants.endlessSearchPageGallery) {
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
      container.id = id;
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
    return event.relatedTarget !== null && event.relatedTarget.classList.contains("caption-tag");
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
    return Utils.flags.usingFirefox;
  }

  /**
   * @returns  {Boolean}
   */
  static onMobileDevice() {
    return Utils.flags.onMobileDevice;
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
  static isOnlyDigits(string) {
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
   */
  static hideAwesomplete(input) {
    const awesomplete = Utils.getAwesompleteFromInput(input);

    if (awesomplete !== null) {
      awesomplete.querySelector("ul").setAttribute("hidden", "");
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
    return !event.repeat && event.target instanceof HTMLElement && !Utils.isTypeableInput(event.target);
  }

  /**
   * @param {Set.<any>} a
   * @param {Set.<any>} b
   * @returns {Set.<any>}
   */
  static union(a, b) {
    const c = new Set(a);

    for (const element of b.values()) {
      c.add(element);
    }
    return c;
  }

  /**
   * @param {Set.<any>} a
   * @param {Set.<any>} b
   * @returns {Set.<any>}
   */
  static difference(a, b) {
    const c = new Set(a);

    for (const element of b.values()) {
      c.delete(element);
    }
    return c;
  }

  /**
   * @param {Set.<any>} a
   * @param {Set.<any>} b
   * @returns {Set.<any>}
   */
  static intersection(a, b) {
    const c = new Set();

    for (const element of a.values()) {
      if (b.has(element)) {
        c.add(element);
      }
    }
    return c;
  }

  /**
   * @param {Set.<any>} a
   * @returns {Set.<any>}
   */
  static sortSet(a) {
    return new Set(Array.from(a).sort());
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
   * @returns {Set.<String>}
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

    if (image === null) {
      return "NA";
    }
    const match = (/\?(\d+)$/).exec(image.src);
    return match === null ? "NA" : match[1];
  }

  static deletePersistentData() {
    const desktopSuffix = Utils.onMobileDevice() ? "" : " Tag modifications and saved searches will be preserved.";

    const message = `Are you sure you want to reset? This will delete all cached favorites, and preferences.${desktopSuffix}`;

    if (confirm(message)) {
      const persistentLocalStorageKeys = new Set(["customTags", "savedSearches"]);

      Object.keys(localStorage).forEach((key) => {
        if (!persistentLocalStorageKeys.has(key)) {
          localStorage.removeItem(key);
        }
      });
      indexedDB.deleteDatabase(FavoritesDatabaseInterface.databaseName);
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
    return parseInt(Utils.getPreference("allowedRatings", 7));
  }

  /**
   * @param {Set.<any>} a
   * @param {Set.<any>} b
   * @returns {Set.<any>}
   */
  static symmetricDifference(a, b) {
    return Utils.union(Utils.difference(a, b), Utils.difference(b, a));
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
   * @returns {Promise<String>}
   */
  static getImageExtensionFromThumb(thumb) {
    if (Utils.isVideo(thumb)) {
      return Promise.resolve("mp4");
    }

    if (Utils.isGif(thumb)) {
      return Promise.resolve("gif");
    }

    if (Utils.extensionIsKnown(thumb.id)) {
      return Promise.resolve(Utils.getImageExtension(thumb.id));
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

        Utils.assignImageExtension(thumb.id, extension);
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
   * @param {Number} desiredPageNumber
   * @returns {String}
   */
  static getSearchPageAPIURL(desiredPageNumber) {
    const postsPerPage = 42;
    const apiURL = `https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&limit=${postsPerPage}`;
    const blacklistedTags = ` ${Utils.negateTags(Utils.tagBlacklist)}`.replace(/\s-/g, "+-");
    let searchTags = (/&tags=([^&]*)/).exec(location.href);
    let pageNumber;

    if (desiredPageNumber === undefined) {
      const pageNumberMatch = (/&pid=(\d+)/).exec(location.href);

      pageNumber = pageNumberMatch === null ? 0 : Math.floor(parseInt(pageNumberMatch[1]) / postsPerPage);
    } else {
      pageNumber = desiredPageNumber;
    }

    searchTags = searchTags === null ? "" : searchTags[1];

    if (searchTags === "all") {
      searchTags = "";
    }
    return `${apiURL}&tags=${searchTags}${blacklistedTags}&pid=${pageNumber}`;
  }

  /**
   * @param {Number} pageNumber
   * @param {Function} callback
   */
  static findImageExtensionsOnSearchPage(pageNumber, callback) {
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

          Utils.assignImageExtension(id, extension);
        }

        if (callback !== undefined) {
          return callback(html);
        }
        return null;
      })
      .catch((error) => {
        console.error(error);
      });
  }

  static async setupOriginalImageLinksOnSearchPage() {
    if (!Utils.onSearchPage()) {
      return;
    }

    if (Utils.galleryIsDisabled()) {
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

      if (leftClick && Utils.galleryIsDisabled()) {
        document.location = thumbURL;
      } else if (middleClick || shiftClick) {
        window.open(thumbURL);
      }
    };
  }

  static initializeSearchPage() {
    if (!Utils.onSearchPage()) {
      return;
    }

    for (const thumb of Utils.getAllThumbs()) {
      Utils.removeTitleFromImage(Utils.getImageFromThumb(thumb));
      Utils.assignContentType(thumb);
      thumb.id = Utils.removeNonNumericCharacters(Utils.getIdFromThumb(thumb));
    }
  }

  /**
   * @returns {Object.<String, Number>}
   */
  static loadDiscoveredImageExtensions() {
    return JSON.parse(localStorage.getItem(Utils.localStorageKeys.imageExtensions)) || {};
  }

  /**
   * @param {String | Number} id
   * @returns {String}
   */
  static getImageExtension(id) {
    return Utils.extensionDecodings[Utils.imageExtensions[Number(id)]];
  }

  /**
   * @param {String | Number} id
   * @param {String} extension
   */
  static setImageExtension(id, extension) {
    Utils.imageExtensions[parseInt(id)] = Utils.extensionEncodings[extension];
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
    if (!Utils.onFavoritesPage()) {
      return;
    }
    Utils.recentlyDiscoveredImageExtensionCount = 0;
    localStorage.setItem(Utils.localStorageKeys.imageExtensions, JSON.stringify(Utils.imageExtensions));
  }

  /**
   * @param {String} id
   * @param {String} extension
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
    return str.replaceAll(/([()])/g, "\\$&");
  }

  /**
   * @returns {Promise.<Number>}
   */
  static getExpectedFavoritesCount() {
    const profileURL = `https://rule34.xxx/index.php?page=account&s=profile&id=${Utils.getFavoritesPageId()}`;
    return fetch(profileURL)
      .then((response) => {
        if (response.ok) {
          return response.text();
        }
        throw new Error(response.status);
      })
      .then((html) => {
        const favoritesURL = Array.from(new DOMParser().parseFromString(html, "text/html").querySelectorAll("a"))
          .find(a => a.href.includes("page=favorites&s=view"));
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
    return element.tagName !== undefined && element.tagName.toLowerCase() === tagName;
  }

  static scrollToTop() {
    window.scrollTo(0, Utils.onMobileDevice() ? 10 : 0);
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
   * @returns {Promise.<any>}
   */
  static sendPostedMessage(worker, message) {
    return new Promise((resolve) => {
      const id = Date.now() + Math.random();
      const handleMessage = (event) => {
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
    let timeoutId;
    let firstCall = true;
    let calledDuringDebounce = false;
    return (...args) => {
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
    let timeoutId;
    return (...args) => {
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
    return (...args) => {
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
    const thumbSelector = Utils.onSearchPage() ? ".thumb img" : ".favorite img:first-child";
    const image = mouseEvent.target.matches(thumbSelector) ? mouseEvent.target : null;
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
   * @param {String} dimensionString
   * @returns {{x: Number, y: Number}}
   */
  static getDimensions(dimensionString) {
    const match = dimensionString.match(/^(\d+)x(\d+)$/);
    const [x, y] = match ? [parseInt(match[1]), parseInt(match[2])] : [0, 0];
    return {
      x,
      y
    };
  }

  /**
   * @returns {Promise.<any>}
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
   * @returns {String}
   */
  static loadFavoritesLayout() {
    return Utils.getPreference("layoutSelect", "masonry");
  }

  /**
   * @param {HTMLElement | undefined} thumb
   * @returns {Promise.<{status: Number, id: String}>}
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
   * @returns {Promise.<{status: Number, id: String}>}
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
   * @returns {Boolean}
   */
  static galleryIsDisabled() {
    return (Utils.onMobileDevice() && Utils.onSearchPage()) || Utils.getPerformanceProfile() > 0 || Utils.onPostPage();
  }

  /**
   * @returns {Boolean}
   */
  static galleryIsEnabled() {
    return !Utils.galleryIsDisabled();
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
    if (Utils.inFullscreen()) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
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
}
