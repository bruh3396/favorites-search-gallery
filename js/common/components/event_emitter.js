/**
 * @template V
 */
class EventEmitter {
  /** @type {Set<((argument: V) => void)>} */
  listeners;
  /** @type {Set<(argument: V) => void>} */
  oneTimeListeners;
  /** @type {Boolean} */
  enabled;
  /** @type {Boolean} */
  frozen;

  /** @type {Boolean} */
  get disabled() {
    return !this.enabled;
  }

  /**
   * @param {Boolean} enabled
   */
  constructor(enabled = true) {
    this.listeners = new Set();
    this.oneTimeListeners = new Set();
    this.enabled = enabled;
    this.frozen = false;
  }

  /**
   * @param {(argument: V) => void} callback
   * @param {AddEventListenerOptions | undefined} options
   */
  on(callback, options = undefined) {
    if (this.disabled) {
      return;
    }
    this.listeners.add(callback);

    if (options === undefined) {
      return;
    }

    if (options.once) {
      this.oneTimeListeners.add(callback);
    }

    if (options.signal) {
      options.signal.addEventListener("abort", () => {
        this.off(callback);
      });
    }
  }

  /**
   * @param {((argument: V) => void)} callback
   */
  off(callback) {
    this.listeners.delete(callback);
  }

  /**
   * @param {V} argument
   */
  emit(argument) {
    if (this.disabled || this.frozen) {
      return;
    }

    for (const callback of this.listeners.keys()) {
      callback(argument);
    }
    this.removeOneTimeListeners();
  }

  removeOneTimeListeners() {
    this.listeners = SetUtils.difference(this.listeners, this.oneTimeListeners);
    this.oneTimeListeners.clear();
  }

  /**
   * @param {number} milliseconds
   * @returns {Promise<V>}
   */
  timeout(milliseconds) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.off(listener);
        reject(new PromiseTimeoutError());
      }, milliseconds);

      const listener = (/** @type {V} */ args) => {
        this.off(listener);
        clearTimeout(timer);
        resolve(args);
      };

      this.on(listener, {
        once: true
      });
    });
  }

  freeze() {
    this.frozen = true;
  }

  resume() {
    this.frozen = false;
  }
}
