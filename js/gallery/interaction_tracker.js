class InteractionTracker {
  /**
   * @type {Function}
   */
  onInteractionStopped;
  /**
   * @type {Number}
   */
  idleTimeout;
  /**
   * @type {Number}
   */
  mouseTimer;
  /**
   * @type {Number}
   */
  scrollTimer;
  /**
   * @type {Boolean}
   */
  mouseIsMoving;
  /**
   * @type {Boolean}
   */
  scrolling;

  /**
   * @param {Number} idleTimeout
   * @param {Function} onInteractionStopped
   */
  constructor(idleTimeout, onInteractionStopped) {
    this.idleTimeout = idleTimeout;
    this.onInteractionStopped = onInteractionStopped;
    this.mouseIsMoving = false;
    this.scrolling = false;
    this.trackInteraction();
  }

  trackInteraction() {
    window.addEventListener("scroll", () => {
      this.scrolling = true;
      clearTimeout(this.scrollTimer);
      this.scrollTimer = setTimeout(() => {
        this.scrolling = false;

        if (!this.mouseIsMoving) {
          this.onInteractionStopped();
        }
      }, this.idleTimeout);
    }, {
      passive: true
    });
    window.addEventListener("mousemove", () => {
      clearTimeout(this.mouseTimer);
      this.mouseTimer = setTimeout(() => {
        this.mouseIsMoving = false;

        if (!this.scrolling) {
          this.onInteractionStopped();
        }
      }, this.idleTimeout);
    }, {
      passive: true
    });
  }
}
