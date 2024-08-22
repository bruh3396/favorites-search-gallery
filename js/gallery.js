const galleryHTML = `<style>
  body {
    width: 99.5vw;
    overflow-x: hidden;
  }

  /* .thumb,
  .thumb-node {
    &.loaded {

      .image {
        outline: 2px solid transparent;
        animation: outlineGlow 1s forwards;
        opacity: 1;
      }


    }

    >div>canvas {
        position: absolute;
        top: 0;
        left: 0;
        pointer-events: none;
        z-index: 1;
        visibility: hidden;
      }

    .image {
      opacity: 0.4;
      transition: transform 0.1s ease-in-out, opacity 0.5s ease;
    }

  }

  .image.loaded {
    animation: outlineGlow 1s forwards;
    opacity: 1;
  }

  @keyframes outlineGlow {
    0% {
      outline-color: transparent;
    }

    100% {
      outline-color: turquoise;
    }
  }

  #fullscreen-canvas {
    opacity: .05;
  } */

  /* .image {
    outline: 2px solid slategrey;
  } */

  .gif {
    outline: 2px solid hotpink;
  }

  .focused {
    transition: none;
    float: left;
    overflow: hidden;
    z-index: 9997;
    pointer-events: none;
    position: fixed;
    height: 100vh;
    margin: 0;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  #fullscreen-canvas {
    float: left;
    overflow: hidden;
    z-index: 9998;
    pointer-events: none;
    position: fixed;
    height: 100vh;
    margin: 0;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .thumb-node.selected,
  .thumb.selected {

    >a>img,
    >span>img,
    >div>img {
      outline: 3px solid yellow !important;
    }
  }

  a.hide {
    cursor: default;
  }

  option {
    font-size: 15px;
  }

  #resolution-dropdown {
    text-align: center;
    width: 160px;
    height: 25px;
    cursor: pointer;
  }

  .thumb-node,
  .thumb {

    >div,
    >a {
      >canvas {
        position: absolute;
        top: 0;
        left: 0;
        pointer-events: none;
        z-index: 1;
      }
    }
  }
</style>`;/* eslint-disable no-useless-escape */

class Gallery {
  static clickCodes = {
    leftClick: 0,
    middleClick: 1
  };
  static galleryDirections = {
    d: "d",
    a: "a",
    right: "ArrowRight",
    left: "ArrowLeft"
  };
  static galleryTraversalCooldown = {
    timeout: null,
    waitTime: 200,
    skipCooldown: false,
    get ready() {
      if (this.skipCooldown) {
        return true;
      }

      if (this.timeout === null) {
        this.timeout = setTimeout(() => {
          this.timeout = null;
        }, this.waitTime);
        return true;
      }
      return false;
    }
  };
  static icons = {
    openEye: "<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\" stroke-width=\"1.5\" stroke=\"white\" class=\"w-6 h-6\"> <path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z\" /><path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M15 12a3 3 0 11-6 0 3 3 0 016 0z\" /></svg>",
    closedEye: "<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\" stroke-width=\"1.5\" stroke=\"white\" class=\"w-6 h-6\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88\" /></svg>",
    openLock: "<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\" stroke-width=\"1.5\" stroke=\"white\" class=\"w-6 h-6\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z\" /></svg>",
    closedLock: "<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\" stroke-width=\"1.5\" stroke=\"white\" class=\"w-6 h-6\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z\" /></svg>"
  };
  static preferences = {
    showOnHover: "showImagesWhenHovering",
    backgroundOpacity: "galleryBackgroundOpacity",
    resolution: "galleryResolution",
    enlargeOnClick: "enlargeOnClick"
  };
  static localStorageKeys = {
    imageExtensions: "imageExtensions"
  };
  static webWorkers = {
    imageFetcher:
      `
/* eslint-disable prefer-template */
const RETRY_DELAY_INCREMENT = 100;
let retryDelay = 0;

/**
 * @param {String} imageURL
 * @param {String} extension
 * @param {String} postId
 * @param {Number} thumbIndex
 */
async function getImageBitmap(imageURL, extension, postId, thumbIndex) {
  const extensionAlreadyFound = extension !== null && extension !== undefined;
  let newExtension = extension;

  if (extensionAlreadyFound) {
    imageURL = imageURL.replace("jpg", extension);
  } else {
    imageURL = await getOriginalImageURL(postId);
    newExtension = getExtensionFromImageURL(imageURL);
  }
  const result = await fetchImage(imageURL);

  if (result) {
    const imageBitmap = await createImageBitmap(result.blob);

    setTimeout(() => {
      postMessage({
        newExtension,
        postId,
        thumbIndex,
        extensionAlreadyFound,
        imageBitmap
      });
    }, 50);
  }
}

/**
 * @param {Number} milliseconds
 * @returns {Promise}
 */
function sleep(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

/**
 * @param {String} postId
 * @returns {String}
 */
function getOriginalImageURLFromPostPage(postId) {
  const postPageURL = "https://rule34.xxx/index.php?page=post&s=view&id=" + postId;
  return fetch(postPageURL)
    .then((response) => {
      if (response.ok) {
        return response.text();
      }
      throw new Error(response.status + ": " + postPageURL);
    })
    .then((html) => {
      return (/itemprop="image" content="(.*)"/g).exec(html)[1].replace("us.rule34", "rule34");
    }).catch(async(error) => {
      if (!error.message.includes("503")) {
        console.error(error);
        return "https://rule34.xxx/images/r34chibi.png";
      }
      await sleep(retryDelay);
      retryDelay += RETRY_DELAY_INCREMENT;

      if (retryDelay > RETRY_DELAY_INCREMENT * 5) {
        retryDelay = RETRY_DELAY_INCREMENT;
      }
      return getOriginalImageURLFromPostPage(postPageURL);
    });
}

/**
 * @param {String} postId
 * @returns {String}
 */
function getOriginalImageURL(postId) {
  const apiURL = "https://api.rule34.xxx//index.php?page=dapi&s=post&q=index&id=" + postId;
  return fetch(apiURL)
    .then((response) => {
      if (response.ok) {
        return response.text();
      }
      throw new Error(response.status + ": " + postId);
    })
    .then((html) => {
      return (/ file_url="(.*?)"/).exec(html)[1].replace("api-cdn.", "");
    }).catch(() => {
      return getOriginalImageURLFromPostPage(postId);
    });
}

/**
 *
 * @param {String} imageURL
 * @returns {{url: String, blob: Blob} | {url: String, error: String}}
 */
async function fetchImage(imageURL) {
  const response = await fetch(imageURL);

  if (response.ok) {
    const blob = await response.blob();
    return {
      url: imageURL,
      blob
    };
  }
  return {
    url: imageURL,
    error: response.statusText
  };
}

/**
 * @param {String} imageURL
 * @returns {String}
 */
function getExtensionFromImageURL(imageURL) {
  return (/\.(png|jpg|jpeg|gif)/g).exec(imageURL)[1];
}

/**
 * @param {String} postId
 * @returns {String}
 */
async function getImageExtensionFromPostId(postId) {
  const imageURL = await getOriginalImageURL(postId);
  return getExtensionFromImageURL(imageURL);
}

onmessage = async(message) => {
  const request = message.data;

  if (request.findExtension) {
    const extension = await getImageExtensionFromPostId(request.postId);

    postMessage({
      foundExtension: extension,
      postId: request.postId
    });
  } else {
    await getImageBitmap(request.imageURL, request.extension, request.postId, request.thumbIndex);
  }
};

`,
    thumbnailRenderer:
`
/**
 * @type {Map.<String, OffscreenCanvas>}
 */
const OFFSCREEN_CANVASES = new Map();
let screenWidth = 1080;

/**
 * @param {OffscreenCanvas} offscreenCanvas
 * @param {ImageBitmap} imageBitmap
 * @param {String} id
 * @param {Number} maxResolutionFraction
 */
function draw(offscreenCanvas, imageBitmap, id, maxResolutionFraction) {
  OFFSCREEN_CANVASES.set(id, offscreenCanvas);
  setOffscreenCanvasDimensions(offscreenCanvas, imageBitmap, maxResolutionFraction);
  drawOffscreenCanvas(offscreenCanvas, imageBitmap);
}

/**
 * @param {OffscreenCanvas} offscreenCanvas
 * @param {ImageBitmap} imageBitmap
 * @param {Number} maxResolutionFraction
 */
function setOffscreenCanvasDimensions(offscreenCanvas, imageBitmap, maxResolutionFraction) {
  const newWidth = screenWidth / maxResolutionFraction;
  const ratio = newWidth / imageBitmap.width;
  const newHeight = ratio * imageBitmap.height;

  offscreenCanvas.width = newWidth;
  offscreenCanvas.height = newHeight;
}

/**
 * @param {OffscreenCanvas} offscreenCanvas
 * @param {ImageBitmap} imageBitmap
 */
function drawOffscreenCanvas(offscreenCanvas, imageBitmap) {
  const context = offscreenCanvas.getContext("2d");
  const ratio = Math.min(offscreenCanvas.width / imageBitmap.width, offscreenCanvas.height / imageBitmap.height);
  const centerShiftX = (offscreenCanvas.width - (imageBitmap.width * ratio)) / 2;
  const centerShiftY = (offscreenCanvas.height - (imageBitmap.height * ratio)) / 2;

  context.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
  context.drawImage(
    imageBitmap, 0, 0, imageBitmap.width, imageBitmap.height,
    centerShiftX, centerShiftY, imageBitmap.width * ratio, imageBitmap.height * ratio
  );
  imageBitmap.close();
}

onmessage = (message) => {
  message = message.data;

  switch (message.action) {
    case "draw":
      draw(message.offscreenCanvas, message.imageBitmap, message.id, message.maxResolutionFraction);
      break;

    case "setScreenWidth":
      screenWidth = message.screenWidth;
      break;

    case "delete":
      break;

    default:
      break;
  }
};

`
  };
  static defaultResolutions = {
    postPage: "7680x4320",
    favoritesPage: "7680x4320"
  };
  static attributes = {
    thumbIndex: "index"
  };
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
  static swipe = {
    threshold: 60,
    touchStart: {
      x: 0,
      y: 0
    },
    touchEnd: {
      x: 0,
      y: 0
    },
    get deltaX() {
      return this.touchStart.x - this.touchEnd.x;
    },
    get deltaY() {
      return this.touchStart.y - this.touchEnd.y;
    },
    get right() {
      return this.deltaX < -this.threshold;
    },
    get left() {
      return this.deltaX > this.threshold;
    },
    get up() {
      return this.deltaY > this.threshold;
    },
    get down() {
      return this.deltaY < -this.threshold;
    },
    /**
     * @param {TouchEvent} touchEvent
     * @param {Boolean} atStart
     */
    set(touchEvent, atStart) {
      if (atStart) {
        this.touchStart.x = touchEvent.changedTouches[0].screenX;
        this.touchStart.y = touchEvent.changedTouches[0].screenY;
      } else {
        this.touchEnd.x = touchEvent.changedTouches[0].screenX;
        this.touchEnd.y = touchEvent.changedTouches[0].screenY;
      }
    }
  };

