class Timer {
  /** @type {Timeout} */
  timeout;
  /** @type {Number} */
  waitTime;
  /** @type {Function} */
  onTimerEnd;

  /**
   * @param {Number} waitTime
   */
  constructor(waitTime) {
    this.timeout = null;
    this.waitTime = waitTime;
    this.onTimerEnd = () => { };
  }

  restart() {
    this.stop();
    this.start();
  }

  stop() {
    clearTimeout(this.timeout);
    this.timeout = null;
  }

  start() {
    this.timeout = setTimeout(() => {
      this.timeout = null;
      this.onTimerEnd();
    }, this.waitTime);
  }
}
