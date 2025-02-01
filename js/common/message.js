class Message {
  /**
   * @type {String}
   */
  channel;
  /**
   * @type {String}
   */
  name;
  /**
   * @type {Object}
   */
  detail;

  /**
   * @param {String} channel
   * @param {String} name
   * @param {Object} detail
   */
  constructor(channel, name, detail) {
    this.channel = channel;
    this.name = name;
    this.detail = detail;
  }
}
