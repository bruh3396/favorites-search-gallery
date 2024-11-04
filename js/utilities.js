const utilitiesHTML = `<style>
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
    transform: scale(1.1, 1.1);
  }

  .number {
    display: inline-block;
    margin-top: 5px;
    border: 1px solid white;
    padding: 0px 10px;
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
      padding: 0;
      margin: 0;

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
      color: #0075FF;
      width: 2ch;
      padding: 0;
      margin: 0;
      font-weight: bold;
      padding: 3px;
      background: none;
      /* outline: none; */
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
</style>`;

class Cooldown {
  /**
   * @type {Number}
  */
  timeout;
  /**
   * @type {Number}
  */
  waitTime;
  /**
   * @type {Boolean}
  */
  skipCooldown;
  /**
   * @type {Boolean}
  */
  debounce;
  /**
   * @type {Boolean}
  */
  debouncing;
  /**
   * @type {Function}
  */
  onDebounceEnd;
  /**
   * @type {Function}
  */
  onCooldownEnd;

  get ready() {
    if (this.skipCooldown) {
      return true;
    }

    if (this.timeout === null) {
      this.start();
      return true;
    }

    if (this.debounce) {
      this.startDebounce();
    }
    return false;
  }

  /**
   * @param {Number} waitTime
   * @param {Boolean} debounce
   */
  constructor(waitTime, debounce = false) {
    this.timeout = null;
    this.waitTime = waitTime;
    this.skipCooldown = false;
    this.debounce = debounce;
    this.debouncing = false;
    this.onDebounceEnd = () => { };
    this.onCooldownEnd = () => { };
  }

  startDebounce() {
    this.debouncing = true;
    clearTimeout(this.timeout);
    this.start();
  }

  start() {
    this.timeout = setTimeout(() => {
      this.timeout = null;

      if (this.debouncing) {
        this.onDebounceEnd();
        this.debouncing = false;
      }
      this.onCooldownEnd();
    }, this.waitTime);
  }

  stop() {
    if (this.timeout === null) {
      return;
    }
    clearTimeout(this.timeout);
  }

  restart() {
    this.stop();
    this.start();
  }

}

class MetadataSearchExpression {
  /**
   * @type {String}
  */
  metric;
  /**
   * @type {String}
  */
  operator;
  /**
   * @type {String | Number}
  */
  value;

  /**
   * @param {String} metric
   * @param {String} operator
   * @param {String} value
   */
  constructor(metric, operator, value) {
    this.metric = metric;
    this.operator = operator;
    this.value = this.setValue(value);
  }

  /**
   * @param {String} value
   * @returns {String | Number}
   */
  setValue(value) {
    if (!isNumber(value)) {
      return value;
    }

    if (this.metric === "id" && this.operator === ":") {
      return value;
    }
    return parseInt(value);
  }
}