  /**
   * @type {HTMLCanvasElement}
   */
  fullscreenCanvas;
  /**
   * @type {CanvasRenderingContext2D}
   */
  fullscreenContext;
  /**
   * @type {HTMLImageElement}
   */
  fullscreenCanvasPlaceholder;
  /**
   * @type {Map.<String, ImageBitmap>}
   */
  imageBitmaps;
  /**
   * @type {Worker[]}
   */
  imageBitmapFetchers;
  /**
   * @type {Worker}
   */
  thumbUpscaler;
  /**
   * @type {Set}
   */
  upscaledThumbs;
  /**
   * @type {Object[]}
   */
  upscaleRequests;
  /**
   * @type {Boolean}
   */
  currentlyUpscaling;
  /**
   * @type {{minIndex: Number, maxIndex: Number}}
   */
  renderedThumbRange;
  /**
   * @type {HTMLElement[]}
   */
  visibleThumbs;
  /**
   * @type {Object.<Number, String>}
   */
  imageExtensions;
  /**
   * @type {Number}
   */
  imageFetchDelay;
  /**
   * @type {Number}
   */
  extensionAlreadyKnownFetchSpeed;
  /**
   * @type {Number}
   */
  recentlyDiscoveredImageExtensionCount;
  /**
   * @type {Number}
   */
  currentlySelectedThumbIndex;
  /**
   * @type {Number}
   */
  imageBitmapFetcherIndex;
  /**
   * @type {Number}
   */
  lastSelectedThumbIndexBeforeEnteringGalleryMode;
  /**
   * @type {Boolean}
   */
  inGallery;
  /**
   * @type {Boolean}
   */
  movedForwardInGallery;
  /**
   * @type {Boolean}
   */
  recentlyExitedGalleryMode;
  /**
   * @type {Boolean}
   */
  stopRendering;
  /**
   * @type {Boolean}
   */
  currentlyRendering;
  /**
   * @type {Boolean}
   */
  finishedLoading;
  /**
   * @type {Number}
   */
  maxNumberOfImagesToRender;
  /**
   * @type {Boolean}
   */
  showOriginalContentOnHover;
  /**
   * @type {HTMLVideoElement}
   */
  videoContainer;
  /**
   * @type {HTMLImageElement}
   */
  gifContainer;
  /**
   * @type {HTMLDivElement}
   */
  background;
  /**
   * @type {Boolean}
   */
  enlargeOnClickOnMobile;
  /**
   * @type {Boolean}
   */
  usingLandscapeOrientation;
  /**
   * @type {leftPostPage}
   */

  constructor() {
    const galleryDisabled = (onMobileDevice() && onPostPage()) || getPerformanceProfile() > 0;

    if (galleryDisabled) {
      return;
    }
    this.initializeFields();
    this.createWebWorkers();
    this.createFullscreenCanvasImagePlaceholder();
    this.createVideoBackground();
    this.setFullscreenCanvasResolution();
    this.addEventListeners();
    this.loadDiscoveredImageExtensions();
    this.preparePostPage();
    this.injectHTML();
    this.updateBackgroundOpacity(getPreference(Gallery.preferences.backgroundOpacity, 1));
  }

  initializeFields() {
    this.fullscreenCanvas = document.createElement("canvas");
    this.fullscreenContext = this.fullscreenCanvas.getContext("2d");
    this.imageBitmaps = new Map();
    this.renderedThumbRange = {
      minIndex: 0,
      maxIndex: 0
    };
    this.visibleThumbs = [];
    this.imageExtensions = {};
    this.upscaledThumbs = new Set();
    this.upscaleRequests = [];
    this.currentlyUpscaling = false;
    this.imageFetchDelay = 200;
    this.extensionAlreadyKnownFetchSpeed = 8;
    this.recentlyDiscoveredImageExtensionCount = 0;
    this.currentlySelectedThumbIndex = 0;
    this.imageBitmapFetcherIndex = 0;
    this.lastSelectedThumbIndexBeforeEnteringGalleryMode = 0;
    this.inGallery = false;
    this.movedForwardInGallery = true;
    this.recentlyExitedGalleryMode = false;
    this.stopRendering = false;
    this.currentlyRendering = false;
    this.usingLandscapeOrientation = true;
    this.leftPostPage = false;
    this.finishedLoading = onPostPage();
    this.showOriginalContentOnHover = getPreference(Gallery.preferences.showOnHover, true);
    this.enlargeOnClickOnMobile = getPreference(Gallery.preferences.enlargeOnClick, true);
  }

