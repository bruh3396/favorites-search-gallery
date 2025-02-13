class EventEmitter {
  /**
   * @type {Map.<String, Function[].}
   */
  listeners;

  constructor() {
    this.listeners = new Map();
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
    if (this.listeners.has(event)) {
      // @ts-ignore
      for (const callback of this.listeners.get(event)) {
        // eslint-disable-next-line callback-return
        callback(...args);
      }
    }
  }
}
