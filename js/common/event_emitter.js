class EventEmitter {
  /**
   * @type {Object.<String, Function[]>}
   */
  listeners;

  constructor() {
    this.listeners = {};
  }

  /**
   * @param {String} event
   * @param {Function} callback
   */
  on(event, callback) {
    if (this.listeners[event] === undefined) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  /**
   * @param {String} event
   * @param {Object} detail
   */
  emit(event, detail) {
    if (this.listeners[event] !== undefined) {
      for (const callback of this.listeners[event]) {
        // eslint-disable-next-line callback-return
        callback(detail);
      }
    }
  }

  /**
   * @param {String} channel
   * @param {String} name
   * @param {Object} detail
   */
  sendMessage(channel, name, detail) {
    this.emit(channel, new Message(channel, name, detail));
  }
}