  createWebWorkers() {
    this.imageBitmapFetchers = [];
    this.thumbUpscaler = new Worker(getWorkerURL(Gallery.webWorkers.thumbnailRenderer));
    this.thumbUpscaler.postMessage({
      action: "setScreenWidth",
      screenWidth: window.screen.width
    });

    for (let i = 0; i < 1; i += 1) {
      this.imageBitmapFetchers.push(new Worker(getWorkerURL(Gallery.webWorkers.imageFetcher)));
    }
  }

  injectHTML() {
    this.injectStyleHTML();
    this.injectOptionsHTML();
    this.injectOriginalContentContainerHTML();
  }

  injectStyleHTML() {
    injectStyleHTML(galleryHTML);
  }

  injectOptionsHTML() {
    let optionId = Gallery.preferences.showOnHover;
    let optionText = "Enlarge on Hover";
    let optionTitle = "View full resolution images/play videos when a thumbnail is clicked";
    let optionIsChecked = this.showOriginalContentOnHover;
    let onOptionChanged = (event) => {
      setPreference(Gallery.preferences.showOnHover, event.target.checked);
      this.toggleAllVisibility();
    };

    if (onMobileDevice()) {
      optionId = "open-post-in-new-page-on-mobile";
      optionText = "Enlarge on Click";
      optionTitle = "View full resolution images/play videos when a thumbnail is clicked";
      optionIsChecked = this.enlargeOnClickOnMobile;
      onOptionChanged = (event) => {
        setPreference(Gallery.preferences.enlargeOnClick, event.target.checked);
        this.enlargeOnClickOnMobile = event.target.checked;
      };
    }

    addOptionToFavoritesPage(
      optionId,
      optionText,
      optionTitle,
      optionIsChecked,
      onOptionChanged,
      true
    );
    this.injectImageResolutionOptionsHTML();
  }

  injectOriginalContentContainerHTML() {
    const originalContentContainerHTML = `
          <div id="original-content-container">
              <video id="original-video-container" width="90%" height="90%" autoplay muted loop style="display: none; top:5%; left:5%; position:fixed; z-index:9998;pointer-events:none;">
              </video>
              <img id="original-gif-container" class="focused"></img>
              <div id="original-content-background" style="position: fixed; top: 0px; left: 0px; width: 100%; height: 100%; background: black; z-index: 999; display: none; pointer-events: none;"></div>
          </div>
      `;

    document.body.insertAdjacentHTML("afterbegin", originalContentContainerHTML);
    const originalContentContainer = document.getElementById("original-content-container");

    originalContentContainer.insertBefore(this.fullscreenCanvas, originalContentContainer.firstChild);
    this.background = document.getElementById("original-content-background");
    this.videoContainer = document.getElementById("original-video-container");
    this.gifContainer = document.getElementById("original-gif-container");
    this.fullscreenCanvas.id = "fullscreen-canvas";
    this.toggleOriginalContentVisibility(false);
  }

  addEventListeners() {
    document.addEventListener("mousedown", (event) => {
      const clickedOnAnImage = event.target.tagName.toLowerCase() === "img";
      const clickedOnAThumb = clickedOnAnImage && getThumbFromImage(event.target).className.includes("thumb");
      const thumb = clickedOnAThumb ? getThumbFromImage(event.target) : null;

      switch (event.button) {
        case Gallery.clickCodes.leftClick:
          if (this.inGallery) {
            if (isVideo(this.getSelectedThumb()) && !onMobileDevice()) {
              return;
            }
            this.exitGallery();
            this.toggleAllVisibility(false);
            return;
          }

          if (thumb === null) {
            return;
          }

          if (onMobileDevice()) {
            if (!this.enlargeOnClickOnMobile) {
              this.openPostInNewPage(thumb);
              return;
            }
            this.deleteAllRenders();
          }
          this.toggleAllVisibility(true);
          this.showOriginalContent(thumb);
          this.enterGallery();
          break;

        case Gallery.clickCodes.middleClick:
          event.preventDefault();

          if (hoveringOverThumb() || this.inGallery) {
            this.openPostInNewPage();
          } else if (!this.inGallery) {
            this.toggleAllVisibility();
          }
          break;

        default:

          break;
      }
    });
    window.addEventListener("auxclick", (event) => {
      if (event.button === Gallery.clickCodes.middleClick) {
        event.preventDefault();
      }
    });
    document.addEventListener("wheel", (event) => {
      if (this.inGallery) {
        const delta = (event.wheelDelta ? event.wheelDelta : -event.deltaY);
        const direction = delta > 0 ? Gallery.galleryDirections.left : Gallery.galleryDirections.right;

        this.traverseGallery.bind(this)(direction, false);
      } else if (hoveringOverThumb() && this.showOriginalContentOnHover) {
        let opacity = parseFloat(getPreference(Gallery.preferences.backgroundOpacity, 1));

        opacity -= event.deltaY * 0.0005;
        opacity = clamp(opacity, "0", "1");
        this.updateBackgroundOpacity(opacity);
      }
    }, {
      passive: true
    });
    document.addEventListener("contextmenu", (event) => {
      if (this.inGallery) {
        event.preventDefault();
        this.exitGallery();
      }
    });
    document.addEventListener("keydown", (event) => {
      if (this.inGallery) {
        switch (event.key) {
          case Gallery.galleryDirections.a:

          case Gallery.galleryDirections.d:

          case Gallery.galleryDirections.left:

          case Gallery.galleryDirections.right:
            event.preventDefault();
            this.traverseGallery(event.key, event.repeat);
            break;

          case "X":

          case "x":
            this.unFavoriteSelectedContent();
            break;

          case "M":

          case "m":
            if (isVideo(this.getSelectedThumb())) {
              this.videoContainer.muted = !this.videoContainer.muted;
            }
            break;

          case "Escape":
            this.exitGallery();
            this.toggleAllVisibility(false);
            break;

          default:
            break;
        }
      }
    });
    window.addEventListener("load", () => {
      if (onPostPage()) {
        this.initializeThumbsForHovering.bind(this)();
        this.enumerateVisibleThumbs();
      }
      this.hideCaptionsWhenShowingOriginalContent();
    }, {
      once: true,
      passive: true
    });
    window.addEventListener("favoritesFetched", (event) => {
      this.initializeThumbsForHovering.bind(this)(event.detail);
      this.enumerateVisibleThumbs();
    });
    window.addEventListener("newFavoritesFetchedOnReload", (event) => {
      this.initializeThumbsForHovering.bind(this)(event.detail);
      this.enumerateVisibleThumbs();

      if (event.detail.length > 0) {
        const thumb = event.detail[0];

        this.upscaleAnimatedVisibleThumbsAround(thumb);
        this.renderImagesAround(thumb);
      }
    });
    window.addEventListener("startedFetchingFavorites", () => {
      setTimeout(() => {
        const thumb = document.querySelector(".thumb-node");

        this.renderImagesInTheBackground();

        if (thumb !== null && !this.finishedLoading) {
          this.upscaleAnimatedVisibleThumbsAround(thumb);
        }
      }, 650);
    }, {
      once: true
    });
    window.addEventListener("favoritesLoaded", (event) => {
      this.finishedLoading = true;
      this.initializeThumbsForHovering.bind(this)();
      this.enumerateVisibleThumbs();
      this.renderImagesInTheBackground();
      this.assignImageExtensionsInTheBackground(event.detail);
    });
    window.addEventListener("changedPage", async() => {
      console.log("changedPage");
      this.clearFullscreenCanvas();
      this.toggleOriginalContentVisibility(false);
      await this.deleteAllRenders();
      Array.from(getAllThumbs()).forEach((thumb) => thumb.classList.remove("loaded"));
      this.initializeThumbsForHovering.bind(this)();
      this.enumerateVisibleThumbs();
      this.renderImagesInTheBackground();
    });
    window.addEventListener("shuffle", async() => {
      this.enumerateVisibleThumbs();
      await this.deleteAllRenders();
      this.renderImagesInTheBackground();
    });
    this.imageBitmapFetchers.forEach((renderer) => {
      renderer.onmessage = (message) => {
        this.handleRendererMessage(message.data);
      };
    });

    if (this.thumbUpscaler !== undefined) {
      this.thumbUpscaler.onmessage = (message) => {
        message = message.data;

        switch (message.action) {
          default:

            break;
        }
      };
    }

    if (onMobileDevice()) {
      window.addEventListener("blur", () => {
        this.deleteAllRenders();
      });
      document.addEventListener("touchstart", (event) => {
        if (!this.inGallery) {
          return;
        }
        event.preventDefault();
        Gallery.swipe.set(event, true);
      }, {
        passive: false
      });
      document.addEventListener("touchend", (event) => {
        if (!this.inGallery) {
          return;
        }
        event.preventDefault();
        Gallery.swipe.set(event, false);

        if (Gallery.swipe.up) {
          this.exitGallery();
          this.toggleAllVisibility(false);
        } else if (Gallery.swipe.left) {
          this.traverseGallery(Gallery.galleryDirections.right, false);
        } else if (Gallery.swipe.right) {
          this.traverseGallery(Gallery.galleryDirections.left, false);
        } else {
          this.exitGallery();
          this.toggleAllVisibility;
        }
      }, {
        passive: false
      });
    }
  }

