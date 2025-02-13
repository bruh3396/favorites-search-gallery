class GalleryModel {
  static states = {
    HOVER: 0,
    IN_GALLERY: 1,
    IDLE: 2
  };
  /**
   * @type {Map.<String, Number>}
   */
  enumeratedThumbs;
  /**
   * @type {HTMLElement | null}
   */
  thumbUnderCursor;
  /**
   * @type {HTMLElement | null}
   */
  lastThumbUnderCursor;
  /**
   * @type {Number}
   */
  currentState;

  constructor() {
    this.enumeratedThumbs = new Map();
    this.thumbUnderCursor = null;
    this.lastThumbUnderCursor = null;
    this.currentState = GalleryModel.states.HOVER;
  }

  /**
   * @returns {Number}
   */
  getCurrentState() {
    return this.currentState;
  }

  /**
   * @param {HTMLElement | null} thumb
   */
  setThumbUnderCursor(thumb) {
    this.thumbUnderCursor = thumb;

    if (thumb !== null) {
      this.lastThumbUnderCursor = thumb;
    }
  }

  /**
   * @returns {HTMLElement | null}
   */
  getLastThumbUnderCursor() {
    return this.lastThumbUnderCursor;
  }

  enumerateThumbs() {
    const thumbs = Utils.getAllThumbs();

    for (let i = 0; i < thumbs.length; i += 1) {
      this.enumeratedThumbs.set(thumbs[i].id, i);
    }
  }
}
