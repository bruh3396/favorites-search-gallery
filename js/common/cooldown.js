class Cooldown {
  /** @type {Timeout} */
  timeout;
  /** @type {Number} */
  waitTime;
  /** @type {Boolean} */
  skipCooldown;
  /** @type {Boolean} */
  debounce;
  /** @type {Boolean} */
  debouncing;
  /** @type {Function} */
  onDebounceEnd;
  /** @type {Function} */
  onCooldownEnd;

  get ready() {
    if (this.skipCooldown) {
      return true;
    }

    if (this.timeout === null) {
      this.start();
      return true;
    }

    if (this.debounce) {
      this.startDebounce();
    }
    return false;
  }

  /**
   * @param {Number} waitTime
   * @param {Boolean} debounce
   */
  constructor(waitTime, debounce = false) {
    this.timeout = null;
    this.waitTime = waitTime;
    this.skipCooldown = false;
    this.debounce = debounce;
    this.debouncing = false;
    this.onDebounceEnd = () => { };
    this.onCooldownEnd = () => { };
  }

  startDebounce() {
    this.debouncing = true;
    clearTimeout(this.timeout);
    this.start();
  }

  start() {
    this.timeout = setTimeout(() => {
      this.timeout = null;

      if (this.debouncing) {
        this.onDebounceEnd();
        this.debouncing = false;
      }
      this.onCooldownEnd();
    }, this.waitTime);
  }

  stop() {
    if (this.timeout === null) {
      return;
    }
    clearTimeout(this.timeout);
    this.timeout = null;
  }

  restart() {
    this.stop();
    this.start();
  }
}
