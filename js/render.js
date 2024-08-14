const renderHTML = `<style>
  body {
    width: 99.5vw;
    overflow-x: hidden;
  }

  /* .thumb.loaded,
  .thumb-node.loaded {
    .image {
      outline: 2px solid transparent;
      animation: outlineGlow 1s forwards;
      opacity: 1;
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

  .image {
    opacity: 0.4;
    transition: transform 0.1s ease-in-out, opacity 0.5s ease;
  } */

  .image {
        outline: 2px solid white;
    }

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

  #visible-canvas {
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
</style>`;/* eslint-disable no-useless-escape */

class Renderer {
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
  static galleryKeyDownTraversalCooldown = {
    timeout: null,
    waitTime: 100,
    get ready() {
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
    imageExtensions: "imageExtensions"
  };
  static webWorkers = {
    renderer:
`
/* eslint-disable prefer-template */
const RETRY_DELAY_INCREMENT = 1000;
let retryDelay = 0;

/**
 * @param {String} imageURL
 * @param {OffscreenCanvas} canvas
 * @param {String} extension
 * @param {String} postId
 * @param {Number} thumbIndex
 */
async function drawCanvas(imageURL, canvas, extension, postId, thumbIndex) {
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
    const imageBitmap = await drawCanvasFromBlob(result.blob, canvas);

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
  return fetch("https://rule34.xxx/index.php?page=post&s=view&id=" + postId)
    .then((response) => {
      if (response.ok) {
        return response.text();
      }
      throw new Error(response.status + ": " + postPageURL);
    })
    .then((html) => {
      postMessage({
        gotPostPageHTML: html,
        postId
      });
      const imageURL = (/itemprop="image" content="(.*)"/g).exec(html);
      return imageURL[1].replace("us.rule34", "rule34");
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
      return getOriginalImageURL(postPageURL);
    });
}

/**
 * @param {String} postId
 * @returns {String}
 */
function getOriginalImageURL(postId) {
  return fetch("https://api.rule34.xxx//index.php?page=dapi&s=post&q=index&id=" + postId)
    .then((response) => {
      if (response.ok) {
        return response.text();
      }
      throw new Error(response.status + ": " + postId);
    })
    .then((html) => {
      let url;

      try {
        url = (/ file_url="(.*?)"/).exec(html)[1].replace("api-cdn.", "");
      } catch (error) {
        url = "";
      }
      return url;
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
 * @param {Blob} blob
 * @param {OffscreenCanvas} canvas
 * @returns {ImageBitmap}
 */
async function drawCanvasFromBlob(blob, canvas) {
  const imageBitmap = await createImageBitmap(blob);
  const context = canvas.getContext("2d");

  context.drawImage(imageBitmap, 0, 0);
  drawScaledCanvas(imageBitmap, context);
  return imageBitmap;
}

/**
 * @param {ImageBitmap} imageBitmap
 * @param {OffscreenCanvasRenderingContext2D} context
 */
function drawScaledCanvas(imageBitmap, context) {
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
    await drawCanvas(request.imageURL, request.offscreenCanvas, request.extension, request.postId, request.thumbIndex);
  }
};

`
  };
  static get defaultResolution() {
    return {
      postPage: "3840x2160",
      favoritesPage: "3840x2160"
    };
  }

  /**
   * @type {HTMLCanvasElement}
   */
  visibleCanvas;
  /**
   * @type {CanvasRenderingContext2D}
   */
  visibleContext;
  /**
   * @type {{height: Number, width: Number}}
   */
  visibleCanvasResolution;
  /**
   * @type {Map.<String, OffscreenCanvas>}
   */
  offscreenCanvases;
  /**
   * @type {Worker[]}
   */
  offscreenCanvasRenderers;
  /**
   * @type {String}
   */
  thumbIndexAttribute;
  /**
   * @type {Number}
   */
  renderDelay;
  /**
   * @type {{minIndex: Number, maxIndex: Number}}
   */
  renderedThumbRange;
  /**
   * @type {HTMLElement[]}
   */
  visibleThumbs;
  /**
   * @type {{id: String}}
   */
  imageExtensions;
  /**
   * @type {Number}
   */
  recentlyDiscoveredImageExtensionsCount;
  /**
   * @type {Number}
   */
  currentlySelectedThumbIndex;
  /**
   * @type {Number}
   */
  rendererIndex;
  /**
   * @type {Number}
   */
  lastSelectedThumbIndexBeforeEnteringGalleryMode;
  /**
   * @type {Boolean}
   */
  inGalleryMode;
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
  renderWhileFavoritesAreStillLoading;
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
   * @type {Number}
   */
  extensionKnownSpeed;

  constructor() {
    this.visibleCanvas = document.createElement("canvas");
    this.visibleContext = this.visibleCanvas.getContext("2d");
    this.visibleCanvasResolution = {
      width: 100,
      height: 100
    };
    this.offscreenCanvases = new Map();
    this.createOffscreenCanvasRenderers(1);
    this.extensionKnownSpeed = 8;
    this.thumbIndexAttribute = "index";
    this.renderDelay = 200;
    this.renderedThumbRange = {
      minIndex: 0,
      maxIndex: 0
    };
    this.visibleThumbs = [];
    this.imageExtensions = {};
    this.recentlyDiscoveredImageExtensionsCount = 0;
    this.currentlySelectedThumbIndex = 0;
    this.rendererIndex = 0;
    this.lastSelectedThumbIndexBeforeEnteringGalleryMode = 0;
    this.inGalleryMode = false;
    this.recentlyExitedGalleryMode = false;
    this.stopRendering = false;
    this.currentlyRendering = false;
    this.renderWhileFavoritesAreStillLoading = false;
    this.finishedLoading = onPostPage();
    this.maxNumberOfImagesToRender = this.getMaxNumberOfImagesToRender();
    this.showOriginalContentOnHover = window.location.href.includes("favorites") ? getPreference(Renderer.preferences.showOnHover, true) : false;
    this.initialize();
  }

  initialize() {
    this.createBlankVideoPoster();
    this.setVisibleCanvasResolution();
    this.addEventListeners();
    this.loadDiscoveredImageExtensions();
    this.preparePostPage();
    this.injectHTML();
    this.updateBackgroundOpacity(getPreference(Renderer.preferences.backgroundOpacity, 1));
  }

  /**
   * @param {Number} count
   */
  createOffscreenCanvasRenderers(count) {
    this.offscreenCanvasRenderers = [];

    for (let i = 0; i < count; i += 1) {
      this.offscreenCanvasRenderers.push(new Worker(getWorkerURL(Renderer.webWorkers.renderer)));
    }
  }

  injectHTML() {
    this.injectStyleHTML();
    this.injectOptionsHTML();
    this.injectOriginalContentContainerHTML();
  }

  injectStyleHTML() {
    injectStyleHTML(renderHTML);
  }

  injectOptionsHTML() {
    addOptionToFavoritesPage(
      Renderer.preferences.showOnHover,
      "Enlarge On Hover",
      "View full resolution images/play videos when hovering over any thumbnail (Middle mouse click)",
      this.showOriginalContentOnHover, (element) => {
        setPreference(Renderer.preferences.showOnHover, element.target.checked);
        this.toggleAllVisibility();
      },
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

    originalContentContainer.insertBefore(this.visibleCanvas, originalContentContainer.firstChild);
    this.background = document.getElementById("original-content-background");
    this.videoContainer = document.getElementById("original-video-container");
    this.gifContainer = document.getElementById("original-gif-container");
    this.visibleCanvas.width = this.visibleCanvasResolution.width;
    this.visibleCanvas.height = this.visibleCanvasResolution.height;
    this.visibleCanvas.id = "visible-canvas";
    this.toggleOriginalContentVisibility(this.showOriginalContentOnHover);
  }

  addEventListeners() {
    document.addEventListener("mousedown", (event) => {
      let thumb;

      switch (event.button) {
        case Renderer.clickCodes.leftClick:
          if (this.inGalleryMode) {
            if (isVideo(this.getSelectedThumb())) {
              return;
            }
            this.exitGalleryMode();
            this.toggleAllVisibility(false);
            return;
          }
          thumb = getThumbUnderCursor();

          if (thumb === null) {
            return;
          }
          this.toggleAllVisibility(true);
          this.showOriginalContent(thumb);
          this.enterGalleryMode();
          break;

        case Renderer.clickCodes.middleClick:
          event.preventDefault();

          if (hoveringOverThumb() || this.inGalleryMode) {
            this.openPostInNewPage();
          } else if (!this.inGalleryMode) {
            this.toggleAllVisibility();
          }
          break;
        /*
         * event.preventDefault();
         * const selectedThumb = this.getSelectedThumb.bind(this)();
         */

        /*
         * if (this.inGalleryMode) {
         *   this.openPostInNewPage();
         *   return;
         * }
         * this.toggleAllVisibility();
         */

        /*
         * if (isVideo(selectedThumb)) {
         *   if (this.showOriginalContentOnHover) {
         *     this.toggleCursorVisibility(false);
         *     this.playOriginalVideo(selectedThumb);
         *   } else {
         *     this.toggleCursorVisibility(true);
         *     // this.videoContainer.pause();
         *   }
         * } else if (
         *   hoveringOverThumb()
         *   && !isGif(selectedThumb)
         *   && this.showOriginalContentOnHover) {
         *   this.toggleCursorVisibility(false);
         *   this.drawVisibleCanvas(this.OFFSCREEN_CANVASES.get(selectedThumb.id));
         * } else {
         *   this.toggleCursorVisibility(true);
         * }
         */

        default:

          break;
      }
    });
    window.addEventListener("auxclick", (event) => {
      if (event.button === Renderer.clickCodes.middleClick) {
        event.preventDefault();
      }
    });
    document.addEventListener("wheel", (event) => {
      if (this.inGalleryMode) {
        const delta = (event.wheelDelta ? event.wheelDelta : -event.deltaY);
        const direction = delta > 0 ? Renderer.galleryDirections.left : Renderer.galleryDirections.right;

        this.traverseGallery.bind(this)(direction, false);
      } else if (hoveringOverThumb() && this.showOriginalContentOnHover) {
        let opacity = parseFloat(getPreference(Renderer.preferences.backgroundOpacity, 1));

        opacity -= event.deltaY * 0.0005;
        opacity = clamp(opacity, "0", "1");
        this.updateBackgroundOpacity(opacity);
      }
    }, {
      passive: true
    });
    document.addEventListener("contextmenu", (event) => {
      if (this.inGalleryMode) {
        event.preventDefault();
        this.exitGalleryMode();
        this.toggleAllVisibility(false);
      }
      /*
       * else if (hoveringOverThumb()) {
       *   event.preventDefault();
       *   this.enterGalleryMode();
       * }
       */
    });
    document.addEventListener("keydown", (event) => {
      if (this.inGalleryMode) {
        switch (event.key) {
          case Renderer.galleryDirections.a:

          case Renderer.galleryDirections.d:

          case Renderer.galleryDirections.left:

          case Renderer.galleryDirections.right:
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
            this.exitGalleryMode();
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
    window.addEventListener("favoritesAdded", (event) => {
      this.initializeThumbsForHovering.bind(this)(event.detail);
      this.enumerateVisibleThumbs();
    });
    window.addEventListener("startedFetchingFavorites", () => {
      setTimeout(() => {
        const thumbElement = document.querySelector(".thumb-node");

        if (thumbElement !== null && !this.finishedLoading) {
          this.renderImagesAround(thumbElement);
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
      this.findImageExtensionsInTheBackground();
    });
    window.addEventListener("finishedSearching", () => {
      this.enumerateVisibleThumbs();
      this.onFavoritesSearch();
    });
    this.offscreenCanvasRenderers.forEach((renderer) => {
      renderer.onmessage = (message) => {
        this.handleOffscreenCanvasRendererMessage(message.data);
      };
    });
  }

  /**
   * @param {HTMLElement[]} thumbs
   */
  initializeThumbsForHovering(thumbs) {
    const thumbElements = thumbs === undefined ? getAllThumbNodeElements() : thumbs;

    for (const thumbElement of thumbElements) {
      this.addEventListenersToThumb(thumbElement);
    }
  }

  /**
   * @param {Object} message
   */
  handleOffscreenCanvasRendererMessage(message) {
    if (message.foundExtension) {
      this.assignExtension(message.postId, message.foundExtension);
    } else if (message.gotPostPageHTML) {
      dispatchEvent(new CustomEvent("gotPostPageHTML", {
        detail: {
          html: message.gotPostPageHTML,
          postId: message.postId
        }
      }));
    } else {
      this.onRenderFinished(message);
    }
  }

  /**
   * @param {Object} message
   */
  onRenderFinished(message) {
    const thumb = document.getElementById(message.postId);

    // this.offscreenCanvases.set(message.postId, message.imageBitmap);

    if (thumb === null) {
      return;
    }
    thumb.classList.add("loaded");

    if (message.extension === "gif") {
      getImageFromThumb(thumb).setAttribute("gif", true);
      return;
    }

    if (!message.extensionAlreadyFound) {
      this.assignExtension(message.postId, message.newExtension);
    }

    if (this.showOriginalContentOnHover) {
      const thumbUnderCursor = getThumbUnderCursor();
      const hoveringOverSameThumb = (thumbUnderCursor !== null) && thumbUnderCursor.id === message.postId;
      const viewingThumbInGallery = this.inGalleryMode && this.getSelectedThumb().id === message.postId;

      if (hoveringOverSameThumb || viewingThumbInGallery) {
        this.showOriginalContent(thumb);
      }
    }
  }

  /**
   * @param {String} postId
   * @param {String} extension
   */
  assignExtension(postId, extension) {
    this.imageExtensions[postId] = extension;
    this.recentlyDiscoveredImageExtensionsCount += 1;

    if (this.recentlyDiscoveredImageExtensionsCount >= 3) {
      this.recentlyDiscoveredImageExtensionsCount = 0;

      if (!onPostPage()) {
        localStorage.setItem(Renderer.preferences.imageExtensions, JSON.stringify(this.imageExtensions));
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
      this.deleteAllRenders();
    };
    await this.findImageExtensionsOnPostPage();
    this.renderImagesInTheBackground();
  }

  deleteAllRenders() {
    this.stopRendering = true;

    for (const [id, _] of this.offscreenCanvases) {
      this.offscreenCanvases.delete(id);
    }
    this.offscreenCanvases.clear();
    this.stopRendering = false;
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
    thumb.setAttribute(this.thumbIndexAttribute, index);
  }

  /**
   * @param {HTMLElement} thumb
   */
  addEventListenersToThumb(thumb) {
    const image = getImageFromThumb(thumb);

    image.onmouseover = () => {
      if (this.inGalleryMode || this.recentlyExitedGalleryMode) {
        return;
      }
      this.showOriginalContent(thumb);
    };
    image.onmouseout = (event) => {
      if (this.inGalleryMode || enteredOverCaptionTag(event)) {
        return;
      }
      this.hideOriginalContent(thumb);
    };
  }

  loadDiscoveredImageExtensions() {
    this.imageExtensions = JSON.parse(localStorage.getItem(Renderer.preferences.imageExtensions)) || {};
  }

  openPostInNewPage() {
    const firstChild = this.getSelectedThumb().children[0];

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

  enterGalleryMode() {
    const selectedThumb = this.getSelectedThumb();

    this.lastSelectedThumbIndexBeforeEnteringGalleryMode = this.currentlySelectedThumbIndex;
    this.background.style.pointerEvents = "auto";
    this.highlightThumb(selectedThumb, true);

    if (isVideo(selectedThumb)) {
      this.toggleCursorVisibility(true);
      this.toggleVideoControls(true);
    }
    this.inGalleryMode = true;
    this.showLockIcon();
  }

  exitGalleryMode() {
    this.toggleVideoControls(false);
    this.background.style.pointerEvents = "none";
    const thumbIndex = this.getIndexOfThumbUnderCursor();

    if (thumbIndex !== this.lastSelectedThumbIndexBeforeEnteringGalleryMode) {
      this.hideOriginalContent(this.getSelectedThumb());

      if (thumbIndex !== null) {
        this.showOriginalContent(this.visibleThumbs[thumbIndex]);
      }
    }
    this.recentlyExitedGalleryMode = true;
    setTimeout(() => {
      this.recentlyExitedGalleryMode = false;
    }, 300);
    this.inGalleryMode = false;
    this.showLockIcon();
  }

  /**
   * @param {String} direction
   * @param {Boolean} keyIsHeldDown
   */
  traverseGallery(direction, keyIsHeldDown) {
    if (keyIsHeldDown && !Renderer.galleryKeyDownTraversalCooldown.ready) {
      return;
    }

    let selectedThumb = this.getSelectedThumb();

    this.clearOriginalContentSources();
    this.highlightThumb(selectedThumb, false);
    this.setNextSelectedThumbIndex(direction);
    selectedThumb = this.getSelectedThumb();
    this.highlightThumb(selectedThumb, true);
    this.renderInAdvanceWhileTraversingInGalleryMode(selectedThumb, direction);
    scrollToThumb(selectedThumb.id, false);

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
    if (direction === Renderer.galleryDirections.left || direction === Renderer.galleryDirections.a) {
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
      setPreference(Renderer.preferences.showOnHover, this.showOriginalContentOnHover);
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
    this.clearVisibleCanvas();
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
    thumb.classList.toggle("selected", value);
  }

  /**
   * @param {HTMLElement} thumb
   */
  showOriginalContent(thumb) {
    this.highlightThumb(thumb, true);
    this.currentlySelectedThumbIndex = parseInt(thumb.getAttribute(this.thumbIndexAttribute));

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
      // this.videoContainer.pause();
      return;
    }
    this.toggleVisibleCanvas(false);
    this.videoContainer.style.display = "block";
    this.playOriginalVideo(thumb);

    if (!this.inGalleryMode) {
      this.toggleVideoControls(false);
    }
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {String}
   */
  getVideoSource(thumb) {
    return getOriginalContentURL(thumb).replace("jpg", "mp4");
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
    const originalSource = getOriginalContentURL(thumb).replace("jpg", extension);

    this.gifContainer.src = originalSource;

    if (this.showOriginalContentOnHover) {
      this.gifContainer.style.visibility = "visible";
    }
  }

  /**
   * @param {HTMLElement} thumb
   */
  showOriginalImage(thumb) {
    const canvas = this.offscreenCanvases.get(thumb.id);

    if (canvas === undefined) {
      this.renderOriginalImage(thumb);
      this.renderImagesAround(thumb);
    } else {
      this.drawVisibleCanvas(canvas);
    }
    this.toggleOriginalContentVisibility(this.showOriginalContentOnHover);
  }

  /**
   * @param {String} postId
   */
  markAsUnloaded(postId) {
    const thumb = document.getElementById(postId);

    if (thumb !== null) {
      thumb.classList.remove("loaded");
    }
  }

  deleteOldRenders() {
    if (this.offscreenCanvases.size > Math.floor(this.maxNumberOfImagesToRender * 1.2)) {
      const numberOfRendersToDelete = Math.ceil(this.maxNumberOfImagesToRender / 2);
      let i = 0;

      for (const postId of this.offscreenCanvases.keys()) {
        this.offscreenCanvases.set(postId, null);
        this.offscreenCanvases.delete(postId);
        this.markAsUnloaded(postId);
        i += 1;

        if (i >= numberOfRendersToDelete) {
          break;
        }
      }
    }
  }

  /**
   * @param {HTMLElement} thumb
   */
  async renderImagesAround(thumb) {
    if (onPostPage()) {
      return;
    }
    this.deleteOldRenders();

    if (this.currentlyRendering) {
      if (this.thumbInRenderRange(thumb)) {
        return;
      }
      this.stopRendering = true;
      await sleep(this.renderDelay);
      this.stopRendering = false;
    }
    this.currentlyRendering = true;
    const numberOfImagesToRender = Math.ceil(this.maxNumberOfImagesToRender / 5);
    const imageThumbsToRender = [];
    let currentThumb = thumb;
    let previousThumb = thumb;
    let nextThumb = thumb;
    let traverseForward = true;

    while (currentThumb !== null && imageThumbsToRender.length < numberOfImagesToRender) {
      if (traverseForward) {
        nextThumb = this.getAdjacentVisibleThumb(nextThumb, true);
      } else {
        previousThumb = this.getAdjacentVisibleThumb(previousThumb, false);
      }

      if (previousThumb === null) {
        traverseForward = true;
      } else if (nextThumb === null) {
        traverseForward = false;
      } else {
        traverseForward = !traverseForward;
      }
      currentThumb = traverseForward ? nextThumb : previousThumb;

      if (this.stopRendering) {
        return;
      }

      if (currentThumb === null) {
        break;
      }

      if (this.isRenderable(currentThumb)) {
        imageThumbsToRender.push(currentThumb);
      }
    }
    const indicesOfImageThumbsToRender = imageThumbsToRender.map(imageThumb => parseInt(imageThumb.getAttribute(this.thumbIndexAttribute)));

    this.setRenderRange(indicesOfImageThumbsToRender);
    await this.renderImages(imageThumbsToRender);
    this.currentlyRendering = false;
  }

  /**
   * @param {HTMLElement} thumb
   * @param {Boolean} traverseForward
   * @returns {HTMLElement}
   */
  getAdjacentVisibleThumb(thumb, traverseForward) {
    let adjacentThumb = this.getAdjacentThumb(thumb, traverseForward);

    while (adjacentThumb !== null && !this.isVisible(adjacentThumb)) {
      adjacentThumb = this.getAdjacentThumb(adjacentThumb, traverseForward);
    }
    return adjacentThumb;
  }

  /**
   * @param {HTMLElement} thumb
   * @param {Boolean} traverseForward
   * @returns {HTMLElement}
   */
  getAdjacentThumb(thumb, traverseForward) {
    return traverseForward ? thumb.nextElementSibling : thumb.previousElementSibling;
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
  isRenderable(thumb) {
    return this.isVisible(thumb) && isImage(thumb) && this.isNotRendered(thumb);
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {Boolean}
   */
  isNotRendered(thumb) {
    return this.offscreenCanvases.get(thumb.id) === undefined;
  }

  /**
   * @param {HTMLElement} thumb
   */
  renderOriginalImage(thumb) {
    const {canvas, offscreen: offscreenCanvas} = this.createTransferableOffscreenCanvas();
    const renderMessage = {
      offscreenCanvas,
      imageURL: getOriginalContentURL(thumb),
      postId: thumb.id,
      thumbIndex: thumb.getAttribute(this.thumbIndexAttribute),
      extension: this.imageExtensions[thumb.id]
    };

    this.offscreenCanvases.set(thumb.id, canvas);
    this.offscreenCanvasRenderers[this.rendererIndex].postMessage(renderMessage, [offscreenCanvas]);
    this.rendererIndex += 1;
    this.rendererIndex = this.rendererIndex < this.offscreenCanvasRenderers.length ? this.rendererIndex : 0;
  }

  /**
   * @param {Boolean} value
   */
  toggleOriginalContentVisibility(value) {
    this.toggleVisibleCanvas(value);
    // this.toggleOriginalVideo(value);
    this.toggleOriginalGIF(value);
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

    /*
     * if (value === undefined) {
     *   image.style.cursor = image.style.cursor === "pointer" ? "none" : "pointer";
     *   return;
     * }
     */

    /*
     * if (value) {
     *   image.style.cursor = "pointer";
     *   document.body.style.cursor = "pointer";
     * } else {
     *   image.style.cursor = "none";
     *   document.body.style.cursor = "none";
     * }
     */
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
  toggleVisibleCanvas(value) {
    if (value === undefined) {
      this.visibleCanvas.style.visibility = this.visibleCanvas.style.visibility === "visible" ? "hidden" : "visible";
    } else {
      this.visibleCanvas.style.visibility = value ? "visible" : "hidden";
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
    setPreference(Renderer.preferences.backgroundOpacity, opacity);
  }

  /**
   * @returns {Number}
   */
  getIndexOfThumbUnderCursor() {
    const thumb = getThumbUnderCursor();
    return thumb === null ? null : parseInt(thumb.getAttribute(this.thumbIndexAttribute));
  }

  /**
   * @returns {HTMLElement}
   */
  getSelectedThumb() {
    return this.visibleThumbs[this.currentlySelectedThumbIndex];
  }

  /**
   * @param {HTMLCanvasElement} canvas
   */
  drawVisibleCanvas(canvas) {
    this.visibleContext.drawImage(canvas, 0, 0);
  }

  clearVisibleCanvas() {
    this.visibleContext.clearRect(0, 0, this.visibleCanvas.width, this.visibleCanvas.height);
  }

  showEyeIcon() {
    const eyeIcon = document.getElementById("svg-eye");
    const svg = this.showOriginalContentOnHover ? Renderer.icons.openEye : Renderer.icons.closedEye;

    if (eyeIcon) {
      eyeIcon.remove();
    }
    showOverlayingIcon(svg, "svg-eye", 100, 100, "bottom-right");
  }

  showLockIcon() {
    const lockIcon = document.getElementById("svg-lock");
    const svg = this.inGalleryMode ? Renderer.icons.closedLock : Renderer.icons.openLock;

    if (lockIcon) {
      lockIcon.remove();
    }
    showOverlayingIcon(svg, "svg-lock", 100, 100, "bottom-left");
  }

  /**
   * @returns {{canvas: HTMLCanvasElement, offscreen: OffscreenCanvas}}
   */
  createTransferableOffscreenCanvas() {
    const canvas = document.createElement("canvas");

    canvas.width = this.visibleCanvasResolution.width;
    canvas.height = this.visibleCanvasResolution.height;
    const offscreen = canvas.transferControlToOffscreen();
    return {
      canvas,
      offscreen
    };
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

  onFavoritesSearch() {
    for (const thumb of getAllThumbNodeElements()) {
      if (this.offscreenCanvases.get(thumb.id) !== undefined) {
        thumb.classList.add("loaded");
      }
    }
    this.stopRendering = true;
    setTimeout(() => {
      this.stopRendering = false;
      this.renderImagesInTheBackground();
    }, 100);
    this.deleteRendersNotIncludedInNewSearch();
  }

  deleteRendersNotIncludedInNewSearch() {

    for (const [id, _] of this.offscreenCanvases) {
      const thumb = document.getElementById(id);

      if (!this.isVisible(thumb)) {
        this.offscreenCanvases.delete(id);
      }
    }
  }

  async renderImagesInTheBackground() {
    if (this.currentlyRendering) {
      return;
    }
    this.currentlyRendering = true;
    const imageThumbsToRender = [];
    const allImageThumbs = this.getVisibleUnrenderedImageThumbs();
    const imagesAlreadyRenderedCount = this.offscreenCanvases.size;

    for (let i = 0; i < allImageThumbs.length && i + imagesAlreadyRenderedCount < this.maxNumberOfImagesToRender; i += 1) {
      imageThumbsToRender.push(allImageThumbs[i]);
    }

    if (imageThumbsToRender.length > 0) {
      this.renderedThumbRange.minIndex = imageThumbsToRender[0].getAttribute(this.thumbIndexAttribute);
      this.renderedThumbRange.maxIndex = imageThumbsToRender[imageThumbsToRender.length - 1].getAttribute(this.thumbIndexAttribute);
    }
    await this.renderImages(imageThumbsToRender);
    this.currentlyRendering = false;
  }

  /**
   * @param {HTMLElement[]} imagesToRender
   */
  async renderImages(imagesToRender) {
    for (const thumb of imagesToRender) {
      if (this.stopRendering) {
        break;
      }
      this.renderOriginalImage(thumb);
      await sleep(this.getRenderDelay(thumb.id));
    }
  }

  /**
   * @param {String} postId
   * @returns {Number}
   */
  getRenderDelay(postId) {
    // const extensionKnownSpeed = onPostPage() ? 4 : 2;
    return this.extensionIsKnown(postId) ? this.renderDelay / this.extensionKnownSpeed : this.renderDelay;
  }

  /**
   *
   * @param {String} postId
   * @returns {Boolean}
   */
  extensionIsKnown(postId) {
    return this.imageExtensions[postId] !== undefined;
  }

  /**
   * @returns {Number}
   */
  getMaxNumberOfImagesToRender() {
    const width = this.visibleCanvasResolution.width;
    const height = this.visibleCanvasResolution.height;
    const rgba = 4;
    const megabyteSize = 1048576;
    const availableVRAM = 2000;
    const maxImagesToRender = Math.floor((availableVRAM / ((width * height * rgba) / megabyteSize)));
    return maxImagesToRender;
  }

  /**
   * @param {HTMLElement} thumb
   * @returns
   */
  thumbInRenderRange(thumb) {
    const index = parseInt(thumb.getAttribute(this.thumbIndexAttribute));
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
    const defaultResolution = getPreference(Renderer.preferences.resolution, Renderer.defaultResolution.favoritesPage);
    const container = document.createElement("div");

    container.style.paddingTop = "8px";
    const resolutionLabel = document.createElement("label");
    const resolutionDropdown = document.createElement("select");

    resolutionLabel.textContent = "Image Resolution";
    resolutionDropdown.id = "resolution-dropdown";

    for (let i = 1; i <= 5120 / width; i += 1) {
      const resolution = `${i * width}x${i * height}`;
      const resolutionOption = document.createElement("option");

      if (resolution === defaultResolution) {
        resolutionOption.selected = "selected";
      }
      resolutionOption.textContent = resolution;
      resolutionDropdown.appendChild(resolutionOption);
    }
    resolutionDropdown.onchange = () => {
      this.stopRendering = true;
      setTimeout(() => {
        this.stopRendering = false;

        for (const postId of this.offscreenCanvases.keys()) {
          this.offscreenCanvases.set(postId, null);
          this.offscreenCanvases.delete(postId);
          this.markAsUnloaded(postId);
        }
      }, this.renderDelay);
      setPreference(Renderer.preferences.resolution, resolutionDropdown.value);
      this.setVisibleCanvasResolution();
    };
    container.appendChild(resolutionLabel);
    container.appendChild(document.createElement("br"));
    container.appendChild(resolutionDropdown);
    additionalFavoriteOptions.insertAdjacentElement("afterbegin", container);
  }

  setVisibleCanvasResolution() {
    const resolution = onPostPage() ? Renderer.defaultResolution.postPage : getPreference(Renderer.preferences.resolution, Renderer.defaultResolution.favoritesPage);
    const dimensions = resolution.split("x").map(dimension => parseFloat(dimension));

    this.visibleCanvasResolution.width = dimensions[0];
    this.visibleCanvasResolution.height = dimensions[1];
    this.visibleCanvas.width = dimensions[0];
    this.visibleCanvas.height = dimensions[1];
    this.maxNumberOfImagesToRender = this.getMaxNumberOfImagesToRender();
  }

  /**
   * @param {HTMLElement} thumb
   * @param {String} direction
   * @returns
   */
  renderInAdvanceWhileTraversingInGalleryMode(thumb, direction) {
    const currentThumbIndex = parseInt(thumb.getAttribute(this.thumbIndexAttribute));
    const lookahead = Math.min(8, Math.round(this.maxNumberOfImagesToRender / 2) - 2);
    let possiblyUnrenderedThumbIndex;

    if (direction === Renderer.galleryDirections.left || direction === Renderer.galleryDirections.a) {
      possiblyUnrenderedThumbIndex = currentThumbIndex - lookahead;
    } else {
      possiblyUnrenderedThumbIndex = currentThumbIndex + lookahead;
    }

    if (possiblyUnrenderedThumbIndex < 0 || possiblyUnrenderedThumbIndex >= this.visibleThumbs.length) {
      return;
    }
    const possiblyUnrenderedThumb = this.visibleThumbs[possiblyUnrenderedThumbIndex];

    if (this.offscreenCanvases.get(possiblyUnrenderedThumb.id) !== undefined) {
      return;
    }
    this.renderImagesAround(possiblyUnrenderedThumb);
  }

  setRenderRange(indices) {
    indices.sort((a, b) => {
      return a - b;
    });
    this.renderedThumbRange.minIndex = indices[0];
    this.renderedThumbRange.maxIndex = indices[indices.length - 1];
  }

  indexRenderRange() {
    if (this.offscreenCanvases.size === 0) {
      return;
    }
    const indices = [];

    for (const postId of this.offscreenCanvases.keys()) {
      const thumb = getThumbByPostId(postId);

      if (thumb === null) {
        break;
      }
      indices.push(parseInt(thumb.getAttribute(this.thumbIndexAttribute)));
    }
    this.setRenderRange(indices);
  }

  async findImageExtensionsInTheBackground() {
    const postIdsWithUnknownExtensions = Array.from(getAllThumbNodeElements())
      .filter(thumb => isImage(thumb))
      .filter(thumb => !this.extensionIsKnown(thumb.id))
      .map(thumb => thumb.id);

    while (postIdsWithUnknownExtensions.length > 0) {
      await sleep(2000);

      while (this.finishedLoading && !this.currentlyRendering && postIdsWithUnknownExtensions.length > 0) {
        const postId = postIdsWithUnknownExtensions.pop();

        if (postId !== undefined && postId !== null && !this.extensionIsKnown(postId)) {
          this.offscreenCanvasRenderers[0].postMessage({
            findExtension: true,
            postId
          });
          await sleep(15);
        }
      }
    }
  }

  createBlankVideoPoster() {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    context.fillStyle = "black";
    context.fillRect(0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      this.videoContainer.setAttribute("poster", URL.createObjectURL(blob));
    });
  }
}

const renderer = new Renderer();
