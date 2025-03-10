/**
 * @template V
 */
class EventEmitter {
  /**
   * @type {Set<((argument: V) => void)>}
   */
  listeners;
  /**
   * @type {Set<(argument: V) => void>}
   */
  oneTimeListeners;
  /**
   * @type {Boolean}
   */
  enabled;

  /**
   * @param {Boolean} enabled
   */
  constructor(enabled = true) {
    this.listeners = new Set();
    this.oneTimeListeners = new Set();
    this.enabled = enabled;
    this.guardMethods();
  }

  /**
   * @returns {void}
   */
  guardMethods() {
    for (const method of [this.on, this.once, this.timeout]) {
      this[method.name] = this.guardMethod(method);
    }
  }

  /**
   * @param {Function} method
   * @returns {Function}
   */
  guardMethod(method) {
    return this.enabled ? method : () => {
    };
  }

  /**
   * @param {(argument: V) => void} callback
   */
  on(callback) {
    if (!this.listeners.has(callback)) {
      this.listeners.add(callback);
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
    for (const callback of this.listeners.keys()) {
      // eslint-disable-next-line callback-return
      callback(argument);
    }
    this.removeOneTimeListeners();
  }

  removeOneTimeListeners() {
    this.listeners = SetUtils.difference(this.listeners, this.oneTimeListeners);
    this.oneTimeListeners.clear();
  }

  /**
   * @param {(argument: V) => void} callback
   */
  once(callback) {
    this.oneTimeListeners.add(callback);
    this.on(callback);
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

      const listener = (args) => {
        this.off(listener);
        clearTimeout(timer);
        resolve(args);
      };

      this.on(listener);
    });
  }
}
