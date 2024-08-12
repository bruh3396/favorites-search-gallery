const IDS_TO_REMOVE_ON_RELOAD_KEY = "recentlyRemovedIds";
const TAG_BLACKLIST = getTagBlacklist();
const CURSOR_POSITION = {
  X: 0,
  Y: 0
};

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
  return getUserId() === getFavoritesPageId();
}

/**
 * @param {String} url
 * @param {Function} callback
 * @param {Number} delayIncrement
 * @param {Number} delay
 */
function requestPageInformation(url, callback, delay = 0) {
  const httpRequest = new XMLHttpRequest();
  const delayIncrement = 500;

  httpRequest.open("GET", url, true);
  httpRequest.onreadystatechange = () => {
    if (httpRequest.readyState === 4) {
      if (httpRequest.status === 503) {
        requestPageInformation(url, callback, delay + delayIncrement);
      }
      return callback(httpRequest.responseText);
    }
    return null;
  };
  setTimeout(() => {
    httpRequest.send();
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
 * @param {Boolean} removeButtonsAreVisible
 */
function hideCaptionsWhenRemoveButtonsAreVisible(removeButtonsAreVisible) {
  for (const caption of document.getElementsByClassName("caption")) {
    if (removeButtonsAreVisible) {
      caption.classList.add("remove");
    } else {
      caption.classList.remove("remove");
    }
  }
}

function updateVisibilityOfAllRemoveButtons() {
  const removeButtonCheckbox = document.getElementById("show-remove-buttons");

  if (removeButtonCheckbox === null) {
    return;
  }
  const removeButtonsAreVisible = removeButtonCheckbox.checked;
  const visibility = removeButtonsAreVisible ? "visible" : "hidden";

  injectStyleHTML(`
      .remove-button {
        visibility: ${visibility} !important;
      }
    `, "remove-button-visibility");
  hideCaptionsWhenRemoveButtonsAreVisible(removeButtonsAreVisible);
}

/**
 * @param {HTMLElement} thumb
 * @returns {String | null}
 */
function getRemoveLinkFromThumb(thumb) {
  return thumb.querySelector(".remove-button");
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
 * @returns {HTMLCollectionOf.<Element>}
 */
function getAllThumbNodeElements() {
  const className = onPostPage() ? "thumb" : "thumb-node";
  return document.getElementsByClassName(className);
}

/**
 * @returns {HTMLCollectionOf.<Element>}
 */
function getAllVisibleThumbs() {
  return Array.from(getAllThumbNodeElements())
    .filter(thumbNodeElement => thumbNodeElement.style.display !== "none");
}

/**
 * @param {HTMLElement} thumb
 * @returns {String}
 */
function getOriginalContentURL(thumb) {
  return getImageFromThumb(thumb).src
    .replace("thumbnails", "/images")
    .replace("thumbnail_", "")
    .replace("us.rule34", "rule34");
}

/**
 * @param {HTMLElement} thumb
 * @returns {String}
 */
function getTagsFromThumb(thumb) {
  const image = getImageFromThumb(thumb);
  return image.hasAttribute("tags") ? image.getAttribute("tags") : image.title;
}

/**
 * @param {String} tag
 * @param {String} tags
 * @returns
 */
function includesTag(tag, tags) {
  return tags.includes(` ${tag} `) || tags.endsWith(` ${tag}`) || tags.startsWith(`${tag} `);
}

/**
 * @param {HTMLElement} thumb
 * @returns {Boolean}
 */
function isVideo(thumb) {
  if (thumb.classList.contains("video")) {
    return true;
  }
  const tags = getTagsFromThumb(thumb);
  return includesTag("video", tags) || includesTag("mp4", tags);
}

/**
 * @param {HTMLElement} thumb
 * @returns {Boolean}
 */
function isGif(thumb) {
  if (isVideo(thumb)) {
    return false;
  }
  const tags = getTagsFromThumb(thumb);
  return includesTag("gif", tags) || includesTag("animated", tags) || includesTag("animated_png", tags) || getImageFromThumb(thumb).hasAttribute("gif");
}

/**
 * @param {HTMLElement} thumb
 * @returns {Boolean}
 */
function isImage(thumb) {
  return !isVideo(thumb) && !isGif(thumb);
}

/**
 * @param {String} svgContent
 * @param {String} id
 * @param {Number} newWidth
 * @param {Number} newHeight
 * @param {String} position
 * @param {Number} duration
 */
function showOverlayedIcon(svgContent, id, newWidth, newHeight, position = "center", duration = 500) {
  const svgDocument = new DOMParser().parseFromString(svgContent, "image/svg+xml");
  const svgElement = svgDocument.documentElement;
  const zoomLevel = getZoomLevel();

  svgElement.setAttribute("width", Math.round(newWidth / zoomLevel));
  svgElement.setAttribute("height", Math.round(newHeight / zoomLevel));

  if (document.getElementById(id) !== null) {
    return;
  }
  const svgOverlay = document.createElement("div");

  svgOverlay.id = id;

  switch (position) {
    case "center":
      svgOverlay.style.cssText = "position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 9999;";
      break;

    case "bottom-left":
      svgOverlay.style.cssText = "position: fixed; bottom: 0; left: 0; z-index: 9999;";
      break;

    case "bottom-right":
      svgOverlay.style.cssText = "position: fixed; bottom: 0; right: 0; z-index: 9999;";
      break;

    case "top-left":
      svgOverlay.style.cssText = "position: fixed; top: 0; left: 0; z-index: 9999;";
      break;

    case "top-right":
      svgOverlay.style.cssText = "position: fixed; top: 0; right: 0; z-index: 9999;";
      break;

    default:
      svgOverlay.style.cssText = "position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 9999;";
  }
  svgOverlay.style.cssText += " pointer-events:none;";
  svgOverlay.innerHTML = new XMLSerializer().serializeToString(svgElement);
  // document.body.appendChild(svgOverlay);
  setTimeout(() => {
    svgOverlay.remove();
  }, duration);
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
 * @returns {Number}
 */
function getZoomLevel() {
  const zoomLevel = window.outerWidth / window.innerWidth;
  return zoomLevel;
}

/**
 * @param {String} tags
 * @returns {String}
 */
function negateTags(tags) {
  return tags.replace(/(\S+)/g, "-$1");
}

/**
 * @param {HTMLInputElement} input
 * @returns {Boolean}
 */
function awesompleteIsHidden(input) {
  if (input.parentElement.className === "awesomplete") {
    return input.parentElement.children[1].hasAttribute("hidden");
  }
  return false;
}

function awesompleteIsUnselected(input) {
  const awesomplete = input.parentElement;

  if (awesomplete === null) {
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
 * @param {HTMLInputElement} input
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

function trackCursorPosition() {
  document.addEventListener("mousemove", (event) => {
    CURSOR_POSITION.X = event.clientX;
    CURSOR_POSITION.Y = event.clientY;
  });
}

/**
 * @param {String} optionId
 * @param {String} optionText
 * @param {String} optionTitle
 * @param {Boolean} optionIsChecked
 * @param {Function} onOptionChanged
 * @param {Boolean} optionIsVisible
 * @returns {HTMLElement | null}
 */
function addOptionToFavoritesPage(optionId, optionText, optionTitle, optionIsChecked, onOptionChanged, optionIsVisible) {
  const favoritesPageOptions = document.getElementById("favorite-options");
  const checkboxId = `${optionId}Checkbox`;

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
      <input id="${checkboxId}" type="checkbox" > ${optionText}</label>
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
function onPostPage() {
  return location.href.includes("page=post");
}

/**
 * @returns {String[]}
 */
function getIdsToRemoveOnReload() {
  return JSON.parse(localStorage.getItem(IDS_TO_REMOVE_ON_RELOAD_KEY)) || [];
}

function clearRecentlyRemovedIds() {
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

/**
 * @param {HTMLElement} content
 */
function populateMetadata(content) {
  const scripts = Array.from(content.getElementsByTagName("script"));

  scripts.shift();
  scripts.forEach((script) => {
    // eval(script.innerHTML);
  });
}

/**
 * @param {HTMLElement} image
 */
function addMetaDataToThumb(image) {
  const thumb = getThumbFromImage(image);
  const metadata = posts[thumb.id];

  thumb.setAttribute("rating", metadata.rating);
  thumb.setAttribute("score", metadata.score);
}

/**
 * @param {HTMLElement} thumb
 * @param {String} appropriateRating
 * @returns {Boolean}
 */
function hasAppropriateRating(thumb, appropriateRating) {
  const ratings = {
    "Safe": 0,
    "Questionable": 1,
    "Explicit": 2
  };
  return ratings[thumb.getAttribute("rating")] <= ratings[appropriateRating];
}

/**
 * @param {String} appropriateRating
 */
function removeInappropriatelyRatedContent(appropriateRating) {
  Array.from(getAllThumbNodeElements()).forEach((thumb) => {
    if (!hasAppropriateRating(thumb, appropriateRating)) {
      // setThumbDisplay(thumb, false);
    }
  });
}

function getTagDistribution() {
  const images = Array.from(getAllThumbNodeElements()).map(thumb => getImageFromThumb(thumb));
  const tagOccurences = {};

  images.forEach((image) => {
    const tags = image.getAttribute("tags").replace(/ \d+$/, "").split(" ");

    tags.forEach((tag) => {
      const occurences = tagOccurences[tag];

      tagOccurences[tag] = occurences === undefined ? 1 : occurences + 1;
    });
  });
  const sortedTagOccurences = sortObjectByValues(tagOccurences);
  let result = "";
  let i = 0;
  const max = 50;

  sortedTagOccurences.forEach(item => {
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
  injectStyleHTML(`
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
  `, "lightDarkTheme");
  setTimeout(() => {
    if (onPostPage()) {
      removeInlineImgStyles();
    }
    configureVideoOutlines();
  }, 100);
}

function configureVideoOutlines() {
  injectStyleHTML("img.video {outline: 2px solid blue;}", "video-border");
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
function getThumbByPostId(postId) {
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
  exitIfUsingFirefox();
  injectCommonStyles();
  trackCursorPosition();
  setTheme();
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
 * @returns {HTMLElement | null}
 */
function getThumbUnderCursor() {
  const elementUnderCursor = document.elementFromPoint(CURSOR_POSITION.X, CURSOR_POSITION.Y);

  if (elementUnderCursor !== undefined && elementUnderCursor !== null && elementUnderCursor.nodeName.toLowerCase() === "img") {
    return getThumbFromImage(elementUnderCursor);
  }
  return null;
}

/**
 * @returns {Boolean}
 */
function hoveringOverThumb() {
  return getThumbUnderCursor() !== null;
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
  return document.getElementById("original-content-container") !== null;
}

/**
 * @returns {Boolean}
 */
function usingFirefox() {
  return navigator.userAgent.toLowerCase().includes("firefox");
}

function getThumbUnderCursorOnLoad() {
  const thumbNodeElement = getThumbUnderCursor();

  dispatchEvent(new CustomEvent("thumbUnderCursorOnLoad", {
    detail: thumbNodeElement
  }));
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

function exitIfUsingFirefox() {
  if (usingFirefox()) {
    alert("Favorites Search/Viewer:\nCurrently not compatible with Firefox, try Chrome or Edge.");
  }
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
      alert("Please enter a post ID");
    } else {
      alert(`Favorite with post ID ${postId} not found`);
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
  const isAnimated = tags.includes("animated ") || tags.includes("video ");
  const isAGif = isAnimated && !tags.includes("video ");
  return isAGif ? "gif" : isAnimated ? "video" : "image";
}

/**
 * @param {String} searchQuery
 * @returns {{orGroups: String[][], remainingSearchTags: String[]}}
 */
function extractTagGroups(searchQuery) {
  searchQuery = searchQuery.toLowerCase();
  const orRegex = /\( (.*?) \)/g;
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
  return string.trim().replace(/\s+/g, " ");
}

async function collectTagTypes() {
  const tagTypes = {
    0: "general",
    1: "artist",
    2: "metadata",
    3: "copyright",
    4: "character"
  };
  const tags = {};
  const parser = new DOMParser();

  for (let i = 0; i < 10; i += 1) {
    apiURL = `https://api.rule34.xxx/index.php?page=dapi&s=tag&q=index&limit=1000&pid=${i}`;
    fetch(apiURL)
    .then((response) => {
      return response.text();
    })
    .then((html) => {
      const dom = parser.parseFromString(html, "text/xml");
      const xmlTags = dom.getElementsByTagName("tag");

      for (const xmlTag of xmlTags) {
        tags[xmlTag.getAttribute("name")] = tagTypes[parseInt(xmlTag.getAttribute("type"))];
      }
    });
    await sleep(10);
  }
}

initializeUtilities();
