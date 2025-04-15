class GalleryInputHandler {
  static {
    Utils.addStaticInitializer(GalleryInputHandler.setup);
  }

  static setup() {
    /* eslint-disable func-names */
    GalleryController.prototype.setupMouseOverHandler = function() {
      const onMouseOverHover = (/** @type {HTMLElement | null} */ thumb) => {
        if (thumb === null) {
          this.view.hideContent();
          return;
        }
        this.view.showContent(thumb);
        this.preloadVisibleContentAround(thumb);
      };

      Events.global.mouseover.on((mouseOverEvent) => {
        this.executeFunctionBasedOnGalleryState({
          hover: onMouseOverHover,
          idle: this.preloadVisibleContentAround.bind(this)
        }, mouseOverEvent.thumb);
      });
    };

    GalleryController.prototype.setupContextMenuClickHandler = function() {
      Events.global.contextmenu.on((event) => {
        this.executeFunctionBasedOnGalleryState({
          gallery: () => {
            event.preventDefault();
            this.exitGallery();
          }
        });
      });
    };

    GalleryController.prototype.setupMouseDownHandler = function() {
      const onMouseDownInGallery = (/** @type {FavoritesMouseEvent} */ event) => {
        if (event.ctrlKey || Utils.overGalleryMenu(event.originalEvent)) {
          return;
        }

        if (event.shiftKey) {
          if (this.toggleGalleryImageZoom()) {
            this.view.scrollToZoomPoint(event.originalEvent.x, event.originalEvent.y);
          }
          return;
        }
        const zoomedIn = event.originalEvent.target instanceof HTMLElement && event.originalEvent.target.closest(".zoomed-in") !== null;

        if (event.leftClick && !zoomedIn && !this.model.currentlyViewingVideo) {
          this.exitGallery();
          return;
        }

        if (event.rightClick) {
          return;
        }

        if (event.middleClick) {
          this.model.openPostInNewTab();
        }
      };
      const onMouseDownOutOfGallery = (/** @type {FavoritesMouseEvent} */ event) => {
        if (event.leftClick && event.thumb !== null && !event.ctrlKey) {
          event.originalEvent.preventDefault();
          this.enterGallery(event.thumb);
          return;
        }

        if (event.middleClick && event.thumb === null) {
          event.originalEvent.preventDefault();
          this.toggleShowContentOnHover();
        }
      };

      Events.global.mousedown.on((event) => {
        this.executeFunctionBasedOnGalleryState({
          hover: onMouseDownOutOfGallery,
          idle: onMouseDownOutOfGallery,
          gallery: onMouseDownInGallery
        }, new FavoritesMouseEvent(event));
      });
    };

    GalleryController.prototype.setupClickHandler = function() {
      Events.global.click.on((event) => {
        this.executeFunctionBasedOnGalleryState({
          gallery: (mouseEvent) => {
            if (mouseEvent.ctrlKey) {
              this.model.openOriginalContentInNewTab();
            }
          }
        }, event);
      });
    };

    GalleryController.prototype.setupKeydownHandler = function() {
      const onKeyDownInGallery = (/** @type {KeyboardEvent} */ event) => {
        if (Types.isNavigationKey(event.key)) {
          event.stopImmediatePropagation();
          this.navigate(event.key);
          return;
        }

        if (Types.isExitKey(event.key)) {
          this.exitGallery();
          return;
        }

        if (event.shiftKey) {
          this.view.toggleZoomCursor(true);
          return;
        }

        switch (event.key.toLowerCase()) {
          case "b":
            this.view.toggleBackgroundOpacity();
            break;

          case "e":
            this.addCurrentFavorite();
            break;

          case "x":
            this.removeCurrentFavorite();
            break;

          case "f":
            Utils.toggleFullscreen();
            break;

          case "g":
            this.model.openPostInNewTab();
            break;

          case "q":
            this.model.openOriginalContentInNewTab();
            break;

          case " ":
            if (this.model.currentThumb !== undefined && Utils.isVideo(this.model.currentThumb)) {
              this.view.toggleVideoPause();
            }
            break;

          default:
            break;
        }
      };

      const onKeyDown = (/** @type {KeyboardEvent} */ event) => {
        this.executeFunctionBasedOnGalleryState({
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
    };

    GalleryController.prototype.setupKeyupHandler = function() {
      Events.global.keyup.on((event) => {
        this.executeFunctionBasedOnGalleryState({
          gallery: (keyEvent) => {
            if (keyEvent.key === "shift") {
              this.view.toggleZoomCursor(false);
            }
          }
        }, event);
      });
    };

    GalleryController.prototype.setupWheelHandler = function() {
      Events.global.wheel.on((wheelevent) => {
        this.executeFunctionBasedOnGalleryState({
          hover: (event) => {
            this.view.updateBackgroundOpacity(event.originalEvent);
          },
          gallery: (event) => {
            if (!wheelevent.originalEvent.shiftKey) {
              this.navigate(event.direction);
            }
          }
        }, wheelevent);
      }, {
        passive: true
      });
    };

    GalleryController.prototype.setupMouseMoveHandler = function() {
      const onMouseMove = Utils.throttle(() => {
        this.executeFunctionBasedOnGalleryState({
          gallery: () => {
            this.view.handleMouseMoveInGallery();
          }
        });
      }, 250);

      Events.global.mousemove.on(onMouseMove);
    };

    GalleryController.prototype.setupCustomUiEventHandler = function() {
      // @ts-ignore
      this.view.container.addEventListener("galleryController", (/** @type CustomEvent */ event) => {
        switch (event.detail) {
          case "exitGallery":
            this.executeFunctionBasedOnGalleryState({
              gallery: this.exitGallery.bind(this)
            });
            break;

          case "openPost":
            this.model.openPostInNewTab();
            break;

          case "openOriginal":
            this.model.openOriginalContentInNewTab();
            break;

          case "download":
            this.model.download();
            break;

          case "addFavorite":
            this.addCurrentFavorite();
            break;

          case "removeFavorite":
            this.removeCurrentFavorite();
            break;

          case "toggleBackground":
            this.view.toggleBackgroundOpacity();
            break;

          default:
            break;
        }
      });
    };
  }
}
