class EventEmitter {
  /**
   * @type {Map.<String, Function[]>}
   */
  listeners;
  /**
   * @type {Set.<Function>}
   */
  oneTimeListeners;

  constructor() {
    this.listeners = new Map();
    this.oneTimeListeners = new Set();
  }

  /**
   * @param {String} event
   * @param {Function} callback
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    // @ts-ignore
    this.listeners.get(event).push(callback);
  }

  /**
   * @param {String} event
   * @param {Function} callback
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      // @ts-ignore
      const callbacks = this.listeners.get(event)
        .filter(cb => cb !== callback);

      this.listeners.set(event, callbacks);
    }
  }

  /**
   * @param {String} event
   * @param  {...any} args
   */
  emit(event, ...args) {
    const listeners = this.listeners.get(event);

    if (listeners === undefined) {
      return;
    }
    const persistentListeners = listeners.filter(listener => !this.oneTimeListeners.has(listener));

    if (persistentListeners.length === 0) {
      this.listeners.delete(event);
    } else {
      this.listeners.set(event, persistentListeners);
    }

    for (const callback of listeners) {
      // eslint-disable-next-line callback-return
      callback(...args);
      this.oneTimeListeners.delete(callback);
    }
  }

  /**
   * @param {String} event
   * @param {Function} callback
   */
  once(event, callback) {
    this.oneTimeListeners.add(callback);
    this.on(event, callback);
  }

  /**
   * @param {String} event
   * @param {Number} milliseconds
   * @returns {Promise.<any>}
   */
  timeout(event, milliseconds) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.off(event, listener);
        reject(new PromiseTimeoutError());
      }, milliseconds);
      const listener = (args) => {
        this.off(event, listener);
        clearTimeout(timer);
        resolve(args);
      };

      this.on(event, listener);
    });
  }
}
