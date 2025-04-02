class ThrottledQueue {
  /** @type {{resolve: () => void}[]} */
  queue;
  /** @type {Number} */
  delay;
  /** @type {Boolean} */
  draining;

  /**
   * @param {Number} delay
   */
  constructor(delay) {
    this.queue = [];
    this.delay = delay;
    this.draining = false;
  }
  /**
   * @returns {Promise<void>}
   */
  wait() {
    return new Promise((resolve) => {
      this.queue.push({
        resolve
      });
      this.startDraining();
    });
  }

  async startDraining() {
    if (this.draining) {
      return;
    }
    this.draining = true;
    await this.drain();
    this.draining = false;
  }

  async drain() {
    while (this.queue.length > 0) {
      const item = this.queue.shift();

      if (item === undefined) {
        continue;
      }
      item.resolve();
      await Utils.sleep(this.delay);
    }
  }

  /**
   * @param {Number} newDelay
   */
  setDelay(newDelay) {
    this.delay = newDelay;
  }
}
