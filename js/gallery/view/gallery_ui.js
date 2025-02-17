class GalleryUI {
  /**
   * @type {HTMLElement}
   */
  background;
  /**
   * @type {HTMLElement | null}
   */
  lastVisitedThumb;

  get usingMasonryLayout() {
    return Utils.onFavoritesPage() && FavoritesLayoutObserver.currentLayout === "masonry";
  }

  /**
   * @param {HTMLElement} galleryContainer
   */
  constructor(galleryContainer) {
    this.lastVisitedThumb = null;
    this.createBackground(galleryContainer);
    this.toggleVideoPointerEvents(false);
  }

  /**
   * @param {HTMLElement} galleryContainer
   */
  createBackground(galleryContainer) {
    this.background = document.createElement("div");
    this.background.id = "gallery-background";
    this.background.style.opacity = Utils.getPreference("galleryBackgroundOpacity", "1");
    galleryContainer.appendChild(this.background);
  }

  /**
   * @param {HTMLElement} thumb
   */
  enterGallery(thumb) {
    this.lastVisitedThumb = thumb;
    this.toggleActiveBackground(true);
    this.toggleScrollbar(false);
    this.toggleVideoPointerEvents(true);
  }

  exitGallery() {
    this.toggleActiveBackground(false);
    this.toggleScrollbar(true);
    this.scrollToLastVisitedThumb();
    this.toggleVideoPointerEvents(false);
  }

  scrollToLastVisitedThumb() {
    // if (this.usingMasonryLayout && this.lastVisitedThumb !== null) {
    FavoritesLayoutObserver.waitForLayoutToComplete()
      .then(() => {
        if (this.lastVisitedThumb !== null) {
          Utils.scrollToThumb(this.lastVisitedThumb.id, false);
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
    this.lastVisitedThumb = thumb;

    if (this.usingMasonryLayout || Utils.usingFirefox()) {
      return;
    }
    Utils.scrollToThumb(thumb.id, true);
  }

  /**
   * @param {WheelEvent} event
   */
  updateBackgroundOpacityFromEvent(event) {
    let opacity = parseFloat(Utils.getPreference("galleryBackgroundOpacity", 1));

    opacity -= event.deltaY * 0.0005;
    opacity = Utils.clamp(opacity, 0, 1);
    this.updateBackgroundOpacity(Utils.roundToTwoDecimalPlaces(opacity));
  }

  /**
   * @param {Number} opacity
   */
  updateBackgroundOpacity(opacity) {
    const opacityString = String(opacity);

    this.background.style.opacity = String(opacityString);
    Utils.setPreference("galleryBackgroundOpacity", String(opacityString));
  }

  /**
   * @param {Number} status
   */
  showAddedFavoriteStatus(status) {
    const icon = {
      [Utils.addedFavoriteStatuses.alreadyAdded]: Utils.icons.heartCheck,
      [Utils.addedFavoriteStatuses.success]: Utils.icons.heartPlus
    }[status] || Utils.icons.error;

    Utils.showFullscreenIcon(icon);
  }

  /**
   * @param {Number} status
   */
  showRemovedFavoriteStatus(status) {
    switch (status) {
      case Utils.removedFavoriteStatuses.success:
        Utils.showFullscreenIcon(Utils.icons.heartMinus);
        break;

      case Utils.removedFavoriteStatuses.removeNotAllowed:
        Utils.showFullscreenIcon(Utils.icons.warning, 1000);
        setTimeout(() => {
          alert("The \"Remove Buttons\" option must be checked to use this hotkey");
        }, 20);
        break;

      default:
        break;
    }
  }
}