  /**
   * @param {HTMLElement[]} thumbs
   */
  initializeThumbsForHovering(thumbs) {
    const thumbElements = thumbs === undefined ? getAllThumbs() : thumbs;

    for (const thumbElement of thumbElements) {
      this.addEventListenersToThumb(thumbElement);
    }
  }

  /**
   * @param {Object} message
   */
  handleRendererMessage(message) {
    if (message.foundExtension) {
      this.assignExtension(message.postId, message.foundExtension);
      return;
    }
    this.onRenderFinished(message);
  }

  /**
   * @param {Object} message
   */
  onRenderFinished(message) {
    this.deleteOldestRender();

    const thumb = document.getElementById(message.postId);

    this.imageBitmaps.set(message.postId, message.imageBitmap);

    if (thumb === null) {
      return;
    }
    thumb.classList.add("loaded");
    this.upscaleThumbResolution(thumb, message.imageBitmap, 4);

    if (message.extension === "gif") {
      getImageFromThumb(thumb).setAttribute("gif", true);
      return;
    }

    if (!message.extensionAlreadyFound) {
      this.assignExtension(message.postId, message.newExtension);
    }

    if (this.inGallery) {
      if (this.getSelectedThumb().id === message.postId) {
        this.showOriginalContent(thumb);
      }
    } else if (this.showOriginalContentOnHover) {
      const thumbUnderCursor = getThumbUnderCursor();
      const hoveringOverSameThumb = (thumbUnderCursor !== null) && thumbUnderCursor.id === message.postId;

      if (hoveringOverSameThumb) {
        this.showOriginalContent(thumb);
      }
    }
  }

  /**
   * @param {HTMLElement} thumb
   * @param {ImageBitmap} imageBitmap
   * @param {Number} maxResolutionFraction
   */
  upscaleThumbResolution(thumb, imageBitmap, maxResolutionFraction) {
    if (onPostPage() || this.upscaledThumbs.has(thumb.id) || this.thumbUpscaler === undefined || onMobileDevice()) {
      return;
    }
    this.upscaledThumbs.add(thumb.id);
    const message = {
      action: "draw",
      id: thumb.id,
      offscreenCanvas: thumb.querySelector("canvas").transferControlToOffscreen(),
      imageBitmap,
      maxResolutionFraction
    };

    // this.upscaleRequests.push(message);
    // this.dispatchThumbResolutionUpscaleRequests();
    this.thumbUpscaler.postMessage(message, [message.offscreenCanvas]);
  }

