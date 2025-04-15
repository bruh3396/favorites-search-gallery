class AutoplayEvents {
  /** @type {Function} */
  onEnable;
  /** @type {Function} */
  onDisable;
  /** @type {Function} */
  onPause;
  /** @type {Function} */
  onResume;
  /** @type {Function} */
  onComplete;
  /** @type {Function} */
  onVideoEndedBeforeMinimumViewTime;

  /**
   *
   * @param {{onEnable: Function, onDisable: Function, onPause: Function, onResume: Function, onComplete: Function, onVideoEndedEarly: Function}} events
   */
  constructor({onEnable, onDisable, onPause, onResume, onComplete, onVideoEndedEarly}) {
    this.onEnable = onEnable;
    this.onDisable = onDisable;
    this.onPause = onPause;
    this.onResume = onResume;
    this.onComplete = onComplete;
    this.onVideoEndedBeforeMinimumViewTime = onVideoEndedEarly;
  }
}
