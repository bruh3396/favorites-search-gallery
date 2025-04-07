class GalleryInputListener {
  /** @type {GalleryController} */
  controller;

  /**
   * @param {GalleryController} controller
   */
  constructor(controller) {
    this.controller = controller;
    this.addCommonEventListeners();
  }

  addCommonEventListeners() {
    this.setupMouseOverHandler();
    this.setupMouseDownHandler();
    this.setupClickHandler();
    this.setupContextMenuClickHandler();
    this.setupKeydownHandler();
    this.setupKeyUpHandler();
    this.setupWheelHandler();
    this.setupMouseMoveHandler();
    this.setupCustomUiEventHandler();
  }

  setupMouseOverHandler() {
    const onMouseOverHover = (/** @type {HTMLElement | null} */ thumb) => {
      if (thumb === null) {
        this.controller.view.hideContent();
        return;
      }
      this.controller.view.showContent(thumb);
      this.controller.preloadVisibleContentAround(thumb);
    };

    Events.global.mouseover.on((mouseOverEvent) => {
      this.controller.executeFunctionBasedOnGalleryState({
        hover: onMouseOverHover,
        idle: this.controller.preloadVisibleContentAround.bind(this)
      }, mouseOverEvent.thumb);
    });
  }

  setupFavoritesOptionHandler() {
    Events.favorites.showOnHoverToggled.on(() => {
      this.controller.model.toggleShowContentOnHover();
    });
  }

  setupGalleryStateResponder() {
    Events.favorites.inGalleryRequest.on(() => {
      Events.gallery.inGalleryResponse.emit(this.controller.model.currentState === GalleryStateMachine.states.IN_GALLERY);
    });
  }

  setupContextMenuClickHandler() {
    Events.global.contextmenu.on((event) => {
      this.controller.executeFunctionBasedOnGalleryState({
        gallery: () => {
          event.preventDefault();
          this.controller.exitGallery();
        }
      });
    });
  }

  setupMouseDownHandler() {
    const onMouseDownInGallery = (/** @type {FavoritesMouseEvent} */ event) => {
      if (event.ctrlKey || Utils.overGalleryMenu(event.originalEvent)) {
        return;
      }

      if (event.shiftKey) {
        return;
      }

      if (event.leftClick && !this.controller.model.currentlyViewingVideo) {
        this.controller.exitGallery();
        return;
      }

      if (event.rightClick) {
        return;
      }

      if (event.middleClick) {
        this.controller.model.openPostInNewTab();
      }
    };
    const onMouseDownOutOfGallery = (/** @type {FavoritesMouseEvent} */ event) => {
      if (event.leftClick && event.thumb !== null && !event.ctrlKey) {
        event.originalEvent.preventDefault();
        this.controller.enterGallery(event.thumb);
        return;
      }

      if (event.middleClick && event.thumb === null) {
        event.originalEvent.preventDefault();
        this.controller.toggleShowContentOnHover();
      }
    };

    Events.global.mousedown.on((event) => {
      this.controller.executeFunctionBasedOnGalleryState({
        hover: onMouseDownOutOfGallery,
        idle: onMouseDownOutOfGallery,
        gallery: onMouseDownInGallery
      }, new FavoritesMouseEvent(event));
    });
  }

  setupClickHandler() {
    Events.global.click.on((event) => {
      this.controller.executeFunctionBasedOnGalleryState({
        gallery: (mouseEvent) => {
          if (mouseEvent.ctrlKey) {
            this.controller.model.openOriginalContentInNewTab();
          }
        }
      }, event);
    });
  }

  setupKeydownHandler() {
    const onKeyDownInGallery = (/** @type {KeyboardEvent} */ event) => {
      if (Types.isNavigationKey(event.key)) {
        event.stopImmediatePropagation();
        this.controller.navigate(event.key);
        return;
      }

      if (Types.isExitKey(event.key)) {
        this.controller.exitGallery();
        return;
      }

      if (event.shiftKey && !event.repeat) {
        this.controller.view.setImageCursor("zoom-in");
        return;
      }

      switch (event.key.toLowerCase()) {
        case "b":
          this.controller.view.toggleBackgroundOpacity();
          break;

        case "e":
          this.controller.addCurrentFavorite();
          break;

        case "x":
          this.controller.removeCurrentFavorite();
          break;

        case "f":
          Utils.toggleFullscreen();
          break;

        case "g":
          this.controller.model.openPostInNewTab();
          break;

        case "q":
          this.controller.model.openOriginalContentInNewTab();
          break;

        case " ":
          if (this.controller.model.currentThumb !== undefined && Utils.isVideo(this.controller.model.currentThumb)) {
            this.controller.view.toggleVideoPause();
          }
          break;

        default:
          break;
      }
    };

    const onKeyDown = (/** @type {KeyboardEvent} */ event) => {
      this.controller.executeFunctionBasedOnGalleryState({
        gallery: onKeyDownInGallery
      }, event);

    };
    const throttledOnKeyDown = Utils.throttle(onKeyDown, GallerySettings.navigationThrottleTime);

    Events.global.keydown.on((event) => {
      if (event.originalEvent.repeat) {
        throttledOnKeyDown(event.originalEvent);
      } else {
        onKeyDown(event.originalEvent);
      }
    });
  }

  setupKeyUpHandler() {
    const onKeyUp = (/** @type {FavoritesKeyboardEvent} */ event) => {
      this.controller.executeFunctionBasedOnGalleryState({
        gallery: () => {
          if (event.key.toLowerCase() === "shift" && !event.originalEvent.repeat) {
            this.controller.view.setImageCursor("auto");
          }
        }
      }, event);
    };

    Events.global.keyup.on(onKeyUp);
  }

  setupWheelHandler() {
    Events.global.wheel.on((wheelevent) => {
      this.controller.executeFunctionBasedOnGalleryState({
        hover: (event) => {
          this.controller.view.updateBackgroundOpacity(event.originalEvent);
        },
        gallery: (event) => {
          if (!wheelevent.originalEvent.shiftKey) {
            this.controller.navigate(event.direction);
          }
        }
      }, wheelevent);
    }, {
      passive: true
    });
  }

  setupMouseMoveHandler() {
    const onMouseMove = Utils.throttle(() => {
      this.controller.executeFunctionBasedOnGalleryState({
        gallery: () => {
          this.controller.view.handleMouseMoveInGallery();
        }
      });
    }, 250);

    Events.global.mousemove.on(onMouseMove);
  }

  setupCustomUiEventHandler() {
    // @ts-ignore
    this.controller.view.container.addEventListener("galleryController", (/** @type CustomEvent */ event) => {
      switch (event.detail) {
        case "exitGallery":
          this.controller.executeFunctionBasedOnGalleryState({
            gallery: this.controller.exitGallery.bind(this)
          });
          break;

        case "openPost":
          this.controller.model.openPostInNewTab();
          break;

        case "download":
          this.controller.model.openOriginalContentInNewTab();
          break;

        case "addFavorite":
          this.controller.addCurrentFavorite();
          break;

        case "removeFavorite":
          this.controller.removeCurrentFavorite();
          break;

        case "toggleBackground":
          this.controller.view.toggleBackgroundOpacity();
          break;

        default:
          break;
      }
    });
  }

}
