class Gallery {
  static galleryHTML = `
<style>
  body {
    width: 99.5vw;
    overflow-x: hidden;
  }

  #gallery-container {

    >canvas,
    img {
      float: left;
      overflow: hidden;
      pointer-events: none;
      position: fixed;
      height: 100vh;
      margin: 0;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
  }

  #original-video-container {
    cursor: default;

    video {
      top: 0;
      left: 0;
      display: none;
      position: fixed;
      z-index: 9998;
    }
  }

  #low-resolution-canvas {
    z-index: 9996;
  }

  #main-canvas {
    z-index: 9997;
  }

  #original-gif-container {
    z-index: 9995;
  }

  a.hide {
    cursor: default;
  }

  option {
    font-size: 15px;
  }

  #original-content-background {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: black;
    z-index: 999;
    display: none;
    pointer-events: none;
    cursor: default;
    -webkit-user-drag: none;
    -khtml-user-drag: none;
    -moz-user-drag: none;
    -o-user-drag: none;
  }

  #original-content-background-link-mask {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: red;
    z-index: 10001;
    pointer-events: none;
    cursor: default;
    display: none;
    opacity: 0;
    -webkit-user-drag: none;
    -khtml-user-drag: none;
    -moz-user-drag: none;
    -o-user-drag: none;

    &.active {
      pointer-events: all;
    }
  }
</style>
`;
  static galleryDebugHTML = `
  .thumb,
  .favorite {
    &.debug-selected {
      outline: 3px solid #0075FF !important;
    }

    &.loaded {

      div, a {
        outline: 2px solid transparent;
        animation: outlineGlow 1s forwards;
      }

      .image {
        opacity: 1;
      }
    }

    >a
    >canvas {
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

  #main-canvas, #low-resolution-canvas {
    opacity: 0.25;
  }

  #original-video-container {
    video {
      opacity: 0.15;
    }
  }

  `;
  static directions = {
    d: "d",
    a: "a",
    right: "ArrowRight",
    left: "ArrowLeft"
  };
  static preferences = {
    showOnHover: "showImagesWhenHovering",
    backgroundOpacity: "galleryBackgroundOpacity",
    resolution: "galleryResolution",
    enlargeOnClick: "enlargeOnClick"
  };
  static canvasResolutions = {
    search: "3840x2160",
    favorites: Utils.onMobileDevice() ? "1920x1080" : "7680x4320",
    low: Utils.onMobileDevice() ? "640x360" : "1280:720"
  };
  static swipeControls = {
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
  static commonVideoAttributes = "width=\"100%\" height=\"100%\" autoplay muted loop controlsList=\"nofullscreen\" webkit-playsinline playsinline";
  static settings = {
    maxImagesToRenderInBackground: 50,
    maxImagesToRenderAround: Utils.onMobileDevice() ? 3 : 50,
    megabyteLimit: Utils.onMobileDevice() ? 0 : 400,
    minImagesToRender: Utils.onMobileDevice() ? 3 : 8,
    imageFetchDelay: 250,
    throttledImageFetchDelay: 400,
    imageFetchDelayWhenExtensionKnown: Utils.onMobileDevice() ? 50 : 25,
    upscaledThumbResolutionFraction: 4,
    upscaledAnimatedThumbResolutionFraction: 6,
    animatedThumbsToUpscaleRange: 20,
    animatedThumbsToUpscaleDiscrete: 20,
    traversalCooldownTime: 300,
    renderOnPageChangeCooldownTime: 2000,
    addFavoriteCooldownTime: 250,
    cursorVisibilityCooldownTime: 500,
    imageExtensionAssignmentCooldownTime: 1000,
    additionalVideoPlayerCount: Utils.onMobileDevice() ? 2 : 2,
    renderAroundAggressively: true,
    loopAtEndOfGalleryValue: false,
    get loopAtEndOfGallery() {
      if (!Utils.onFavoritesPage() || !Gallery.finishedLoading) {
        return true;
      }
      return this.loopAtEndOfGalleryValue;
    },
    endlessSearchPageGallery: true,
    debugEnabled: false,
    idleInteractionTimeout: 250,
    renderOnInteractionEnd: true
  };
  static keyHeldDownTraversalCooldown = new Cooldown(Gallery.settings.traversalCooldownTime);
  static backgroundRenderingOnPageChangeCooldown = new Cooldown(Gallery.settings.renderOnPageChangeCooldownTime, true);
  static addOrRemoveFavoriteCooldown = new Cooldown(Gallery.settings.addFavoriteCooldownTime, true);
  static cursorVisibilityCooldown = new Cooldown(Gallery.settings.cursorVisibilityCooldownTime);
  static finishedLoading = Utils.onSearchPage();
  /**
   * @type {HTMLElement[]}
   */
  static visibleThumbs;
  /**
   * @returns {Boolean}
   */
  static get disabled() {
    return (Utils.onMobileDevice() && Utils.onSearchPage()) || Utils.getPerformanceProfile() > 0 || Utils.onPostPage();
  }

  /**
   * @type {HTMLImageElement}
   */
  gifContainer;
  /**
   * @type {HTMLDivElement}
   */
  originalImageLinkMask;
  /**
   * @type {HTMLAnchorElement}
   */
  background;
  /**
   * @type {HTMLElement}
   */
  thumbUnderCursor;
  /**
   * @type {HTMLElement}
   */
  lastEnteredThumb;
  /**
   * @type {Map.<String, String>}
   */
  enumeratedThumbs;
  /**
   * @type {String}
   */
  foundFavoriteId;
  /**
   * @type {String}
   */
  changedPageInGalleryDirection;
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
  lastSelectedThumbIndexBeforeEnteringGallery;
  /**
   * @type {Number}
   */
  currentBatchRenderRequestId;
  /**
   * @type {Boolean}
   */
  inGallery;
  /**
   * @type {Boolean}
   */
  recentlyEnteredGallery;
  /**
   * @type {Boolean}
   */
  recentlyExitedGallery;
  /**
   * @type {Boolean}
   */
  leftPage;
  /**
   * @type {Boolean}
   */
  favoritesWereFetched;
  /**
   * @type {Boolean}
   */
  showOriginalContentOnHover;
  /**
   * @type {Boolean}
   */
  enlargeOnClickOnMobile;
  /**
   * @type {Autoplay}
   */
  autoplayController;
  /**
   * @type {VideoController}
   */
  videoController;
  /**
   * @type {RendererInterface}
   */
  renderer;
  /**
   * @type {PostLoader}
   */
  postLoader;
  /**
   * @type {InteractionTracker}
   */
  interactionTracker;
  /**
   * @type {Number}
   */
  currentSearchPageNumber;
  /**
   * @type {HTMLElement}
   */
  searchPageImageContainer;

  /**
   * @type {Boolean}
   */
  get changedPageWhileInGallery() {
    return this.changedPageInGalleryDirection !== null;
  }

  constructor() {
    if (Gallery.disabled) {
      return;
    }
    this.initializeFields();
    this.initializeTimers();
    this.addEventListeners();
    this.insertHTML();
    this.initializeComponents();
    this.initializeSearchPage();
    this.toggleOriginalContentVisibility(false);
    this.updateBackgroundOpacity(Utils.getPreference(Gallery.preferences.backgroundOpacity, 1));
    this.createMobileTapControls();
  }

  initializeFields() {
    this.thumbUnderCursor = null;
    this.lastEnteredThumb = null;
    this.enumeratedThumbs = new Map();
    Gallery.visibleThumbs = [];
    this.foundFavoriteId = null;
    this.changedPageInGalleryDirection = null;
    this.recentlyDiscoveredImageExtensionCount = 0;
    this.currentlySelectedThumbIndex = 0;
    this.lastSelectedThumbIndexBeforeEnteringGallery = 0;
    this.currentBatchRenderRequestId = 0;
    this.inGallery = false;
    this.recentlyEnteredGallery = false;
    this.recentlyExitedGallery = false;
    this.leftPage = false;
    this.favoritesWereFetched = false;
    this.showOriginalContentOnHover = Utils.getPreference(Gallery.preferences.showOnHover, true);
    this.enlargeOnClickOnMobile = Utils.getPreference(Gallery.preferences.enlargeOnClick, true);
    this.currentSearchPageNumber = this.getCurrentSearchPageNumber();
    this.searchPageImageContainer = this.getSearchPageImageContainer();
  }

  /**
   * @returns {HTMLElement}
   */
  getSearchPageImageContainer() {
    if (!Utils.onSearchPage()) {
      return null;
    }

    const thumb = document.querySelector(".thumb");

    if (thumb !== null) {
      return thumb.parentElement;
    }
    return document.querySelector(".image-list");
  }

  initializeComponents() {
    this.renderer = new RendererInterface();
    this.videoController = new VideoController();
    this.postLoader = new PostLoader();

    if (Gallery.settings.renderOnInteractionEnd) {
      this.interactionTracker = new InteractionTracker(Gallery.settings.idleInteractionTimeout, () => {
        if (this.thumbUnderCursor !== null) {
          this.renderImagesAround(this.thumbUnderCursor);
        }
      });
    }
    this.createAutoplayController();
  }

  initializeTimers() {
    Gallery.backgroundRenderingOnPageChangeCooldown.onDebounceEnd = () => {
      this.onPageChange();
    };
  }

  addEventListeners() {
    this.addGalleryEventListeners();
    this.addFavoritesLoaderEventListeners();
    this.addMobileEventListeners();
    this.addMemoryManagementEventListeners();
  }

  addGalleryEventListeners() {
    window.addEventListener("load", () => {
      if (Utils.onSearchPage()) {
        this.addEventListenersToThumbs.bind(this)();
        this.enumerateThumbs();
      }
      this.hideCaptionsWhenShowingOriginalContent();
    }, {
      once: true,
      passive: true
    });

    // eslint-disable-next-line complexity
    document.addEventListener("mousedown", (event) => {
      if (this.clickedOnAutoplayMenu(event)) {
        return;
      }
      const clickedOnTapControls = event.target.classList.contains("mobile-tap-control");

      if (clickedOnTapControls) {
        return;
      }
      const clickedOnAnImage = event.target.tagName.toLowerCase() === "img" && !event.target.parentElement.classList.contains("add-or-remove-button");
      const clickedOnAThumb = clickedOnAnImage && (Utils.getThumbFromImage(event.target).className.includes("thumb") || Utils.getThumbFromImage(event.target).className.includes(Utils.favoriteItemClassName));
      const clickedOnACaptionTag = event.target.classList.contains("caption-tag");
      const thumb = clickedOnAThumb ? Utils.getThumbFromImage(event.target) : null;

      if (clickedOnAThumb) {
        this.currentlySelectedThumbIndex = this.getIndexFromThumb(thumb);
      }

      if (event.ctrlKey && event.button === Utils.clickCodes.left) {
        return;
      }

      switch (event.button) {
        case Utils.clickCodes.left:
          if (event.shiftKey && (this.inGallery || clickedOnAThumb)) {
            this.openPostInNewPage();
            return;
          }

          if (this.inGallery) {
            if (Utils.isVideo(this.getSelectedThumb()) && !Utils.onMobileDevice()) {
              return;
            }
            this.exitGallery();
            this.toggleAllVisibility(false);
            return;
          }

          if (!clickedOnAThumb) {
            return;
          }

          if (Utils.onMobileDevice()) {
            if (!this.enlargeOnClickOnMobile) {
              this.openPostInNewPage(thumb);
              return;
            }
            this.renderer.deleteAllRenders();
          }

          if (Utils.onMobileDevice()) {
            this.renderImagesAround(thumb);
          }

          this.toggleAllVisibility(true);
          this.enterGallery();
          this.showOriginalContent(thumb);
          break;

        case Utils.clickCodes.middle:
          event.preventDefault();

          if (this.inGallery || (clickedOnAThumb && Utils.onSearchPage())) {
            this.openPostInNewPage();
            return;
          }

          if (!clickedOnAThumb && !clickedOnACaptionTag) {
            this.toggleAllVisibility();
            Utils.setPreference(Gallery.preferences.showOnHover, this.showOriginalContentOnHover);

            if (!this.showOriginalContentOnHover) {
              this.renderer.clearMainCanvas();
              this.renderer.clearLowResolutionCanvas();
            }
          }
          break;

        default:
          break;
      }
    });
    window.addEventListener("auxclick", (event) => {
      if (event.button === Utils.clickCodes.middle) {
        event.preventDefault();
      }
    });
    document.addEventListener("wheel", (event) => {
      if (event.shiftKey) {
        return;
      }

      if (this.inGallery) {
        if (event.ctrlKey) {
          return;
        }
        const delta = (event.wheelDelta ? event.wheelDelta : -event.deltaY);
        const direction = delta > 0 ? Gallery.directions.left : Gallery.directions.right;

        this.navigate.bind(this)(direction, false);
      } else if (this.thumbUnderCursor !== null && this.showOriginalContentOnHover) {
        let opacity = parseFloat(Utils.getPreference(Gallery.preferences.backgroundOpacity, 1));

        opacity -= event.deltaY * 0.0005;
        opacity = Utils.clamp(opacity, "0", "1");
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
      if (!this.inGallery) {
        return;
      }

      switch (event.key) {
        case Gallery.directions.a:

        case Gallery.directions.d:

        case Gallery.directions.left:

        case Gallery.directions.right:
          this.navigate(event.key, event.repeat);
          break;

        case "X":

        case "x":
          this.unFavoriteSelectedContent();
          break;

        case " ":
          if (Utils.isVideo(this.getSelectedThumb())) {
            const video = this.videoController.getActiveVideoPlayer();

            if (video === document.activeElement) {
              return;
            }

            if (video.paused) {
              video.play().catch(() => { });
            } else {
              video.pause();
            }
          }
          break;

        case "Control":
          if (!event.repeat) {
            this.toggleCtrlClickOpenMediaInNewTab(true);
          }
          break;

        default:
          break;
      }
    }, {
      passive: true
    });
    window.addEventListener("keydown", async(event) => {
      if (!this.inGallery) {
        return;
      }
      const zoomedIn = document.getElementById("main-canvas-zoom") !== null;

      switch (event.key) {
        case "F":

        case "f":
          await this.addFavoriteInGallery(event);
          break;

        case "M":

        case "m":
          if (Utils.isVideo(this.getSelectedThumb())) {
            this.videoController.getActiveVideoPlayer().muted = !this.videoController.getActiveVideoPlayer().muted;
          }
          break;

        case "B":

        case "b":
          this.toggleBackgroundOpacity();
          break;

        case "n":
          this.toggleCursorVisibility(true);
          Gallery.cursorVisibilityCooldown.restart();
          break;

        case "Escape":
          this.exitGallery();
          this.toggleAllVisibility(false);
          break;

        default:
          break;
      }
    }, {
      passive: true
    });
    window.addEventListener("keyup", (event) => {
      if (!this.inGallery) {
        return;
      }

      switch (event.key) {
        case "Control":
          this.toggleCtrlClickOpenMediaInNewTab(false);
          break;

        default:
          break;
      }
    });
    window.addEventListener("blur", () => {
      this.toggleCtrlClickOpenMediaInNewTab(false);
    });
    window.addEventListener("dblclick", (event) => {
      if (this.inGallery && !this.recentlyEnteredGallery && !this.clickedOnAutoplayMenu(event)) {
        this.exitGallery();
        this.toggleAllVisibility(false);
      }
    });
  }

  /**
   * @param {MouseEvent | TouchEvent} event
   */
  clickedOnAutoplayMenu(event) {
    const autoplayMenu = document.getElementById("autoplay-menu");
    return autoplayMenu !== null && autoplayMenu.contains(event.target);
  }

  addFavoritesLoaderEventListeners() {
    if (Utils.onSearchPage()) {
      return;
    }
    window.addEventListener("favoritesFetched", () => {
      this.addEventListenersToThumbs.bind(this)();
      this.enumerateThumbs();
    });
    window.addEventListener("newFavoritesFoundOnReload", (event) => {
      const favorites = event.detail;

      if (favorites.length === 0) {
        return;
      }
      this.addEventListenersToThumbs.bind(this)(favorites);
      this.enumerateThumbs();
      /**
       * @type {HTMLElement[]}
       */
      const reversedFavorites = favorites.reverse();

      if (reversedFavorites.length > 0) {
        const favorite = reversedFavorites[0];

        this.renderer.upscaleAnimatedThumbsAround(favorite);
        this.renderer.renderImages(reversedFavorites
          .filter(t => Utils.isImage(t))
          .slice(0, 20));
      }
    }, {
      once: true
    });
    window.addEventListener("startedFetchingFavorites", () => {
      this.favoritesWereFetched = true;
      setTimeout(() => {
        const thumb = document.querySelector(`.${Utils.favoriteItemClassName}`);

        this.renderer.renderImagesInTheBackground();

        if (thumb !== null && !Gallery.finishedLoading) {
          this.renderer.upscaleAnimatedThumbsAround(thumb);
        }
      }, 650);
    }, {
      once: true
    });
    window.addEventListener("favoritesLoaded", async() => {
      Gallery.backgroundRenderingOnPageChangeCooldown.waitTime = 1000;
      Gallery.finishedLoading = true;
      this.addEventListenersToThumbs.bind(this)();
      this.enumerateThumbs();
      this.renderer.findImageExtensionsInTheBackground();

      if (!this.favoritesWereFetched) {
        await Utils.sleep(50);
        this.renderer.renderImagesInTheBackground();
      }
    }, {
      once: true
    });
    window.addEventListener("changedPage", () => {
      this.addEventListenersToThumbs.bind(this)();
      this.enumerateThumbs();

      if (this.changedPageWhileInGallery) {
        this.renderer.upscaleAllRenderedThumbs();
      } else {
        this.renderer.clearMainCanvas();
        this.videoController.clearVideoSources();
        this.toggleOriginalContentVisibility(false);
        this.renderer.deleteAllRenders();

        if (Gallery.settings.debugEnabled) {
          Utils.getAllThumbs().forEach((thumb) => {
            thumb.classList.remove("loaded");
            thumb.classList.remove("debug-selected");
          });
        }
      }
      this.onPageChange();
    });
    window.addEventListener("foundFavorite", (event) => {
      this.foundFavoriteId = event.detail;
    });
    window.addEventListener("shuffle", () => {
      this.enumerateThumbs();
      this.renderer.deleteAllRenders();
      this.renderer.renderImagesInTheBackground();
    });
    window.addEventListener("didNotChangePageInGallery", (event) => {
      if (this.inGallery) {
        this.setNextSelectedThumbIndex(event.detail);
        this.navigateHelper();
      }
    });
  }

  addMobileEventListeners() {
    if (!Utils.onMobileDevice()) {
      return;
    }
    window.addEventListener("blur", () => {
      this.renderer.deleteAllRenders();
    });
    document.addEventListener("touchstart", (event) => {
      if (!this.inGallery) {
        return;
      }

      if (!this.clickedOnAutoplayMenu(event)) {
        event.preventDefault();
      }
      Gallery.swipeControls.set(event, true);
    }, {
      passive: false
    });
    document.addEventListener("touchend", (event) => {
      if (!this.inGallery ||
        // event.target.classList.contains("mobile-tap-control") ||
        this.clickedOnAutoplayMenu(event)
      ) {
        return;
      }
      event.preventDefault();
      Gallery.swipeControls.set(event, false);

      if (Gallery.swipeControls.up) {
        this.autoplayController.showMenu();
        return;
      }

      if (Gallery.swipeControls.down) {
        this.exitGallery();
        this.toggleAllVisibility(false);
        return;
      }

      if (Utils.isVideo(this.getSelectedThumb())) {
        return;
      }

      if (Gallery.swipeControls.left) {
        this.navigate(Gallery.directions.right, false);
        return;
      }

      if (Gallery.swipeControls.right) {
        this.navigate(Gallery.directions.left, false);

      }
      // this.exitGallery();
      // this.toggleAllVisibility(false);

    }, {
      passive: false
    });
    window.addEventListener("orientationchange", () => {
      this.renderer.setOrientation();
      this.preventMobileAddressBarInGallery();
    }, {
      passive: true
    });
  }

  preventMobileAddressBarInGallery() {
    if (!Utils.onMobileDevice || !this.inGallery || window.scrollY > 10) {
      return;
    }
    window.scrollTo(0, 10);
  }

  createMobileTapControls() {
    if (!Utils.onMobileDevice()) {
      return;
    }
    const tapControlContainer = document.createElement("div");
    const leftTap = document.createElement("div");
    const rightTap = document.createElement("div");

    tapControlContainer.id = "tap-control-container";
    leftTap.className = "mobile-tap-control";
    rightTap.className = "mobile-tap-control";
    leftTap.id = "left-mobile-tap-control";
    rightTap.id = "right-mobile-tap-control";
    tapControlContainer.appendChild(leftTap);
    tapControlContainer.appendChild(rightTap);
    document.getElementById("gallery-container").appendChild(tapControlContainer);
    Utils.insertStyleHTML(`
            .mobile-tap-control {
                position: fixed;
                top: 50%;
                height: 65vh;
                width: 25vw;
                opacity: 0;
                background: red;
                z-index: 9999;
                color: red;
                transform: translateY(-50%);
            }

            #left-mobile-tap-control {
                left: 0;
            }

            #right-mobile-tap-control {
                right: 0;
            }
        `);
    this.toggleTapTraversal(false);
    leftTap.ontouchend = () => {
      if (this.inGallery) {
        this.navigate(Gallery.directions.left, false);
      }
    };
    rightTap.ontouchend = () => {
      if (this.inGallery) {
        this.navigate(Gallery.directions.right, false);
      }
    };
  }

  /**
   * @param {Boolean} value
   */
  toggleTapTraversal(value) {
    Utils.insertStyleHTML(`
            .mobile-tap-control {
                pointer-events: ${value ? "auto" : "none"};
            }
        `, "tap-traversal");
  }

  addMemoryManagementEventListeners() {
    if (Utils.onFavoritesPage()) {
      return;
    }
    window.addEventListener("blur", () => {
      if (Gallery.settings.endlessSearchPageGallery) {
        return;
      }
      this.leftPage = true;
      this.renderer.deleteAllRenders();
      this.videoController.clearInactiveVideoSources();
    });
    window.addEventListener("focus", () => {
      if (this.leftPage && !Gallery.settings.endlessSearchPageGallery) {
        this.renderer.renderImagesInTheBackground();
        this.leftPage = false;
      }
    });
  }

  async initializeSearchPage() {
    if (!Utils.onSearchPage()) {
      return;
    }

    if (Gallery.settings.endlessSearchPageGallery) {
      window.addEventListener("load", async() => {
        await this.postLoader.loadCurrentChunk();
        const thumb = document.querySelector(".thumb");

        if (thumb !== null) {
          this.renderImagesAroundOnSearchPage(thumb);
        }
      });

    } else {
      await Utils.findImageExtensionsOnSearchPage();
      dispatchEvent(new Event("foundExtensionsOnSearchPage"));
      this.renderer.renderImagesInTheBackground();
    }
  }

  insertHTML() {
    this.insertStyleHTML();
    this.insertDebugHTML();
    this.insertOptionsHTML();
    this.insertOriginalContentContainerHTML();

  }

  insertStyleHTML() {
    Utils.insertStyleHTML(Gallery.galleryHTML, "gallery");
  }

  insertDebugHTML() {
    if (Gallery.settings.debugEnabled) {
      Utils.insertStyleHTML(Gallery.galleryDebugHTML, "gallery-debug");
    }
  }

  insertOptionsHTML() {
    this.insertShowOnHoverOption();
  }

  insertShowOnHoverOption() {
    let optionId = "show-content-on-hover";
    let optionText = "Fullscreen on Hover";
    let optionTitle = "View full resolution images or play videos and GIFs when hovering over a thumbnail";
    let optionIsChecked = this.showOriginalContentOnHover;
    let onOptionChanged = (event) => {
      Utils.setPreference(Gallery.preferences.showOnHover, event.target.checked);
      this.toggleAllVisibility(event.target.checked);
    };

    if (Utils.onMobileDevice()) {
      optionId = "mobile-gallery-checkbox";
      optionText = "Gallery";
      optionTitle = "View full resolution images/play videos when a thumbnail is clicked";
      optionIsChecked = this.enlargeOnClickOnMobile;
      onOptionChanged = (event) => {
        Utils.setPreference(Gallery.preferences.enlargeOnClick, event.target.checked);
        this.enlargeOnClickOnMobile = event.target.checked;
      };
    }
    Utils.createFavoritesOption(
      optionId,
      optionText,
      optionTitle,
      optionIsChecked,
      onOptionChanged,
      true
      // "(Middle Click)"
    );
  }

  insertOriginalContentContainerHTML() {
    const originalContentContainerHTML = `
          <div id="gallery-container">
              <canvas id="main-canvas"></canvas>
              <canvas id="low-resolution-canvas"></canvas>
              <a id="original-video-container">
                <video ${Gallery.commonVideoAttributes} active></video>
              </a>
              <img id="original-gif-container"></img>
              <a id="original-content-background-link-mask"></a>
              <a id="original-content-background"></a>
          </div>
      `;

    Utils.insertFavoritesSearchGalleryHTML("afterbegin", originalContentContainerHTML);
    this.originalContentContainer = document.getElementById("gallery-container");
    this.background = document.getElementById("original-content-background");
    this.originalImageLinkMask = document.getElementById("original-content-background-link-mask");
    this.addAdditionalVideoPlayers();
    this.gifContainer = document.getElementById("original-gif-container");
    this.addBackgroundEventListeners();
  }

  addAdditionalVideoPlayers() {
    const videoPlayerHTML = `<video ${Gallery.commonVideoAttributes}></video>`;
    const videoContainer = document.getElementById("original-video-container");

    for (let i = 0; i < Gallery.settings.additionalVideoPlayerCount; i += 1) {
      videoContainer.insertAdjacentHTML("beforeend", videoPlayerHTML);
    }
  }

  addBackgroundEventListeners() {
    if (Utils.onMobileDevice()) {
      return;
    }
    this.background.addEventListener("mousemove", () => {
      Gallery.cursorVisibilityCooldown.restart();
      this.toggleCursorVisibility(true);
    }, {
      passive: true
    });
    Gallery.cursorVisibilityCooldown.onCooldownEnd = () => {
      if (this.inGallery) {
        this.toggleCursorVisibility(false);
      }
    };
  }

  /**
   * @param {Number} opacity
   */
  updateBackgroundOpacity(opacity) {
    this.background.style.opacity = opacity;
    Utils.setPreference(Gallery.preferences.backgroundOpacity, opacity);
  }

  createAutoplayController() {
    const subscribers = new AutoplayListenerList(
      () => {
        this.videoController.toggleVideoLooping(false);
      },
      () => {
        this.videoController.toggleVideoLooping(true);
      },
      () => {
        this.videoController.toggleVideoLooping(true);
      },
      () => {
        this.videoController.toggleVideoLooping(false);
      },
      () => {
        if (this.inGallery) {
          const direction = Autoplay.settings.moveForward ? Gallery.directions.right : Gallery.directions.left;

          this.navigate(direction, false);
        }
      },
      () => {
        if (this.inGallery && Utils.isVideo(this.getSelectedThumb())) {
          this.videoController.playVideo(this.getSelectedThumb());
        }
      }
    );

    this.autoplayController = new Autoplay(subscribers);

    if (Autoplay.disabled || !this.autoplayController.active || this.autoplayController.paused) {
      this.videoController.toggleVideoLooping(true);
    } else {
      this.videoController.toggleVideoLooping(false);
    }
  }

  /**
   * @param {HTMLElement[]} thumbs
   */
  addEventListenersToThumbs(thumbs) {
    const thumbElements = thumbs === undefined ? Utils.getAllThumbs() : thumbs;

    for (const thumbElement of thumbElements) {
      this.addEventListenersToThumb(thumbElement);
    }
  }

  onPageChange() {
    this.onPageChangeHelper();
    this.foundFavoriteId = null;
    this.changedPageInGalleryDirection = null;
  }

  onPageChangeHelper() {
    if (Gallery.visibleThumbs.length <= 0) {
      return;
    }

    if (this.changedPageInGalleryDirection !== null) {
      this.onPageChangedInGallery();
      return;
    }

    if (this.foundFavoriteId !== null) {
      this.onFavoriteFound();
      return;
    }

    if (Gallery.backgroundRenderingOnPageChangeCooldown.ready) {
      imagesLoaded(document.body).on("always", () => {
        this.renderer.renderImagesInTheBackground();
      });
    }
  }

  onPageChangedInGallery() {
    if (this.changedPageInGalleryDirection === "ArrowRight") {
      this.currentlySelectedThumbIndex = 0;
    } else {
      this.currentlySelectedThumbIndex = Gallery.visibleThumbs.length - 1;
    }
    this.navigateHelper();
  }

  onFavoriteFound() {
    const thumb = document.getElementById(this.foundFavoriteId);

    if (thumb !== null) {
      this.renderImagesAround(thumb);
    }
  }

  hideCaptionsWhenShowingOriginalContent() {
    for (const caption of document.getElementsByClassName("caption")) {
      if (this.showOriginalContentOnHover) {
        caption.classList.add("hide");
      } else {
        caption.classList.remove("hide");
      }
    }
  }

  enumerateThumbs() {
    Gallery.visibleThumbs = Utils.getAllThumbs();
    this.enumeratedThumbs.clear();

    for (let i = 0; i < Gallery.visibleThumbs.length; i += 1) {
      this.enumerateThumb(Gallery.visibleThumbs[i], i);
    }
  }

  /**
   * @param {HTMLElement} thumb
   * @param {Number} index
   */
  enumerateThumb(thumb, index) {
    this.enumeratedThumbs.set(thumb.id, index);
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {Number | null}
   */
  getIndexFromThumb(thumb) {
    return this.enumeratedThumbs.get(thumb.id) || 0;
  }

  /**
   * @param {HTMLElement} thumb
   */
  addEventListenersToThumb(thumb) {
    if (Utils.onMobileDevice()) {
      return;
    }
    const image = Utils.getImageFromThumb(thumb);

    if (image.onmouseover !== null) {
      return;
    }
    image.onmouseover = (event) => {
      if (this.inGallery || this.recentlyExitedGallery || Utils.enteredOverCaptionTag(event)) {
        return;
      }
      this.thumbUnderCursor = thumb;
      this.lastEnteredThumb = thumb;
      this.showOriginalContent(thumb);
    };
    image.onmouseout = (event) => {
      this.thumbUnderCursor = null;

      if (event.relatedTarget !== null && event.relatedTarget.closest("#gallery-container") === null) {
        // this.thumbUnderCursor = null;
      }

      if (this.inGallery || Utils.enteredOverCaptionTag(event)) {
        return;
      }
      this.videoController.stopAllVideos();
      this.hideOriginalContent();
      this.renderer.clearCanvases();
    };
  }

  /**
   * @param {HTMLElement} thumb
   */
  openPostInNewPage(thumb) {
    thumb = thumb === undefined || thumb === null ? this.getSelectedThumb() : thumb;
    Utils.openPostInNewTab(Utils.getIdFromThumb(thumb));
  }

  unFavoriteSelectedContent() {
    if (!Utils.userIsOnTheirOwnFavoritesPage()) {
      return;
    }
    const selectedThumb = this.getSelectedThumb();

    if (selectedThumb === null) {
      return;
    }
    const removeFavoriteButton = Utils.getRemoveFavoriteButtonFromThumb(selectedThumb);

    if (removeFavoriteButton === null) {
      return;
    }
    const showRemoveFavoriteButtons = document.getElementById("show-remove-favorite-buttons");

    if (showRemoveFavoriteButtons === null) {
      return;
    }

    if (!Gallery.addOrRemoveFavoriteCooldown.ready) {
      return;
    }

    if (!showRemoveFavoriteButtons.checked) {
      Utils.showFullscreenIcon(Utils.icons.warning, 1000);
      setTimeout(() => {
        alert("The \"Remove Buttons\" option must be checked to use this hotkey");
      }, 20);
      return;
    }
    Utils.showFullscreenIcon(Utils.icons.heartMinus);
    this.onFavoriteAddedOrDeleted(selectedThumb.id);
    Utils.removeFavorite(selectedThumb.id);
  }

  enterGallery() {
    const selectedThumb = this.getSelectedThumb();

    this.toggleTapTraversal(true);
    this.lastSelectedThumbIndexBeforeEnteringGallery = this.currentlySelectedThumbIndex;
    this.background.style.pointerEvents = "auto";

    if (Utils.isVideo(selectedThumb)) {
      this.videoController.toggleVideoControls(true);
    }
    this.inGallery = true;
    dispatchEvent(new CustomEvent("showOriginalContent", {
      detail: true
    }));
    this.autoplayController.start(selectedThumb);
    Gallery.cursorVisibilityCooldown.restart();
    this.recentlyEnteredGallery = true;
    setTimeout(() => {
      this.recentlyEnteredGallery = false;
    }, 300);
    this.setupOriginalImageLinkInGallery();
  }

  exitGallery() {
    if (Gallery.settings.debugEnabled) {
      Utils.getAllThumbs().forEach(thumb => thumb.classList.remove("debug-selected"));
    }
    this.toggleTapTraversal(false);
    this.toggleCursorVisibility(true);
    this.videoController.toggleVideoControls(false);
    this.background.style.pointerEvents = "none";
    this.toggleCtrlClickOpenMediaInNewTab(false);
    const thumbIndex = this.getIndexOfThumbUnderCursor();

    if (Utils.onMobileDevice()) {
      this.hideOriginalContent();
      this.renderer.deleteAllRenders();
    }

    if (!Utils.onMobileDevice() && thumbIndex !== this.lastSelectedThumbIndexBeforeEnteringGallery) {
      this.hideOriginalContent();
      this.renderer.clearCanvases();

      if (thumbIndex !== null && this.showOriginalContentOnHover) {
        this.showOriginalContent(Gallery.visibleThumbs[thumbIndex]);
      }
    }

    this.recentlyExitedGallery = true;
    setTimeout(() => {
      this.recentlyExitedGallery = false;
    }, 300);
    this.inGallery = false;
    this.autoplayController.stop();
    document.dispatchEvent(new Event("mousemove"));
  }

  /**
   * @param {String} direction
   * @param {Boolean} keyIsHeldDown
   */
  navigate(direction, keyIsHeldDown) {
    if (Gallery.settings.debugEnabled) {
      this.getSelectedThumb().classList.remove("debug-selected");
    }

    if (keyIsHeldDown && !Gallery.keyHeldDownTraversalCooldown.ready) {
      return;
    }

    if (Utils.onSearchPage()) {
      if (this.reachedEnd(direction) && Gallery.settings.endlessSearchPageGallery) {
        this.changedPageInGalleryDirection = direction;
        this.softLoadNextSearchPage(direction);
        return;
      }
    } else if (!Gallery.settings.loopAtEndOfGallery && this.reachedEnd(direction) && Gallery.finishedLoading) {
      this.changedPageInGalleryDirection = direction;
      dispatchEvent(new CustomEvent("reachedEndOfGallery", {
        detail: direction
      }));
      return;
    }
    this.setNextSelectedThumbIndex(direction);
    this.navigateHelper();
  }

  navigateHelper() {
    const selectedThumb = this.getSelectedThumb();

    this.autoplayController.startViewTimer(selectedThumb);
    this.clearOriginalContentSources();
    this.videoController.stopAllVideos();

    if (Gallery.settings.debugEnabled) {
      selectedThumb.classList.add("debug-selected");
    }
    this.renderer.upscaleAnimatedThumbsAround(selectedThumb);
    this.renderImagesAround(selectedThumb);

    if (this.inGallery && Gallery.settings.additionalVideoPlayerCount > 0) {
      this.videoController.preloadInactiveVideoPlayers(selectedThumb);
    }

    if (!Utils.usingFirefox()) {
      Utils.scrollToThumb(selectedThumb.id, true);
    }

    if (Utils.isVideo(selectedThumb)) {
      this.videoController.toggleVideoControls(true);
      this.showOriginalVideo(selectedThumb);
    } else if (Utils.isGif(selectedThumb)) {
      this.videoController.toggleVideoControls(false);
      this.videoController.toggleVideoContainer(false);
      this.showOriginalGIF(selectedThumb);
    } else {
      this.videoController.toggleVideoControls(false);
      this.videoController.toggleVideoContainer(false);
      this.showOriginalImage(selectedThumb);
    }
    this.setupOriginalImageLinkInGallery();

    if (Utils.onMobileDevice()) {
      this.videoController.toggleVideoControls(false);
    }
  }

  /**
   * @param {String} direction
   * @returns {Boolean}
   */
  reachedEnd(direction) {
    if (direction === Gallery.directions.right && this.currentlySelectedThumbIndex >= Gallery.visibleThumbs.length - 1) {
      return true;
    }

    if (direction === Gallery.directions.left && this.currentlySelectedThumbIndex <= 0) {
      return true;
    }
    return false;
  }

  /**
   * @returns {Number}
   */
  getCurrentSearchPageNumber() {
    const match = (/&pid=(\d+)/).exec(location.href);

    if (match === undefined || match === null) {
      return 0;
    }
    return Math.floor(parseInt(match[1]) / 42);
  }

  /**
   * @returns {Number}
   */
  getNextSearchPageNumber() {
    return this.currentSearchPageNumber + 1;
  }

  /**
   * @param {String} direction
   */
  softLoadNextSearchPage(direction) {
    const initialSearchPageNumber = this.currentSearchPageNumber;
    const initialSelectedIndex = this.currentlySelectedThumbIndex;

    if (direction === "ArrowRight") {
      this.currentlySelectedThumbIndex = 0;
      this.currentSearchPageNumber += 1;
    } else {
      this.currentSearchPageNumber -= 1;
    }

    const fragment = this.postLoader.getThumbsFromSearchPageNumber(this.currentSearchPageNumber);

    if (this.searchPageImageContainer === null) {
      console.error("Null image container");
      this.currentSearchPageNumber = initialSearchPageNumber;
      this.currentlySelectedThumbIndex = initialSelectedIndex;
      return;
    }

    if (fragment.children.length === 0) {
      console.error("Post chunk not loaded");
      this.currentSearchPageNumber = initialSearchPageNumber;
      this.currentlySelectedThumbIndex = initialSelectedIndex;
      return;
    }
    window.history.replaceState(null, "", location.origin + location.pathname + location.search.replace(/pid=\d+/, `pid=${this.currentSearchPageNumber * 42}`));
    // window.history.go(-1);
    this.searchPageImageContainer.innerHTML = "";
    this.searchPageImageContainer.appendChild(fragment);
    this.addEventListenersToThumbs();
    this.enumerateThumbs();

    if (direction !== "ArrowRight") {
      this.currentlySelectedThumbIndex = Gallery.visibleThumbs.length - 1;
    }
    // this.renderer.deleteAllRenders();
    // this.renderer.renderImagesInTheBackground();
    this.navigateHelper();
  }

  /**
   * @param {String} html
   */
  createAllSearchPageThumbs(html) {
    const dom = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
    const posts = Array.from(dom.getElementsByTagName("post"));
    const firstThumb = document.querySelector(".thumb");

    const imageContainer = firstThumb.parentElement;

    imageContainer.innerHTML = "";

    for (const post of posts) {
      imageContainer.appendChild(this.createSearchPageThumb(post));
    }
  }

  createSearchPageThumb(post) {
    const tags = post.getAttribute("tags").trim();
    const id = post.getAttribute("id").trim();
    const thumbURL = post.getAttribute("preview_url").replace("api-cdn.", "");

    const thumb = document.createElement("span");
    const anchor = document.createElement("a");
    const image = document.createElement("img");

    thumb.appendChild(anchor);
    anchor.appendChild(image);

    thumb.id = id;
    thumb.className = "thumb";

    anchor.id = `p${id}`;
    anchor.href = Utils.getPostPageURL(id);

    image.src = thumbURL;
    image.setAttribute("tags", tags);
    return thumb;
  }

  /**
   * @param {String} direction
   * @returns {Boolean}
   */
  setNextSelectedThumbIndex(direction) {
    if (direction === Gallery.directions.left || direction === Gallery.directions.a) {
      this.currentlySelectedThumbIndex -= 1;
      this.currentlySelectedThumbIndex = this.currentlySelectedThumbIndex < 0 ? Gallery.visibleThumbs.length - 1 : this.currentlySelectedThumbIndex;
    } else {
      this.currentlySelectedThumbIndex += 1;
      this.currentlySelectedThumbIndex = this.currentlySelectedThumbIndex >= Gallery.visibleThumbs.length ? 0 : this.currentlySelectedThumbIndex;
    }
    return false;
  }

  /**
   * @param {Boolean} value
   */
  toggleAllVisibility(value) {
    this.showOriginalContentOnHover = value === undefined ? !this.showOriginalContentOnHover : value;
    this.toggleOriginalContentVisibility(this.showOriginalContentOnHover);

    if (this.thumbUnderCursor !== null) {
      this.toggleBackgroundVisibility();
      this.toggleScrollbarVisibility();
    }
    dispatchEvent(new CustomEvent("showOriginalContent", {
      detail: this.showOriginalContentOnHover
    }));
    Utils.setPreference(Gallery.preferences.showOnHover, this.showOriginalContentOnHover);

    const showOnHoverCheckbox = document.getElementById("show-content-on-hover-checkbox");

    if (showOnHoverCheckbox !== null) {
      showOnHoverCheckbox.checked = this.showOriginalContentOnHover;
    }
  }

  hideOriginalContent() {
    this.toggleBackgroundVisibility(false);
    this.toggleScrollbarVisibility(true);
    this.clearOriginalContentSources();
    this.videoController.stopAllVideos();
    this.renderer.hideCanvases();
    this.videoController.toggleVideoContainer(false);
    this.toggleOriginalGIF(false);
  }

  clearOriginalContentSources() {
    this.renderer.hideCanvases();
    this.gifContainer.src = "";
    this.gifContainer.style.visibility = "hidden";
  }

  /**
   * @returns {Boolean}
   */
  currentlyHoveringOverVideoThumb() {
    if (this.thumbUnderCursor === null) {
      return false;
    }
    return Utils.isVideo(this.thumbUnderCursor);
  }

  /**
   * @param {HTMLElement} thumb
   */
  showOriginalContent(thumb) {
    this.currentlySelectedThumbIndex = this.getIndexFromThumb(thumb);

    if (this.inGallery || !Gallery.settings.renderOnInteractionEnd) {
      this.renderer.upscaleAnimatedThumbsAround(thumb);
    }

    if (!this.inGallery && Gallery.settings.renderAroundAggressively && !Gallery.settings.renderOnInteractionEnd) {
      this.renderImagesAround(thumb);
    }

    if (Utils.isVideo(thumb)) {
      this.showOriginalVideo(thumb);
    } else if (Utils.isGif(thumb)) {
      this.showOriginalGIF(thumb);
    } else {
      this.showOriginalImage(thumb);
    }

    if (this.showOriginalContentOnHover) {
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
    this.renderer.toggleMainCanvas(false);
    this.videoController.playVideo(thumb);

    if (!this.inGallery) {
      this.videoController.toggleVideoControls(false);
    }
  }

  /**
   * @param {HTMLElement} thumb
   */
  showOriginalGIF(thumb) {
    const tags = Utils.getTagsFromThumb(thumb);
    const extension = tags.has("animated_png") ? "png" : "gif";
    const originalSource = Utils.getOriginalImageURLFromThumb(thumb).replace("jpg", extension);

    this.gifContainer.src = originalSource;

    if (this.showOriginalContentOnHover) {
      this.toggleOriginalGIF(true);
      this.renderer.hideCanvases();
      this.gifContainer.style.visibility = "visible";
    }
  }

  /**
   * @param {HTMLElement} thumb
   */
  showOriginalImage(thumb) {
    if (this.renderer.renderIsCompleted(thumb)) {
      this.renderer.clearLowResolutionCanvas();
      this.renderer.drawMainCanvas(thumb);
    } else if (this.renderer.renderHasStarted(thumb)) {
      this.renderer.drawLowResolutionCanvas(thumb);
      this.renderer.clearMainCanvas();
      this.renderer.drawMainCanvas(thumb);
    } else {
      this.renderer.drawLowResolutionCanvas(thumb);
      this.renderer.renderOriginalImage(thumb);

      if (!this.inGallery && !Gallery.settings.renderAroundAggressively) {
        this.renderer.renderImagesAround(thumb);
      }
    }
    this.toggleOriginalContentVisibility(this.showOriginalContentOnHover);
    this.toggleOriginalGIF(false);
  }

  /**
   * @param {HTMLElement} initialThumb
   */
  renderImagesAround(initialThumb) {
    if (Utils.onSearchPage()) {
      this.renderImagesAroundOnSearchPage(initialThumb);
    } else {
      this.renderImagesAroundOnFavoritesPage(initialThumb);
    }
  }

  /**
   * @param {HTMLElement} thumb
   */
  renderImagesAroundOnSearchPage(thumb) {
    if (Utils.onMobileDevice()) {
      return;
    }
    const posts = this.postLoader.getPostsAround(thumb);

    this.renderer.renderImagesFromSearchPagePosts(posts);
  }

  /**
   *
   * @param {HTMLElement} initialThumb
   */
  renderImagesAroundOnFavoritesPage(initialThumb) {
    if (Utils.onSearchPage() || (Utils.onMobileDevice() && !this.enlargeOnClickOnMobile)) {
      return;
    }
    this.renderer.renderImagesAround(initialThumb);
  }

  /**
   * @param {Boolean} value
   */
  toggleOriginalContentVisibility(value) {
    this.renderer.toggleMainCanvas(value);
    this.toggleOriginalGIF(value);

    if (!value && this.videoController !== undefined) {
      this.videoController.toggleVideoContainer(false);
    }
  }

  /**
   * @param {Boolean} value
   */
  toggleBackgroundVisibility(value) {
    if (value === undefined) {
      value = this.background.style.display === "block";
      this.background.style.display = value ? "none" : "block";
      this.originalImageLinkMask.style.display = value ? "none" : "block";
      return;
    }
    this.background.style.display = value ? "block" : "none";
    this.originalImageLinkMask.style.display = value ? "block" : "none";
  }

  /**
   * @param {Boolean} value
   */
  toggleBackgroundOpacity(value) {
    if (value !== undefined) {
      if (value) {
        this.updateBackgroundOpacity(1);
      } else {
        this.updateBackgroundOpacity(0);
      }
      return;
    }
    const opacity = parseFloat(this.background.style.opacity);

    if (opacity < 1) {
      this.updateBackgroundOpacity(1);
    } else {
      this.updateBackgroundOpacity(0);
    }
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
    // const html = `
    //   #original-content-background {
    //     cursor: ${value ? "auto" : "none"};
    //   }
    // `;

    // insertStyleHTML(html, "gallery-cursor-visibility");
  }

  /**
   * @param {Boolean} value
   */
  toggleOriginalGIF(value) {
    if (value === undefined) {
      value = this.gifContainer.style.visibility !== "visible";
    }
    this.gifContainer.style.visibility = value ? "visible" : "hidden";

    if (Utils.onMobileDevice()) {
      this.gifContainer.style.zIndex = value ? "9995" : "0";
    }
  }

  /**
   * @returns {Number}
   */
  getIndexOfThumbUnderCursor() {
    return this.thumbUnderCursor === null ? null : this.getIndexFromThumb(this.thumbUnderCursor);
  }

  /**
   * @returns {HTMLElement}
   */
  getSelectedThumb() {
    return Gallery.visibleThumbs[this.currentlySelectedThumbIndex];
  }

  /**
   * @param {KeyboardEvent} event
   */
  async addFavoriteInGallery(event) {
    if (!this.inGallery || event.repeat || !Gallery.addOrRemoveFavoriteCooldown.ready) {
      return;
    }
    const selectedThumb = this.getSelectedThumb();

    if (selectedThumb === undefined || selectedThumb === null) {
      Utils.showFullscreenIcon(Utils.icons.error);
      return;
    }
    const addedFavoriteStatus = await Utils.addFavorite(selectedThumb.id);
    let svg = Utils.icons.error;

    switch (addedFavoriteStatus) {
      case Utils.addedFavoriteStatuses.alreadyAdded:
        svg = Utils.icons.heartCheck;
        break;

      case Utils.addedFavoriteStatuses.success:
        svg = Utils.icons.heartPlus;
        this.onFavoriteAddedOrDeleted(selectedThumb.id);
        break;

      default:
        break;
    }
    Utils.showFullscreenIcon(svg);
  }

  /**
   * @param {String} id
   */
  onFavoriteAddedOrDeleted(id) {
    dispatchEvent(new CustomEvent("favoriteAddedOrDeleted", {
      detail: id
    }));
  }

  async setupOriginalImageLinkInGallery() {
    const thumb = this.getSelectedThumb();

    if (thumb === null || thumb === undefined) {
      return;
    }
    const imageURL = await Utils.getOriginalImageURLWithExtension(thumb);

    this.toggleCtrlClickOpenMediaInNewTab(false);
    this.originalImageLinkMask.setAttribute("href", imageURL);
  }

  /**
   * @param {Boolean} value
   */
  toggleCtrlClickOpenMediaInNewTab(value) {
    if (!this.inGallery && value) {
      return;
    }
    this.originalImageLinkMask.classList.toggle("active", value);
  }
}