const IDS_TO_REMOVE_ON_RELOAD_KEY = "recentlyRemovedIds";
const TAG_BLACKLIST = getTagBlacklist();
const PREFERENCES_LOCAL_STORAGE_KEY = "preferences";
const FLAGS = {
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
  usingRenderer: {
    set: false,
    value: undefined
  }
};
const ICONS = {
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
const DEFAULTS = {
  columnCount: 6,
  resultsPerPage: 200
};
const ADDED_FAVORITE_STATUS = {
  error: 0,
  alreadyAdded: 1,
  notLoggedIn: 2,
  success: 3
};
const STYLES = {
  thumbHoverOutline: `
    .thumb-node,
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
    .thumb-node,
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
const TYPEABLE_INPUTS = new Set([
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

/**
 * @param {String} key
 * @param {any} value
 */
function setCookie(key, value) {
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
function getCookie(key, defaultValue) {
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
function setPreference(key, value) {
  const preferences = JSON.parse(localStorage.getItem(PREFERENCES_LOCAL_STORAGE_KEY) || "{}");

  preferences[key] = value;
  localStorage.setItem(PREFERENCES_LOCAL_STORAGE_KEY, JSON.stringify(preferences));
}

/**
 * @param {String} key
 * @param {any} defaultValue
 * @returns {String | null}
 */
function getPreference(key, defaultValue) {
  const preferences = JSON.parse(localStorage.getItem(PREFERENCES_LOCAL_STORAGE_KEY) || "{}");
  const preference = preferences[key];

  if (preference === undefined) {
    return defaultValue === undefined ? null : defaultValue;
  }
  return preference;
}

/**
 * @returns {String | null}
 */
function getUserId() {
  return getCookie("user_id");
}

/**
 * @returns {String | null}
 */
function getFavoritesPageId() {
  const match = (/(?:&|\?)id=(\d+)/).exec(window.location.href);
  return match ? match[1] : null;
}

/**
 * @returns {Boolean}
 */
function userIsOnTheirOwnFavoritesPage() {
  if (!FLAGS.userIsOnTheirOwnFavoritesPage.set) {
    FLAGS.userIsOnTheirOwnFavoritesPage.value = getUserId() === getFavoritesPageId();
    FLAGS.userIsOnTheirOwnFavoritesPage.set = true;
  }
  return FLAGS.userIsOnTheirOwnFavoritesPage.value;
}

/**
 * @param {String} url
 * @param {Function} onSuccess
 * @param {Number} delayIncrement
 * @param {Number} delay
 */
function requestPageInformation(url, onSuccess, delay = 0) {
  const delayIncrement = 500;

  setTimeout(() => {
    fetch((url))
      .then((response) => {
        if (response.status === 503) {
          requestPageInformation(url, onSuccess, delay + delayIncrement);
        }
        return response.text();
      })
      .then((html) => {
        onSuccess(html);
      });
  }, delay);
}

/**
 * @param {Number} value
 * @param {Number} min
 * @param {Number} max
 * @returns {Number}
 */
function clamp(value, min, max) {
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
function sleep(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

/**
 * @param {Boolean} value
 */
function forceHideCaptions(value) {
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
function getRemoveFavoriteButtonFromThumb(thumb) {
  return thumb.querySelector(".remove-favorite-button");
}

/**
 * @param {HTMLElement} thumb
 * @returns {String | null}
 */
function getAddFavoriteButtonFromThumb(thumb) {
  return thumb.querySelector(".add-favorite-button");
}

/**
 * @param {HTMLImageElement} image
 */
function removeTitleFromImage(image) {
  if (image.hasAttribute("title")) {
    image.setAttribute("tags", image.title);
    image.removeAttribute("title");
  }
}

/**
 * @param {HTMLImageElement} image
 * @returns {HTMLElement}
 */
function getThumbFromImage(image) {
  return image.parentNode.parentNode;
}

/**
 * @param {HTMLElement} thumb
 * @returns {HTMLImageElement}
 */
function getImageFromThumb(thumb) {
  return thumb.children[0].children[0];
}

/**
 * @returns {HTMLCollectionOf.<HTMLElement>}
 */
function getAllThumbs() {
  const className = onSearchPage() ? "thumb" : "thumb-node";
  return document.getElementsByClassName(className);
}

/**
 * @returns {HTMLElement[]}
 */
function getAllVisibleThumbs() {
  return Array.from(getAllThumbs())
    .filter(thumbNodeElement => thumbNodeElement.style.display !== "none");
}

/**
 * @param {HTMLElement} thumb
 * @returns {String}
 */
function getOriginalImageURLFromThumb(thumb) {
  return getOriginalImageURL(getImageFromThumb(thumb).src);
}

/**
 * @param {String} thumbURL
 * @returns {String}
 */
function getOriginalImageURL(thumbURL) {
  return thumbURL
    .replace("thumbnails", "/images")
    .replace("thumbnail_", "")
    .replace("us.rule34", "rule34");
}

/**
 * @param {String} imageURL
 * @returns {String}
 */
function getExtensionFromImageURL(imageURL) {
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
function getThumbURL(originalImageURL) {
  return originalImageURL
    .replace(/\/images\/\/(\d+)\//, "thumbnails/$1/thumbnail_")
    .replace(/(?:gif|jpeg|png)/, "jpg")
    .replace("us.rule34", "rule34");
}

/**
 * @param {HTMLElement | ThumbNode} thumb
 * @returns {Set.<String>}
 */
function getTagsFromThumb(thumb) {
  if (onSearchPage()) {
    const image = getImageFromThumb(thumb);
    const tags = image.hasAttribute("tags") ? image.getAttribute("tags") : image.title;
    return convertToTagSet(tags);
  }
  const thumbNode = ThumbNode.allThumbNodes.get(thumb.id);
  return thumbNode === undefined ? new Set() : new Set(thumbNode.tagSet);
}

/**
 * @param {String} tag
 * @param {Set.<String>} tags
 * @returns
 */
function includesTag(tag, tags) {
  return tags.has(tag);
}

/**
 * @param {HTMLElement | ThumbNode} thumb
 * @returns {Boolean}
 */
function isVideo(thumb) {
  const tags = getTagsFromThumb(thumb);
  return tags.has("video") || tags.has("mp4");
}

/**
 * @param {HTMLElement | ThumbNode} thumb
 * @returns {Boolean}
 */
function isGif(thumb) {
  if (isVideo(thumb)) {
    return false;
  }
  const tags = getTagsFromThumb(thumb);
  return tags.has("gif") || tags.has("animated") || tags.has("animated_png") || hasGifAttribute(thumb);
}

/**
 * @param {HTMLElement | ThumbNode} thumb
 * @returns {Boolean}
 */
function hasGifAttribute(thumb) {
  if (thumb instanceof ThumbNode) {
    return false;
  }
  return getImageFromThumb(thumb).hasAttribute("gif");
}

/**
 * @param {HTMLElement | ThumbNode} thumb
 * @returns {Boolean}
 */
function isImage(thumb) {
  return !isVideo(thumb) && !isGif(thumb);
}

/**
 * @param {any[]} array
 */
function shuffleArray(array) {
  let maxIndex = array.length;
  let randomIndex;

  while (maxIndex > 0) {
    randomIndex = Math.floor(Math.random() * maxIndex);
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
function negateTags(tags) {
  return tags.replace(/(\S+)/g, "-$1");
}

/**
 * @param {HTMLInputElement | HTMLTextAreaElement} input
 * @returns {HTMLDivElement | null}
 */
function getAwesompleteFromInput(input) {
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
function awesompleteIsVisible(input) {
  const awesomplete = getAwesompleteFromInput(input);

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
function awesompleteIsUnselected(input) {
  const awesomplete = getAwesompleteFromInput(input);

  if (awesomplete === null) {
    return true;
  }

  if (!awesompleteIsVisible(input)) {
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
function clearAwesompleteSelection(input) {
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
function addOptionToFavoritesPage(optionId, optionText, optionTitle, optionIsChecked, onOptionChanged, optionIsVisible, optionHint = "") {
  const favoritesPageOptions = document.getElementById("favorite-options");
  const checkboxId = `${optionId}-checkbox`;

  if (favoritesPageOptions === null) {
    return null;
  }

  if (optionIsVisible === undefined || optionIsVisible) {
    optionIsVisible = "block";
  } else {
    optionIsVisible = "none";
  }
  favoritesPageOptions.insertAdjacentHTML("beforeend", `
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
function onSearchPage() {
  if (!FLAGS.onSearchPage.set) {
    FLAGS.onSearchPage.value = location.href.includes("page=post&s=list");
    FLAGS.onSearchPage.set = true;
  }
  return FLAGS.onSearchPage.value;
}

/**
 * @returns {Boolean}
 */
function onFavoritesPage() {
  if (!FLAGS.onFavoritesPage.set) {
    FLAGS.onFavoritesPage.value = location.href.includes("page=favorites");
    FLAGS.onFavoritesPage.set = true;
  }
  return FLAGS.onFavoritesPage.value;
}

/**
 * @returns {Boolean}
 */
function onPostPage() {
  if (!FLAGS.onPostPage.set) {
    FLAGS.onPostPage.value = location.href.includes("page=post&s=view");
    FLAGS.onPostPage.set = true;
  }
  return FLAGS.onPostPage.value;
}

/**
 * @returns {String[]}
 */
function getIdsToDeleteOnReload() {
  return JSON.parse(localStorage.getItem(IDS_TO_REMOVE_ON_RELOAD_KEY)) || [];
}

/**
 * @param {String} postId
 */
function setIdToBeRemovedOnReload(postId) {
  const idsToRemoveOnReload = getIdsToDeleteOnReload();

  idsToRemoveOnReload.push(postId);
  localStorage.setItem(IDS_TO_REMOVE_ON_RELOAD_KEY, JSON.stringify(idsToRemoveOnReload));
}

function clearIdsToDeleteOnReload() {
  localStorage.removeItem(IDS_TO_REMOVE_ON_RELOAD_KEY);
}

/**
 * @param {String} html
 * @param {String} id
 */
function injectStyleHTML(html, id) {
  const style = document.createElement("style");

  style.textContent = html.replace("<style>", "").replace("</style>", "");

  if (id !== undefined) {
    const oldStyle = document.getElementById(id);

    if (oldStyle !== null) {
      oldStyle.remove();
    }
    style.id = id;
  }
  document.head.appendChild(style);
}

function getTagDistribution() {
  const images = Array.from(getAllThumbs()).map(thumb => getImageFromThumb(thumb));
  const tagOccurrences = {};

  images.forEach((image) => {
    const tags = image.getAttribute("tags").replace(/ \d+$/, "").split(" ");

    tags.forEach((tag) => {
      const occurrences = tagOccurrences[tag];

      tagOccurrences[tag] = occurrences === undefined ? 1 : occurrences + 1;
    });
  });
  const sortedTagOccurrences = sortObjectByValues(tagOccurrences);
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
function sortObjectByValues(obj) {
  const sortable = Object.entries(obj);

  sortable.sort((a, b) => b[1] - a[1]);
  return sortable.map(item => ({
    key: item[0],
    value: item[1]
  }));
}

function injectCommonStyles() {
  injectStyleHTML(utilitiesHTML, "utilities-common-styles");

  injectStyleHTML(STYLES.thumbHoverOutline, "thumb-hover-outlines");

  setTimeout(() => {
    if (onSearchPage()) {
      removeInlineImgStyles();
    }
    configureVideoOutlines();
  }, 100);
}

/**
 * @param {Boolean} value
 */
function toggleFancyImageHovering(value) {
  if (onMobileDevice() || onSearchPage()) {
    value = false;
  }

  if (!value) {
    const style = document.getElementById("fancy-image-hovering");

    if (style !== null) {
      style.remove();
    }
    return;
  }
  injectStyleHTML(`
    #content {
      padding: 40px 40px 30px !important;
      grid-gap: 2.5em !important;
    }

    .thumb-node,
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
          transform: scale(1.1, 1.1);
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
    `, "fancy-image-hovering");
}

function configureVideoOutlines() {
  const size = onMobileDevice() ? 2 : 3;

  injectStyleHTML(`
    .thumb-node, .thumb {

      >a,
      >div {
        &:has(img.video) {
            outline: ${size}px solid blue;
        }

        &:has(img.gif) {
          outline: 2px solid hotpink;
        }

      }
    }
    `, "video-border");
}

function removeInlineImgStyles() {
  for (const image of document.getElementsByTagName("img")) {
    image.removeAttribute("style");
  }
}

function setTheme() {
  setTimeout(() => {
    if (usingDarkTheme()) {
      for (const element of document.querySelectorAll(".light-green-gradient")) {
        element.classList.remove("light-green-gradient");
        element.classList.add("dark-green-gradient");

        injectStyleHTML(`
          input[type=number] {
            background-color: #303030;
            color: white;
          }
          `, "dark-theme-number-input");
        injectStyleHTML(`
            #favorites-pagination-container {
              >button {
                border: 1px solid white !important;
                color: white !important;
              }
            }
          `, "pagination-style");
        injectStyleHTML(`
            .number {
              background-color: #303030;

              >hold-button,
              button {
                color: white;
            }`);
      }
    }
  }, 10);
}

/**
 * @param {String} eventName
 * @param {Number} delay
 * @returns
 */
function dispatchEventWithDelay(eventName, delay) {
  if (delay === undefined) {
    dispatchEvent(new Event(eventName));
    return;
  }
  setTimeout(() => {
    dispatchEvent(new Event(eventName));
  }, delay);
}

/**
 * @param {String} postId
 * @returns
 */
function getThumbById(postId) {
  return document.getElementById(postId);
}

/**
 * @param {String} content
 * @returns {Blob | MediaSource}
 */
function getWorkerURL(content) {
  return URL.createObjectURL(new Blob([content], {
    type: "text/javascript"
  }));
}

function initializeUtilities() {
  if (onPostPage()) {
    return;
  }
  const enableOnSearchPages = getPreference("enableOnSearchPages", false) && getPerformanceProfile() === 0;

  if (!enableOnSearchPages && onSearchPage()) {
    throw new Error("Disabled on search pages");
  }
  removeUnusedScripts();
  injectCommonStyles();
  setupCustomWebComponents();
  toggleFancyImageHovering(true);
  setTheme();
  removeBlacklistedThumbs();
  prefetchAdjacentSearchPages();
}

function prefetchAdjacentSearchPages() {
  if (!onSearchPage()) {
    return;
  }
  const id = "search-page-prefetch";
  const alreadyPrefetched = document.getElementById(id) !== null;

  if (alreadyPrefetched) {
    return;
  }
  const container = document.createElement("div");
  const currentPage = document.getElementById("paginator").children[0].querySelector("b");

  for (const sibling of [currentPage.previousElementSibling, currentPage.nextElementSibling]) {
    if (sibling !== null && sibling.tagName.toLowerCase() === "a") {
      container.appendChild(createPrefetchLink(sibling.href));
    }
  }
  container.id = "search-page-prefetch";
  document.head.appendChild(container);
}

/**
 * @param {String} url
 * @returns {HTMLLinkElement}
 */
function createPrefetchLink(url) {
  const link = document.createElement("link");

  link.rel = "prefetch";
  link.href = url;
  return link;

}

function removeBlacklistedThumbs() {
  if (!onSearchPage()) {
    return;
  }
  const blacklistedThumbs = Array.from(document.getElementsByClassName("blacklisted-image"));

  for (const thumb of blacklistedThumbs) {
    thumb.remove();
  }
}

/**
 * @returns {String}
 */
function getTagBlacklist() {
  let tags = getCookie("tag_blacklist", "");

  for (let i = 0; i < 3; i += 1) {
    tags = decodeURIComponent(tags).replace(/(?:^| )-/, "");
  }
  return tags;
}

/**
 * @returns {Boolean}
 */
function usingCaptions() {
  const result = document.getElementById("captionList") !== null;
  return result;
}

/**
 * @returns {Boolean}
 */
function usingRenderer() {
  if (!FLAGS.usingRenderer.set) {
    FLAGS.usingRenderer.value = document.getElementById("original-content-container") !== null;
    FLAGS.usingRenderer.set = true;
  }
  return FLAGS.usingRenderer.value;
}

/**
 * @param {String} word
 * @returns {String}
 */
function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * @param {Number} number
 * @returns {Number}
 */
function roundToTwoDecimalPlaces(number) {
  return Math.round((number + Number.EPSILON) * 100) / 100;
}

/**
 * @returns {Boolean}
 */
function usingDarkTheme() {
  return getCookie("theme", "") === "dark";
}

/**
 * @param {Event} event
 * @returns {Boolean}
 */
function enteredOverCaptionTag(event) {
  return event.relatedTarget !== null && event.relatedTarget.classList.contains("caption-tag");
}

/**
 * @param {String[]} postId
 * @param {Boolean} doAnimation
 */
function scrollToThumb(postId, doAnimation = true) {
  const element = document.getElementById(postId);
  const elementIsNotAThumb = element === null || (!element.classList.contains("thumb") && !element.classList.contains("thumb-node"));

  if (elementIsNotAThumb) {
    if (postId === "") {
      // alert("Please enter a post ID");
    } else {
      // alert(`Favorite with post ID ${postId} not found`);
    }
    return;
  }
  const rect = element.getBoundingClientRect();
  const favoritesHeader = document.getElementById("favorites-top-bar");
  const favoritesSearchHeight = favoritesHeader === null ? 0 : favoritesHeader.getBoundingClientRect().height;

  window.scroll({
    top: rect.top + window.scrollY + (rect.height / 2) - (window.innerHeight / 2) - (favoritesSearchHeight / 2),
    behavior: "smooth"
  });

  if (!doAnimation) {
    return;
  }
  const image = getImageFromThumb(element);

  image.classList.add("found");
  setTimeout(() => {
    image.classList.remove("found");
  }, 2000);
}

/**
 * @param {HTMLElement} thumb
 */
function assignContentType(thumb) {
  const image = getImageFromThumb(thumb);
  const tagAttribute = image.hasAttribute("tags") ? "tags" : "title";
  const tags = image.getAttribute(tagAttribute);

  image.classList.add(getContentType(tags));
}

/**
 * @param {String} tags
 * @returns {String}
 */
function getContentType(tags) {
  tags += " ";
  const hasVideoTag = (/(?:^|\s)video(?:$|\s)/).test(tags);
  const hasAnimatedTag = (/(?:^|\s)animated(?:$|\s)/).test(tags);
  const isAnimated = hasAnimatedTag || hasVideoTag;
  const isAGif = hasAnimatedTag && !hasVideoTag;
  return isAGif ? "gif" : isAnimated ? "video" : "image";
}

function correctMisspelledTags(tags) {
  if ((/vide(?:\s|$)/).test(tags)) {
    tags += " video";
  }
  return tags;
}

/**
 * @param {String} searchQuery
 * @returns {{orGroups: String[][], remainingSearchTags: String[]}}
 */
function extractTagGroups(searchQuery) {
  searchQuery = searchQuery.toLowerCase();
  const orRegex = /(?:^|\s+)\(\s+((?:\S+)(?:(?:\s+~\s+)\S+)*)\s+\)/g;
  const orGroups = Array.from(removeExtraWhiteSpace(searchQuery)
    .matchAll(orRegex))
    .map((orGroup) => orGroup[1].split(" ~ "));
  const remainingSearchTags = removeExtraWhiteSpace(searchQuery
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
function removeExtraWhiteSpace(string) {
  return string.trim().replace(/\s\s+/g, " ");
}

/**
 * @param {String} string
 * @param {String} replacement
 * @returns {String}
 */
function replaceLineBreaks(string, replacement = "") {
  return string.replace(/(\r\n|\n|\r)/gm, replacement);
}

/**
 *
 * @param {HTMLImageElement} image
 * @returns {Boolean}
 */
function imageIsLoaded(image) {
  return image.complete || image.naturalWidth !== 0;
}

/**
 * @returns {Boolean}
 */
function usingFirefox() {
  if (!FLAGS.usingFirefox.set) {
    FLAGS.usingFirefox.value = navigator.userAgent.toLowerCase().includes("firefox");
    FLAGS.usingFirefox.set = true;
  }
  return FLAGS.usingFirefox.value;
}

/**
 * @returns  {Boolean}
 */
function onMobileDevice() {
  if (!FLAGS.onMobileDevice.set) {
    FLAGS.onMobileDevice.value = (/iPhone|iPad|iPod|Android/i).test(navigator.userAgent);
    FLAGS.onMobileDevice.set = true;
  }
  return FLAGS.onMobileDevice.value;
}

/**
 * @returns {Number}
 */
function getPerformanceProfile() {
  return parseInt(getPreference("performanceProfile", 0));
}

/**
 * @param {String} tagName
 * @returns {Promise.<Boolean>}
 */
function isOfficialTag(tagName) {
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
function openSearchPage(searchQuery) {
  window.open(`https://rule34.xxx/index.php?page=post&s=list&tags=${encodeURIComponent(searchQuery)}`);
}

/**
 * @param {Map} map
 * @returns {Object}
 */
function mapToObject(map) {
  return Array.from(map).reduce((object, [key, value]) => {
    object[key] = value;
    return object;
  }, {});
}

/**
 * @param {Object} object
 * @returns {Map}
 */
function objectToMap(object) {
  return new Map(Object.entries(object));
}

/**
 * @param {String} string
 * @returns {Boolean}
 */
function isNumber(string) {
  return (/^\d+$/).test(string);
}

/**
 * @param {String} id
 * @returns {Promise.<Number>}
 */
function addFavorite(id) {
  fetch(`https://rule34.xxx/index.php?page=post&s=vote&id=${id}&type=up`);
  return fetch(`https://rule34.xxx/public/addfav.php?id=${id}`)
    .then((response) => {
      return response.text();
    })
    .then((html) => {
      return parseInt(html);
    })
    .catch(() => {
      return ADDED_FAVORITE_STATUS.error;
    });
}

/**
 * @param {String} id
 */
function removeFavorite(id) {
  setIdToBeRemovedOnReload(id);
  fetch(`https://rule34.xxx/index.php?page=favorites&s=delete&id=${id}`);
}

/**
 * @param {HTMLInputElement | HTMLTextAreaElement} input
 * @param {String} suggestion
 */
function insertSuggestion(input, suggestion) {
  const cursorAtEnd = input.selectionStart === input.value.length;
  const firstHalf = input.value.slice(0, input.selectionStart);
  const secondHalf = input.value.slice(input.selectionStart);
  const firstHalfWithPrefixRemoved = firstHalf.replace(/(\s?)(-?)\S+$/, "$1$2");
  const combinedHalves = removeExtraWhiteSpace(`${firstHalfWithPrefixRemoved}${suggestion} ${secondHalf}`);
  const result = cursorAtEnd ? `${combinedHalves} ` : combinedHalves;
  const selectionStart = firstHalfWithPrefixRemoved.length + suggestion.length + 1;

  input.value = result;
  input.selectionStart = selectionStart;
  input.selectionEnd = selectionStart;
}

/**
 * @param {HTMLInputElement | HTMLTextAreaElement} input
 */
function hideAwesomplete(input) {
  getAwesompleteFromInput(input).querySelector("ul").setAttribute("hidden", "");
}

/**
 * @param {String} svg
 * @param {Number} duration
 */
function showFullscreenIcon(svg, duration = 500) {
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
function createObjectURLFromSvg(svg) {
  const blob = new Blob([svg], {
    type: "image/svg+xml"
  });
  return URL.createObjectURL(blob);
}

/**
 * @param {HTMLElement} element
 * @returns {Boolean}
 */
function isTypeableInput(element) {
  const tagName = element.tagName.toLowerCase();

  if (tagName === "textarea") {
    return true;
  }

  if (tagName === "input") {
    return TYPEABLE_INPUTS.has(element.getAttribute("type"));
  }
  return false;
}

/**
 * @param {Set} a
 * @param {Set} b
 * @returns {Set}
 */
function union(a, b) {
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
function difference(a, b) {
  const c = new Set(a);

  for (const element of b.values()) {
    c.delete(element);
  }
  return c;
}

function removeUnusedScripts() {
  if (!onFavoritesPage()) {
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
function convertToTagSet(tagString) {
  tagString = removeExtraWhiteSpace(tagString);

  if (tagString === "") {
    return new Set();
  }
  return new Set(tagString.split(" ").sort());
}

/**
 * @param {Set.<String>} tagSet
 * @returns {String}
 */
function convertToTagString(tagSet) {
  if (tagSet.size === 0) {
    return "";
  }
  return Array.from(tagSet).join(" ");
}

/**
 * @returns {String | null}
 */
function getPostPageId() {
  const match = (/id=(\d+)/).exec(window.location.href);
  return match === null ? null : match[1];
}

/**
 * @param {String} searchTag
 * @param {String[]} tags
 * @returns {Boolean}
 */
function tagsMatchWildcardSearchTag(searchTag, tags) {
  try {
    const wildcardRegex = new RegExp(`^${searchTag.replaceAll(/\*/g, ".*")}$`);
    return tags.some(tag => wildcardRegex.test(tag));
  } catch {
    return false;
  }
}

function setupCustomWebComponents() {
  setupCustomNumberWebComponents();
}

async function setupCustomNumberWebComponents() {
  await sleep(400);
  const numberComponents = Array.from(document.querySelectorAll(".number"));

  for (const element of numberComponents) {
    const numberComponent = new NumberComponent(element);
  }
}

/**
 * @param {Number} milliseconds
 * @returns {Number}
 */
function millisecondsToSeconds(milliseconds) {
  return roundToTwoDecimalPlaces(milliseconds / 1000);
}

initializeUtilities();
