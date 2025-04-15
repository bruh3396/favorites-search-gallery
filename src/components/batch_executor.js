/**
 * @template V
 */
class BatchExecutor {
  /** @type {Number} */
  limit;
  /** @type {Number} */
  timeout;
  /** @type {(batch: V[]) => void} */
  executor;
  /** @type {Timeout} */
  timer;
  /** @type {V[]} */
  batch;

  /** @type {Boolean} */
  get overLimit() {
    return this.batch.length >= this.limit;
  }

  /**
   * @param {Number} limit
   * @param {Number} timeout
   * @param {(batch: V[]) => void} executor
   */
  constructor(limit, timeout, executor) {
    this.limit = limit;
    this.timeout = timeout;
    this.executor = executor;
    this.timer = null;
    this.batch = [];
  }

  /**
   * @param {V} item
   */
  add(item) {
    this.batch.push(item);
    this.tryExecuting();
  }

  tryExecuting() {
    clearTimeout(this.timer);

    if (this.overLimit) {
      this.execute();
      return;
    }
    this.executeAfterTimeout();
  }

  executeAfterTimeout() {
    this.timer = setTimeout(() => {
      this.execute();
    }, this.timeout);
  }

  execute() {
    this.executor(this.batch);
    this.empty();
  }

  empty() {
    this.batch = [];
  }

  reset() {
    clearTimeout(this.timer);
    this.empty();
  }
}
