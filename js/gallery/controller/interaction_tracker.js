class InteractionTracker {
  /**
   * @type {Function}
   */
  onInteractionStopped;
  /**
   * @type {Function}
   */
  onMouseMoveStopped;
  /**
   * @type {Function}
   */
  onScrollingStopped;
  /**
   * @type {Function}
   */
  onNoInteractionOnStart;
  /**
   * @type {Number}
   */
  idleDuration;
  /**
   * @type {Timeout}
   */
  mouseTimeout;
  /**
   * @type {Timeout}
   */
  scrollTimeout;
  /**
   * @type {Timeout}
   */
  interactionOnStartTimeout;
  /**
   * @type {Boolean}
   */
  mouseIsMoving;
  /**
   * @type {Boolean}
   */
  scrolling;
  /**
   * @type {AbortController}
   */
  abortController;

  /**
   * @param {Number} idleDuration
   * @param {Function} onInteractionStopped
   * @param {Function} onMouseMoveStopped
   * @param {Function} onScrollingStopped
   * @param {Function} onNoInteractionOnStart
   */
  constructor(idleDuration, onInteractionStopped, onMouseMoveStopped, onScrollingStopped, onNoInteractionOnStart) {
    this.idleDuration = idleDuration;
    this.onInteractionStopped = onInteractionStopped;
    this.onMouseMoveStopped = onMouseMoveStopped;
    this.onScrollingStopped = onScrollingStopped;
    this.onNoInteractionOnStart = onNoInteractionOnStart;
    this.mouseIsMoving = false;
    this.scrolling = false;
    this.abortController = new AbortController();
  }

  start() {
    this.toggle(true);
  }

  stop() {
    this.toggle(false);
  }

  /**
   * @param {Boolean} value
   */
  toggle(value) {
    if (value) {
      this.abortController = new AbortController();
      this.startInteractionOnStartTimer();
      this.trackMouseMove();
      this.trackScroll();
      return;
    }
    this.abortController.abort();
  }

  startInteractionOnStartTimer() {
    this.interactionOnStartTimeout = setTimeout(() => {
      this.onNoInteractionOnStart();
    }, this.idleDuration);
  }

  trackMouseMove() {
    Events.global.mousemove.on(this.onMouseMove.bind(this), {
      passive: true,
      signal: this.abortController.signal
    });
  }

  trackScroll() {
    window.addEventListener("scroll", this.onScroll.bind(this), {
      passive: true,
      signal: this.abortController.signal
    });
  }

  onMouseMove() {
    this.mouseIsMoving = true;
    clearTimeout(this.interactionOnStartTimeout);
    clearTimeout(this.mouseTimeout);
    this.mouseTimeout = setTimeout(() => {
      this.mouseIsMoving = false;
      this.onMouseMoveStopped();

      if (!this.scrolling) {
        this.onInteractionStopped();
      }
    }, this.idleDuration);
  }

  onScroll() {
    this.scrolling = true;
    clearTimeout(this.interactionOnStartTimeout);
    clearTimeout(this.scrollTimeout);
    this.scrollTimeout = setTimeout(() => {
      this.scrolling = false;
      this.onScrollingStopped();

      if (!this.mouseIsMoving) {
        this.onInteractionStopped();
      }
    }, this.idleDuration);
  }
}
