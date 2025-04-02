class GalleryUI {
  /** @type {HTMLElement} */
  background;
  /** @type {GalleryMenu} */
  menu;
  /** @type {HTMLElement | null} */
  lastVisitedThumb;

  /** @type {Boolean} */
  get usingColumnLayout() {
    return Flags.onFavoritesPage && FavoritesLayoutObserver.currentLayout === "column";
  }

  /**
   * @param {HTMLElement} galleryContainer
   */
  constructor(galleryContainer) {
    this.background = this.createBackground(galleryContainer);
    this.menu = new GalleryMenu(galleryContainer);
    this.lastVisitedThumb = null;
    this.toggleVideoPointerEvents(false);
    this.toggleMenu(false);
  }

  /**
   * @param {HTMLElement} galleryContainer
   */
  createUiContainer(galleryContainer) {
    const container = document.createElement("div");

    container.id = "gallery-ui";
    galleryContainer.appendChild(container);
    return container;
  }

  /**
   * @param {HTMLElement} galleryContainer
   * @return {HTMLElement}
   */
  createBackground(galleryContainer) {
    const background = document.createElement("div");

    background.id = "gallery-background";
    background.style.opacity = Preferences.backgroundOpacity.value;
    galleryContainer.appendChild(background);
    return background;
  }

  /**
   * @param {HTMLElement} thumb
   */
  enterGallery(thumb) {
    this.setLastVisitedThumb(thumb);
    this.toggleActiveBackground(true);
    this.toggleScrollbar(false);
    this.toggleVideoPointerEvents(true);
    this.toggleMenu(true);
  }

  exitGallery() {
    this.toggleActiveBackground(false);
    this.toggleScrollbar(true);
    this.scrollToLastVisitedThumb();
    this.toggleVideoPointerEvents(false);
    this.toggleCursor(true);
    this.toggleMenu(false);
  }

  scrollToLastVisitedThumb() {
    Utils.waitForAllThumbnailsToLoad()
      .then(() => {
        if (this.lastVisitedThumb !== null && this.usingColumnLayout) {
          this.scrollToThumb(this.lastVisitedThumb);
        }
      });
  }

  /**
   * @param {Boolean} value
   */
  toggleVideoPointerEvents(value) {
    Utils.insertStyleHTML(`
      video {
        pointer-events: ${value ? "auto" : "none"}
      }
      `, "video-pointer-events");
  }

  /**
   * @param {Boolean} value
   */
  toggleActiveBackground(value) {
    this.background.classList.toggle("active", value);
    this.background.classList.toggle("visible", value);
  }

  toggleBackgroundOpacity() {
    const opacity = parseFloat(this.background.style.opacity);

    if (opacity < 1) {
      this.updateBackgroundOpacity(1);
    } else {
      this.updateBackgroundOpacity(0);
    }
  }

  show() {
    this.toggleScrollbar(false);
    this.background.classList.add("visible");
  }

  hide() {
    this.toggleScrollbar(true);
    this.background.classList.remove("visible");
  }

  /**
   * @param {Boolean} value
   */
  toggleScrollbar(value) {
    document.body.style.overflowY = value ? "auto" : "hidden";
  }

  /**
   * @param {HTMLElement} thumb
   */
  updateUIInGallery(thumb) {
    this.setLastVisitedThumb(thumb);

    if (this.usingColumnLayout || Flags.usingFirefox) {
      return;
    }
    this.scrollToThumb(thumb);
  }

  /**
   * @param {WheelEvent} event
   */
  updateBackgroundOpacityFromEvent(event) {
    let opacity = parseFloat(Preferences.backgroundOpacity.value);

    opacity -= event.deltaY * 0.0005;
    opacity = Utils.clamp(opacity, 0, 1);
    this.updateBackgroundOpacity(Utils.roundToTwoDecimalPlaces(opacity));
  }

  /**
   * @param {Number} opacity
   */
  updateBackgroundOpacity(opacity) {
    const opacityString = String(opacity);

    this.background.style.opacity = opacityString;
    Preferences.backgroundOpacity.set(opacityString);
  }

  /**
   * @param {Number} status
   */
  showAddedFavoriteStatus(status) {
    const icon = {
      [Utils.addedFavoriteStatuses.alreadyAdded]: Icons.heartCheck,
      [Utils.addedFavoriteStatuses.success]: Icons.heartPlus
    }[status] || Icons.error;

    Utils.showFullscreenIcon(icon);
  }

  /**
   * @param {Number} status
   */
  showRemovedFavoriteStatus(status) {
    switch (status) {
      case Utils.removedFavoriteStatuses.success:
        Utils.showFullscreenIcon(Icons.heartMinus);
        break;

      case Utils.removedFavoriteStatuses.removeNotAllowed:
        Utils.showFullscreenIcon(Icons.warning, 1000);
        setTimeout(() => {
          alert("The \"Remove Buttons\" option must be checked to use this hotkey");
        }, 20);
        break;

      default:
        break;
    }
  }

  /**
   * @param {HTMLElement} thumb
   */
  setLastVisitedThumb(thumb) {
    this.lastVisitedThumb = thumb;
  }

  /**
   * @param {HTMLElement} thumb
   */
  scrollToThumb(thumb) {
    thumb.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }

  /**
   * @param {Boolean} value
   */
  toggleCursor(value) {
    this.background.style.cursor = value ? "default" : "none";
  }

  /**
   * @param {Boolean} value
   */
  toggleMenu(value) {
    Utils.insertStyleHTML(`
      #gallery-menu {
        display: ${value ? "flex" : "none"} !important;
      }
      `, "gallery-menu-visibility");
  }
}
