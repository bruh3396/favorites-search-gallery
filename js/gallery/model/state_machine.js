class GalleryStateMachine {
  /**
   * @type {{
   *   SHOWING_CONTENT_ON_HOVER: 0,
   *   IN_GALLERY: 1,
   *   IDLE: 2
   * }}
   */
  static states = {
    SHOWING_CONTENT_ON_HOVER: 0,
    IN_GALLERY: 1,
    IDLE: 2
  };

  /** @type {FavoritesGalleryState} */
  currentState;

  constructor() {
    this.currentState = GalleryStateMachine.states.IDLE;
  }

  /**
   * @returns {FavoritesGalleryState}
   */
  getStartState() {
    if (Preferences.showOnHover.value) {
      return GalleryStateMachine.states.SHOWING_CONTENT_ON_HOVER;
    }
    return GalleryStateMachine.states.IDLE;
  }

  /**
   * @param {FavoritesGalleryState} state
   */
  changeState(state) {
    this.currentState = state;
    this.onStateChange();
  }

  onStateChange() {
    switch (this.currentState) {
      case GalleryStateMachine.states.IDLE:
        Utils.forceHideCaptions(false);
        break;

      case GalleryStateMachine.states.SHOWING_CONTENT_ON_HOVER:
        Utils.forceHideCaptions(true);
        break;

      case GalleryStateMachine.states.IN_GALLERY:
        Utils.forceHideCaptions(true);
        break;

      default:
        break;
    }
  }
}