  async dispatchThumbResolutionUpscaleRequests() {
    if (this.currentlyUpscaling) {
      return;
    }
    this.currentlyUpscaling = true;

    while (this.upscaleRequests.length > 0) {
      await sleep(25);
      const message = this.upscaleRequests.shift();

      this.thumbUpscaler.postMessage(message, [message.offscreenCanvas]);
    }
    this.currentlyUpscaling = false;
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {Boolean}
   */
  isUpscaled(thumb) {
    return this.upscaledThumbs.has(thumb.id);
  }

  /**
   * @param {String} postId
   * @param {String} extension
   */
  assignExtension(postId, extension) {
    this.setImageExtension(postId, extension);
    this.recentlyDiscoveredImageExtensionCount += 1;

    if (this.recentlyDiscoveredImageExtensionCount >= 3) {
      this.recentlyDiscoveredImageExtensionCount = 0;

      if (!onPostPage()) {
        localStorage.setItem(Gallery.localStorageKeys.imageExtensions, JSON.stringify(this.imageExtensions));
      }
    }
  }

  hideCaptionsWhenShowingOriginalContent() {
    for (const caption of document.getElementsByClassName("caption")) {
      if (this.showOriginalContentOnHover) {
        caption.classList.add("hide");
      } else {
        caption.classList.remove("hide");
        const thumb = getThumbUnderCursor();

        if (thumb !== null) {
          dispatchEvent(new CustomEvent("showCaption", {
            detail: thumb
          }));
        }
      }
    }
  }

  async preparePostPage() {
    if (!onPostPage()) {
      return;
    }
    const imageList = document.getElementsByClassName("image-list")[0];
    const thumbs = Array.from(imageList.querySelectorAll(".thumb"));

    for (const thumb of thumbs) {
      removeTitleFromImage(getImageFromThumb(thumb));
      assignContentType(thumb);
      thumb.id = thumb.id.substring(1);
    }
    window.addEventListener("unload", () => {
      this.deleteAllRenders();
    });
    window.onblur = () => {
      this.leftPostPage = true;
      this.deleteAllRenders();
    };
    window.onfocus = () => {
      if (this.leftPostPage) {
        this.leftPostPage = false;
        this.renderImagesInTheBackground();
      }
    };
    await this.findImageExtensionsOnPostPage();
    this.renderImagesInTheBackground();
  }

  async deleteAllRenders() {
    await this.pauseRendering(10);

    for (const id of this.imageBitmaps.keys()) {
      this.deleteRender(id);
    }
    this.imageBitmaps.clear();
  }

  deleteRender(id) {
    const thumb = document.getElementById(id);

    if (thumb !== null) {
      thumb.classList.remove("loaded");
    }
    this.imageBitmaps.get(id).close();
    this.imageBitmaps.delete(id);
  }

  findImageExtensionsOnPostPage() {
    const postPageAPIURL = this.getPostPageAPIURL();
    return fetch(postPageAPIURL)
      .then((response) => {
        if (response.ok) {
          return response.text();
        }
        return null;
      }).then((html) => {
        if (html === null) {
          console.error(`Failed to fetch: ${postPageAPIURL}`);
        }
        const dom = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
        const posts = Array.from(dom.getElementsByTagName("post"));

        for (const post of posts) {
          const originalImageURL = post.getAttribute("file_url");
          const isAnImage = getContentType(post.getAttribute("tags")) === "image";
          const isBlacklisted = originalImageURL === "https://api-cdn.rule34.xxx/images//";

          if (!isAnImage || isBlacklisted) {
            continue;
          }
          const postId = post.getAttribute("id");
          const extension = (/\.(png|jpg|jpeg|gif)/g).exec(originalImageURL)[1];

          this.assignExtension(postId, extension);
        }
      });
  }

  /**
   * @returns {String}
   */
  getPostPageAPIURL() {
    const postsPerPage = 42;
    const apiURL = `https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&limit=${postsPerPage}`;
    let blacklistedTags = ` ${negateTags(TAG_BLACKLIST)}`.replace(/\s-/g, "+-");
    let pageNumber = (/&pid=(\d+)/).exec(location.href);
    let tags = (/&tags=([^&]*)/).exec(location.href);

    pageNumber = pageNumber === null ? 0 : Math.floor(parseInt(pageNumber[1]) / postsPerPage);
    tags = tags === null ? "" : tags[1];

    if (tags === "all") {
      tags = "";
      blacklistedTags = "";
    }
    return `${apiURL}&tags=${tags}${blacklistedTags}&pid=${pageNumber}`;
  }

  enumerateVisibleThumbs() {
    this.visibleThumbs = Array.from(getAllVisibleThumbs());

    for (let i = 0; i < this.visibleThumbs.length; i += 1) {
      this.enumerateThumb(this.visibleThumbs[i], i);
    }
    this.indexRenderRange();
  }

  /**
   * @param {HTMLElement} thumb
   * @param {Number} index
   */
  enumerateThumb(thumb, index) {
    thumb.setAttribute(Gallery.attributes.thumbIndex, index);
  }

  /**
   * @param {HTMLElement} thumb
   */
  addEventListenersToThumb(thumb) {
    if (onMobileDevice()) {
      return;
    }
    const image = getImageFromThumb(thumb);

    if (image.classList.contains("gallery")) {
      return;
    }

    image.onmouseover = () => {
      if (this.inGallery || this.recentlyExitedGalleryMode) {
        return;
      }
      this.showOriginalContent(thumb);
    };
    image.onmouseout = (event) => {
      if (this.inGallery || enteredOverCaptionTag(event)) {
        return;
      }
      this.hideOriginalContent(thumb);
    };
    image.classList.add("gallery");
  }

  loadDiscoveredImageExtensions() {
    this.imageExtensions = JSON.parse(localStorage.getItem(Gallery.localStorageKeys.imageExtensions)) || {};
  }

  /**
   *
   * @param {HTMLElement} thumb
   */
  openPostInNewPage(thumb) {
    thumb = thumb === undefined ? this.getSelectedThumb() : thumb;
    const firstChild = thumb.children[0];

    if (firstChild.hasAttribute("href")) {
      window.open(firstChild.getAttribute("href"), "_blank");
    } else {
      firstChild.click();
    }
  }

  unFavoriteSelectedContent() {
    const removeLink = getRemoveLinkFromThumb(this.getSelectedThumb());

    if (removeLink === null || removeLink.style.visibility === "hidden") {
      return;
    }
    removeLink.click();
  }

  enterGallery() {
    console.log(this.visibleThumbs);
    const selectedThumb = this.getSelectedThumb();

    this.lastSelectedThumbIndexBeforeEnteringGalleryMode = this.currentlySelectedThumbIndex;
    this.background.style.pointerEvents = "auto";
    this.highlightThumb(selectedThumb, true);

    if (isVideo(selectedThumb)) {
      this.toggleCursorVisibility(true);
      this.toggleVideoControls(true);
    }
    this.inGallery = true;
    this.showLockIcon();
  }

  exitGallery() {
    this.toggleVideoControls(false);
    this.background.style.pointerEvents = "none";
    const thumbIndex = this.getIndexOfThumbUnderCursor();

    if (thumbIndex !== this.lastSelectedThumbIndexBeforeEnteringGalleryMode) {
      this.hideOriginalContent(this.getSelectedThumb());

      if (thumbIndex !== null && this.showOriginalContentOnHover) {
        this.showOriginalContent(this.visibleThumbs[thumbIndex]);
      }
    }
    this.recentlyExitedGallery = true;
    setTimeout(() => {
      this.recentlyExitedGalleryMode = false;
    }, 300);
    this.inGallery = false;
    this.showLockIcon();
  }

  /**
   * @param {String} direction
   * @param {Boolean} keyIsHeldDown
   */
  traverseGallery(direction, keyIsHeldDown) {
    if (keyIsHeldDown && !Gallery.galleryTraversalCooldown.ready) {
      return;
    }

    let selectedThumb = this.getSelectedThumb();

    this.clearOriginalContentSources();
    this.highlightThumb(selectedThumb, false);
    this.setNextSelectedThumbIndex(direction);
    selectedThumb = this.getSelectedThumb();
    this.highlightThumb(selectedThumb, true);
    this.renderInAdvanceWhileTraversingGallery(selectedThumb, direction);

    if (!usingFirefox()) {
      scrollToThumb(selectedThumb.id, false);
    }

    if (isVideo(selectedThumb)) {
      this.toggleCursorVisibility(true);
      this.toggleVideoControls(true);
      this.showOriginalVideo(selectedThumb);
    } else if (isGif(selectedThumb)) {
      this.toggleCursorVisibility(false);
      this.toggleVideoControls(false);
      this.toggleOriginalVideo(false);
      this.showOriginalGIF(selectedThumb);
    } else {
      this.toggleCursorVisibility(false);
      this.toggleVideoControls(false);
      this.toggleOriginalVideo(false);
      this.showOriginalImage(selectedThumb);
    }
  }

  /**
   * @param {String} direction
   */
  setNextSelectedThumbIndex(direction) {
    if (direction === Gallery.galleryDirections.left || direction === Gallery.galleryDirections.a) {
      this.currentlySelectedThumbIndex -= 1;
      this.currentlySelectedThumbIndex = this.currentlySelectedThumbIndex < 0 ? this.visibleThumbs.length - 1 : this.currentlySelectedThumbIndex;
    } else {
      this.currentlySelectedThumbIndex += 1;
      this.currentlySelectedThumbIndex = this.currentlySelectedThumbIndex >= this.visibleThumbs.length ? 0 : this.currentlySelectedThumbIndex;
    }
  }

  /**
   * @param {Boolean} value
   */
  toggleAllVisibility(value) {
    this.showOriginalContentOnHover = value === undefined ? !this.showOriginalContentOnHover : value;
    this.toggleOriginalContentVisibility();
    this.showEyeIcon();

    if (hoveringOverThumb()) {
      this.toggleBackgroundVisibility();
      this.toggleScrollbarVisibility();
    }
    this.hideCaptionsWhenShowingOriginalContent();
    const showOnHoverCheckbox = document.getElementById("showImagesWhenHoveringCheckbox");

    if (showOnHoverCheckbox !== null) {
      setPreference(Gallery.preferences.showOnHover, this.showOriginalContentOnHover);
      showOnHoverCheckbox.checked = this.showOriginalContentOnHover;
    }
  }

  /**
   * @param {HTMLElement} thumb
   */
  hideOriginalContent(thumb) {
    this.highlightThumb(thumb, false);
    this.toggleBackgroundVisibility(false);
    this.toggleScrollbarVisibility(true);
    this.toggleCursorVisibility(true);
    this.clearOriginalContentSources();
    this.toggleOriginalVideo(false);
    this.toggleOriginalGIF(false);
  }

  clearOriginalContentSources() {
    this.clearFullscreenCanvas();
    this.videoContainer.src = "";
    this.gifContainer.src = "";
  }

  /**
   * @returns {Boolean}
   */
  currentlyHoveringOverVideoThumb() {
    const thumb = getThumbUnderCursor();

    if (thumb === null) {
      return false;
    }
    return isVideo(thumb);
  }

  /**
   * @param {HTMLElement} thumb
   * @param {Boolean} value
   */
  highlightThumb(thumb, value) {
    if (!onMobileDevice()) {
      thumb.classList.toggle("selected", value);
    }
  }

  /**
   * @param {HTMLElement} thumb
   */
  showOriginalContent(thumb) {
    this.highlightThumb(thumb, true);
    this.currentlySelectedThumbIndex = parseInt(thumb.getAttribute(Gallery.attributes.thumbIndex));

    const animatedThumbsToUpscale = this.getAdjacentVisibleThumbs(thumb, 20, (_) => {
      return true;
    }).filter(t => !isImage(t) && !this.isUpscaled(t));

    this.upscaleAnimatedThumbs(animatedThumbsToUpscale);

    if (isVideo(thumb)) {
      this.showOriginalVideo(thumb);
    } else if (isGif(thumb)) {
      this.showOriginalGIF(thumb);
    } else {
      this.showOriginalImage(thumb);
    }

    if (this.showOriginalContentOnHover) {
      this.toggleCursorVisibility(false);
      this.toggleBackgroundVisibility(true);
      this.toggleScrollbarVisibility(false);
    }
  }

  /**
   * @param {HTMLElement} thumb
   */
  showOriginalVideo(thumb) {
    if (!this.showOriginalContentOnHover) {
      return;
    }
    this.toggleFullscreenCanvas(false);
    this.videoContainer.style.display = "block";
    this.playOriginalVideo(thumb);

    if (!this.inGallery) {
      this.toggleVideoControls(false);
    }
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {String}
   */
  getVideoSource(thumb) {
    return getOriginalImageURLFromThumb(thumb).replace("jpg", "mp4");
  }

  /**
   * @param {HTMLElement} thumb
   */
  playOriginalVideo(thumb) {
    this.videoContainer.src = this.getVideoSource(thumb);
    this.videoContainer.play().catch(() => { });
  }

  /**
   * @param {HTMLElement} thumb
   */
  showOriginalGIF(thumb) {
    const extension = includesTag("animated_png", getTagsFromThumb(thumb)) ? "png" : "gif";
    const originalSource = getOriginalImageURLFromThumb(thumb).replace("jpg", extension);

    this.gifContainer.src = originalSource;

    if (this.showOriginalContentOnHover) {
      this.gifContainer.style.visibility = "visible";
    }
  }

  /**
   * @param {HTMLElement} thumb
   */
  showOriginalImage(thumb) {
    if (this.isNotRendered(thumb)) {
      this.renderOriginalImage(thumb);
      this.renderImagesAround(thumb);
    } else {
      this.drawFullscreenCanvas(this.imageBitmaps.get(thumb.id));
    }
    this.toggleOriginalContentVisibility(this.showOriginalContentOnHover);
  }

  deleteOldestRender() {
    if (this.imageBitmaps.size > this.maxNumberOfImagesToRender * 1.5) {
      const iterator = this.imageBitmaps.keys().next();

      if (!iterator.done) {
        this.deleteRender(iterator.value);
      }
    }
  }

  /**
   * @param {HTMLElement} initialThumb
   */
  async renderImagesAround(initialThumb) {
    if (onPostPage()) {
      return;
    }

    if (onMobileDevice() && !this.enlargeOnClickOnMobile) {
      return;
    }

    if (this.currentlyRendering) {
      if (this.thumbInRenderRange(initialThumb)) {
        return;
      }
      await this.pauseRendering(this.imageFetchDelay);
    }
    this.currentlyRendering = true;
    const amountToRender = Math.max(2, Math.ceil(this.maxNumberOfImagesToRender / 2));

    const imageThumbsToRender = this.getAdjacentVisibleThumbs(initialThumb, amountToRender, (thumb) => {
      return isImage(thumb) && this.isNotRendered(thumb);
    });
    const indicesOfImageThumbsToRender = imageThumbsToRender.map(imageThumb => parseInt(imageThumb.getAttribute(Gallery.attributes.thumbIndex)));

    this.setRenderRange(indicesOfImageThumbsToRender);

    if (this.isNotRendered(initialThumb)) {
      imageThumbsToRender.unshift(initialThumb);
    }

    await this.renderImages(imageThumbsToRender);
    this.currentlyRendering = false;
  }

  /**
   * @param {HTMLElement} initialThumb
   * @param {Number} limit
   * @param {Function} additionalQualifier
   * @returns {HTMLElement[]}
   */
  getAdjacentVisibleThumbs(initialThumb, limit, additionalQualifier) {
    const adjacentVisibleThumbs = [];
    let currentThumb = initialThumb;
    let previousThumb = initialThumb;
    let nextThumb = initialThumb;
    let traverseForward = this.inGallery ? this.movedForwardInGallery : true;

    while (currentThumb !== null && adjacentVisibleThumbs.length < limit) {
      if (traverseForward) {
        nextThumb = this.getAdjacentVisibleThumb(nextThumb, true);
      } else {
        previousThumb = this.getAdjacentVisibleThumb(previousThumb, false);
      }

      traverseForward = this.getTraversalDirection(previousThumb, traverseForward, nextThumb);
      currentThumb = traverseForward ? nextThumb : previousThumb;

      if (currentThumb !== null) {
        if (this.isVisible(currentThumb) && additionalQualifier(currentThumb)) {
          adjacentVisibleThumbs.push(currentThumb);
        }
      }
    }
    return adjacentVisibleThumbs;
  }

  /**
   * @param {HTMLElement} previousThumb
   * @param {HTMLElement} traverseForward
   * @param {HTMLElement} nextThumb
   * @returns {Boolean}
   */
  getTraversalDirection(previousThumb, traverseForward, nextThumb) {
    if (this.inGallery) {
      return this.movedForwardInGallery;
    }

    if (previousThumb === null) {
      traverseForward = true;
    } else if (nextThumb === null) {
      traverseForward = false;
    }
    return !traverseForward;
  }

  /**
   * @param {HTMLElement} thumb
   * @param {Boolean} forward
   * @returns {HTMLElement}
   */
  getAdjacentVisibleThumb(thumb, forward) {
    let adjacentThumb = this.getAdjacentThumb(thumb, forward);

    while (adjacentThumb !== null && !this.isVisible(adjacentThumb)) {
      adjacentThumb = this.getAdjacentThumb(adjacentThumb, forward);
    }
    return adjacentThumb;
  }

  /**
   * @param {HTMLElement} thumb
   * @param {Boolean} forward
   * @returns {HTMLElement}
   */
  getAdjacentThumb(thumb, forward) {
    return forward ? thumb.nextElementSibling : thumb.previousElementSibling;
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {Boolean}
   */
  isVisible(thumb) {
    return thumb.style.display !== "none";
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {Boolean}
   */
  isNotRendered(thumb) {
    return this.imageBitmaps.get(thumb.id) === undefined;
  }

  /**
   * @param {HTMLElement} thumb
   */
  renderOriginalImage(thumb) {
    const renderMessage = {
      imageURL: getOriginalImageURLFromThumb(thumb),
      postId: thumb.id,
      thumbIndex: thumb.getAttribute(Gallery.attributes.thumbIndex),
      extension: this.getImageExtension(thumb.id)
    };

    this.imageBitmapFetchers[this.imageBitmapFetcherIndex].postMessage(renderMessage);
    this.imageBitmapFetcherIndex += 1;
    this.imageBitmapFetcherIndex = this.imageBitmapFetcherIndex < this.imageBitmapFetchers.length ? this.imageBitmapFetcherIndex : 0;

    const image = getImageFromThumb(thumb);

    if (!imageIsLoaded(image)) {
      return;
    }

    createImageBitmap(image)
      .then((imageBitmap) => {
        if (this.imageBitmaps.get(thumb.id) === undefined) {
          const selectedThumb = this.getSelectedThumb();

          if (thumb === null || thumb === undefined || selectedThumb === null || selectedThumb === undefined) {
            return;
          }
          this.imageBitmaps.set(thumb.id, imageBitmap);

          if (selectedThumb !== null && selectedThumb.id === thumb.id) {
            this.drawFullscreenCanvas(imageBitmap);
          }
        }
      });
  }

  /**
   * @param {Boolean} value
   */
  toggleOriginalContentVisibility(value) {
    this.toggleFullscreenCanvas(value);
    this.toggleOriginalGIF(value);

    if (!value) {
      this.toggleOriginalVideo(false);
    }
  }

  /**
   * @param {Boolean} value
   */
  toggleBackgroundVisibility(value) {
    if (value === undefined) {
      this.background.style.display = this.background.style.display === "block" ? "none" : "block";
      return;
    }
    this.background.style.display = value ? "block" : "none";
  }

  /**
   * @param {Boolean} value
   */
  toggleScrollbarVisibility(value) {
    if (value === undefined) {
      document.body.style.overflowY = document.body.style.overflowY === "auto" ? "hidden" : "auto";
      return;
    }
    document.body.style.overflowY = value ? "auto" : "hidden";
  }

  /**
   * @param {Boolean} value
   */
  toggleCursorVisibility(value) {
    // const image = getImageFromThumb(this.getSelectedThumb());

    // if (value === undefined) {
    //   image.style.cursor = image.style.cursor === "pointer" ? "none" : "pointer";
    //   return;
    // }

    // if (value) {
    //   image.style.cursor = "pointer";
    //   document.body.style.cursor = "pointer";
    // } else {
    //   image.style.cursor = "none";
    //   document.body.style.cursor = "none";
    // }
  }

  /**
   * @param {Boolean} value
   */
  toggleVideoControls(value) {
    if (value === undefined) {
      this.videoContainer.style.pointerEvents = this.videoContainer.style.pointerEvents === "auto" ? "none" : "auto";
      this.videoContainer.style.controls = this.videoContainer.style.controls === "controls" ? false : "controls";
    } else {
      this.videoContainer.style.pointerEvents = value ? "auto" : "none";
      this.videoContainer.controls = value ? "controls" : false;
    }
  }

  /**
   * @param {Boolean} value
   */
  toggleFullscreenCanvas(value) {
    if (value === undefined) {
      this.fullscreenCanvas.style.visibility = this.fullscreenCanvas.style.visibility === "visible" ? "hidden" : "visible";
    } else {
      this.fullscreenCanvas.style.visibility = value ? "visible" : "hidden";
    }
  }

  /**
   * @param {Boolean} value
   */
  toggleOriginalVideo(value) {
    if (value !== undefined && this.videoContainer.src !== "") {
      this.videoContainer.style.display = value ? "block" : "none";
      return;
    }

    if (!this.currentlyHoveringOverVideoThumb() || this.videoContainer.style.display === "block") {
      this.videoContainer.style.display = "none";
    } else {
      this.videoContainer.style.display = "block";
    }
  }

  /**
   * @param {Boolean} value
   */
  toggleOriginalGIF(value) {
    if (value === undefined) {
      this.gifContainer.style.visibility = this.gifContainer.style.visibility === "visible" ? "hidden" : "visible";
    } else {
      this.gifContainer.style.visibility = value ? "visible" : "hidden";
    }
  }

  /**
   * @param {Number} opacity
   */
  updateBackgroundOpacity(opacity) {
    this.background.style.opacity = opacity;
    setPreference(Gallery.preferences.backgroundOpacity, opacity);
  }

  /**
   * @returns {Number}
   */
  getIndexOfThumbUnderCursor() {
    const thumb = getThumbUnderCursor();
    return thumb === null ? null : parseInt(thumb.getAttribute(Gallery.attributes.thumbIndex));
  }

  /**
   * @returns {HTMLElement}
   */
  getSelectedThumb() {
    return this.visibleThumbs[this.currentlySelectedThumbIndex];
  }

  /**
   * @param {ImageBitmap} imageBitmap
   */
  drawFullscreenCanvas(imageBitmap) {
    this.resizeFullscreenCanvas();
    const ratio = Math.min(this.fullscreenCanvas.width / imageBitmap.width, this.fullscreenCanvas.height / imageBitmap.height);
    const centerShiftX = (this.fullscreenCanvas.width - (imageBitmap.width * ratio)) / 2;
    const centerShiftY = (this.fullscreenCanvas.height - (imageBitmap.height * ratio)) / 2;

    this.fullscreenContext.clearRect(0, 0, this.fullscreenCanvas.width, this.fullscreenCanvas.height);
    this.fullscreenContext.drawImage(
      imageBitmap, 0, 0, imageBitmap.width, imageBitmap.height,
      centerShiftX, centerShiftY, imageBitmap.width * ratio, imageBitmap.height * ratio
    );
  }

  resizeFullscreenCanvas() {
    if (!onMobileDevice()) {
      return;
    }
    const windowInLandscapeOrientation = window.innerWidth > window.innerHeight;
    const usingIncorrectOrientation = windowInLandscapeOrientation !== this.usingLandscapeOrientation;

    if (usingIncorrectOrientation) {
      const temp = this.fullscreenCanvas.width;

      this.fullscreenCanvas.width = this.fullscreenCanvas.height;
      this.fullscreenCanvas.height = temp;
      this.usingLandscapeOrientation = !this.usingLandscapeOrientation;
    }
  }

  clearFullscreenCanvas() {
    this.fullscreenContext.clearRect(0, 0, this.fullscreenCanvas.width, this.fullscreenCanvas.height);
  }

  showEyeIcon() {
    const eyeIcon = document.getElementById("svg-eye");
    const svg = this.showOriginalContentOnHover ? Gallery.icons.openEye : Gallery.icons.closedEye;

    if (eyeIcon) {
      eyeIcon.remove();
    }
    showOverlayingIcon(svg, "svg-eye", 100, 100, "bottom-right");
  }

  showLockIcon() {
    const lockIcon = document.getElementById("svg-lock");
    const svg = this.inGallery ? Gallery.icons.closedLock : Gallery.icons.openLock;

    if (lockIcon) {
      lockIcon.remove();
    }
    showOverlayingIcon(svg, "svg-lock", 100, 100, "bottom-left");
  }

  /**
   * @returns {HTMLElement[]}
   */
  getVisibleUnrenderedImageThumbs() {
    let thumbs = Array.from(getAllVisibleThumbs()).filter((thumb) => {
      return isImage(thumb) && this.isNotRendered(thumb);
    });

    if (onPostPage()) {
      thumbs = thumbs.filter(thumb => !thumb.classList.contains("blacklisted-image"));
    }
    return thumbs;
  }

  deleteRendersNotIncludedInNewSearch() {
    for (const id of this.imageBitmaps.keys()) {
      const thumb = document.getElementById(id);

      if (thumb !== null && !this.isVisible(thumb)) {
        this.deleteRender(thumb.id);
      }
    }
  }

  async renderImagesInTheBackground() {
    if (this.currentlyRendering) {
      return;
    }

    if (onMobileDevice() && !this.enlargeOnClickOnMobile) {
      return;
    }

    this.currentlyRendering = true;
    const unrenderedImageThumbs = this.getVisibleUnrenderedImageThumbs();
    const imageThumbsToRender = [];
    const imagesAlreadyRenderedCount = this.imageBitmaps.size;
    const animatedThumbsToUpscale = Array.from(getAllVisibleThumbs())
      .slice(0, this.maxNumberOfImagesToRender / 2)
      .filter(thumb => !isImage(thumb) && !this.isUpscaled(thumb));

    this.upscaleAnimatedThumbs(animatedThumbsToUpscale);

    for (let i = 0; i < unrenderedImageThumbs.length && i + imagesAlreadyRenderedCount < this.maxNumberOfImagesToRender; i += 1) {
      imageThumbsToRender.push(unrenderedImageThumbs[i]);
    }

    if (imageThumbsToRender.length > 0) {
      this.renderedThumbRange.minIndex = imageThumbsToRender[0].getAttribute(Gallery.attributes.thumbIndex);
      this.renderedThumbRange.maxIndex = imageThumbsToRender[imageThumbsToRender.length - 1].getAttribute(Gallery.attributes.thumbIndex);
    }
    await this.renderImages(imageThumbsToRender);
    this.currentlyRendering = false;
  }

  /**
   * @param {HTMLElement[]} imagesToRender
   */
  async renderImages(imagesToRender) {
    for (const thumb of imagesToRender) {
      if (this.stopRendering && !onMobileDevice()) {
        break;
      }
      this.renderOriginalImage(thumb);
      await sleep(this.getImageFetchDelay(thumb.id));
    }
  }

  /**
   * @param {HTMLElement} animatedThumbs
   */
  async upscaleAnimatedThumbs(animatedThumbs) {
    if (onMobileDevice()) {
      return;
    }

    for (const thumb of animatedThumbs) {
      if (this.isUpscaled(thumb)) {
        continue;
      }
      const image = getImageFromThumb(thumb);
      let newImage = new Image();
      let source = getOriginalImageURL(image.src);

      if (isGif(thumb)) {
        source = source.replace("jpg", "gif");
      }
      newImage.src = source;
      newImage.onload = () => {
        createImageBitmap(newImage)
          .then((imageBitmap) => {
            this.upscaleThumbResolution(thumb, imageBitmap, 5.5);
            newImage = null;
          });
      };
      await sleep(this.imageFetchDelay);
    }
  }

  /**
   * @param {String} postId
   * @returns {Number}
   */
  getImageFetchDelay(postId) {
    return this.extensionIsKnown(postId) ? this.imageFetchDelay / this.extensionAlreadyKnownFetchSpeed : this.imageFetchDelay;
  }

  /**
   *
   * @param {String} postId
   * @returns {Boolean}
   */
  extensionIsKnown(postId) {
    return this.getImageExtension(postId) !== undefined;
  }

  /**
   * @returns {Number}
   */
  getMaxNumberOfImagesToRender() {
    const availableMemory = onMobileDevice() ? 100 : 420;
    const averageImageSize = 20;
    const maxImagesToRender = Math.floor(availableMemory / averageImageSize);
    return onPostPage() ? 50 : maxImagesToRender;
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {Boolean}
   */
  thumbInRenderRange(thumb) {
    const index = parseInt(thumb.getAttribute(Gallery.attributes.thumbIndex));
    return index >= this.renderedThumbRange.minIndex && index <= this.renderedThumbRange.maxIndex;
  }

  injectImageResolutionOptionsHTML() {
    const additionalFavoriteOptions = document.getElementById("additional-favorite-options");

    if (additionalFavoriteOptions === null) {
      return;
    }
    const scale = 40;
    const width = 16 * scale;
    const height = 9 * scale;
    const defaultResolution = getPreference(Gallery.preferences.resolution, Gallery.defaultResolutions.favoritesPage);
    const container = document.createElement("div");

    container.style.paddingTop = "8px";
    const resolutionLabel = document.createElement("label");
    const resolutionDropdown = document.createElement("select");

    resolutionLabel.textContent = "Image Resolution";
    resolutionDropdown.id = "resolution-dropdown";

    for (let i = 1; i <= 7680 / width; i += 1) {
      const resolution = `${i * width}x${i * height}`;
      const resolutionOption = document.createElement("option");

      if (resolution === defaultResolution) {
        resolutionOption.selected = "selected";
      }
      resolutionOption.textContent = resolution;
      resolutionDropdown.appendChild(resolutionOption);
    }
    resolutionDropdown.onchange = () => {
      setPreference(Gallery.preferences.resolution, resolutionDropdown.value);
      this.setFullscreenCanvasResolution();
    };
    container.appendChild(resolutionLabel);
    container.appendChild(document.createElement("br"));
    container.appendChild(resolutionDropdown);
    additionalFavoriteOptions.insertAdjacentElement("afterbegin", container);
    container.style.display = "none";
  }

  setFullscreenCanvasResolution() {
    const resolution = onPostPage() ? Gallery.defaultResolutions.postPage : getPreference(Gallery.preferences.resolution, Gallery.defaultResolutions.favoritesPage);
    const dimensions = resolution.split("x").map(dimension => parseFloat(dimension));

    this.fullscreenCanvas.width = dimensions[0];
    this.fullscreenCanvas.height = dimensions[1];
    this.maxNumberOfImagesToRender = this.getMaxNumberOfImagesToRender();
  }

  /**
   * @param {HTMLElement} thumb
   * @param {String} direction
   * @returns
   */
  renderInAdvanceWhileTraversingGallery(thumb, direction) {
    const lookahead = this.getLookahead();
    const forward = direction === Gallery.galleryDirections.right;
    let nextThumbToRender = this.getAdjacentVisibleThumb(thumb, forward);

    this.movedForwardInGallery = forward;

    for (let i = 0; i < lookahead; i += 1) {
      if (nextThumbToRender === null) {
        break;
      }

      if (!isImage(nextThumbToRender)) {
        nextThumbToRender = this.getAdjacentVisibleThumb(nextThumbToRender, forward);
        continue;
      }

      if (this.isNotRendered(nextThumbToRender)) {
        break;
      }
      nextThumbToRender = this.getAdjacentVisibleThumb(nextThumbToRender, forward);
    }

    if (nextThumbToRender === null) {
      return;
    }

    if (this.isNotRendered(nextThumbToRender) && isImage(nextThumbToRender)) {
      this.upscaleAnimatedVisibleThumbsAround(nextThumbToRender);
      this.renderImagesAround(nextThumbToRender);
    }
  }

  /**
   * @returns {Number}
   */
  getLookahead() {
    return Math.max(3, Math.min(10, Math.round(this.maxNumberOfImagesToRender / 2) - 2));
  }

  /**
   * @param {HTMLElement} thumb
   */
  upscaleAnimatedVisibleThumbsAround(thumb) {
    const animatedThumbsToUpscale = this.getAdjacentVisibleThumbs(thumb, 10, (t) => {
      return !isImage(t) && !this.isUpscaled(t);
    });

    this.upscaleAnimatedThumbs(animatedThumbsToUpscale);
  }

  /**
   * @param {Number[]} indices
   */
  setRenderRange(indices) {
    indices.sort((a, b) => {
      return a - b;
    });
    this.renderedThumbRange.minIndex = indices[0];
    this.renderedThumbRange.maxIndex = indices[indices.length - 1];
  }

  indexRenderRange() {
    if (this.imageBitmaps.size === 0) {
      return;
    }
    const indices = [];

    for (const postId of this.imageBitmaps.keys()) {
      const thumb = getThumbByPostId(postId);

      if (thumb === null) {
        break;
      }
      indices.push(parseInt(thumb.getAttribute(Gallery.attributes.thumbIndex)));
    }
    this.setRenderRange(indices);
  }

  /**
   * @param {ThumbNode[]} thumbNodes
   */
  async assignImageExtensionsInTheBackground(thumbNodes) {
    const postIdsWithUnknownExtensions = this.getPostIdsWithUnknownExtensions(thumbNodes);

    while (postIdsWithUnknownExtensions.length > 0) {
      await sleep(4000);

      while (postIdsWithUnknownExtensions.length > 0 && this.finishedLoading && !this.currentlyRendering) {
        const postId = postIdsWithUnknownExtensions.pop();

        if (postId !== undefined && postId !== null && !this.extensionIsKnown(postId)) {
          this.imageBitmapFetchers[0].postMessage({
            findExtension: true,
            postId
          });
          await sleep(10);
        }
      }
    }
  }

  /**
   * @param {ThumbNode[]} thumbNodes
   * @returns {String[]}
   */
  getPostIdsWithUnknownExtensions(thumbNodes) {
    return thumbNodes
      .map(thumbNode => thumbNode.root)
      .filter(thumb => isImage(thumb))
      .filter(thumb => !this.extensionIsKnown(thumb.id))
      .map(thumb => thumb.id);
  }

  createVideoBackground() {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    context.fillStyle = "black";
    context.fillRect(0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      this.videoContainer.setAttribute("poster", URL.createObjectURL(blob));
    });
  }

  createFullscreenCanvasImagePlaceholder() {
    this.fullscreenCanvasPlaceholder = document.createElement("img");
    this.fullscreenCanvasPlaceholder.src = "https://rule34.xxx/images/header2.png";
  }

  /**
   * @param {Number} duration
   */
  async pauseRendering(duration) {
    this.stopRendering = true;
    await sleep(duration);
    this.stopRendering = false;
  }

  /**
   * @param {String | Number} postId
   * @returns {String}
   */
  getImageExtension(postId) {
    return Gallery.extensionDecodings[this.imageExtensions[parseInt(postId)]];
  }

  /**
   * @param {String | Number} postId
   * @param {String} extension
   */
  setImageExtension(postId, extension) {
    this.imageExtensions[parseInt(postId)] = Gallery.extensionEncodings[extension];
  }
}

const gallery = new Gallery();
