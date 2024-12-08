class FetchedFavoritesQueue {
  /**
   * @type {FavoritesPageRequest[]}
   */
  queue;
  /**
   * @type {Function}
   */
  onDequeue;
  /**
   * @type {Number}
   */
  lastDequeuedPageNumber;
  /**
   * @type {Boolean}
   */
  dequeuing;

  /**
   * @type {Number}
   */
  get lowestPageNumberInQueue() {
    return this.queue[0].pageNumber;
  }

  /**
   * @type {Number}
   */
  get nextPageNumberToDequeue() {
    return this.lastDequeuedPageNumber + 1;
  }

  /**
   * @type {Boolean}
   */
  get allPreviousPagesWereDequeued() {
    return this.nextPageNumberToDequeue === this.lowestPageNumberInQueue;
  }

  /**
   * @type {Boolean}
   */
  get queueIsEmpty() {
    return this.queue.length === 0;
  }

  /**
   * @type {Boolean}
   */
  get canDequeue() {
    return !this.queueIsEmpty && this.allPreviousPagesWereDequeued;
  }

  /**
   * @param {Function}
   */
  constructor(onDequeue) {
    this.onDequeue = onDequeue;
    this.lastDequeuedPageNumber = -1;
    this.queue = [];
  }

  /**
   * @param {FavoritesPageRequest} request
   */
  enqueue(request) {
    this.queue.push(request);
    this.sortQueueBySmallestPageNumber();
    this.emptyQueue();
  }

  sortQueueBySmallestPageNumber() {
    this.queue.sort((request1, request2) => request1.pageNumber - request2.pageNumber);
  }

  emptyQueue() {
    if (this.dequeuing) {
      return;
    }
    this.dequeuing = true;

    while (this.canDequeue) {
      this.dequeue();
    }
    this.dequeuing = false;
  }

  dequeue() {
    this.lastDequeuedPageNumber += 1;
    this.onDequeue(this.queue.shift());
  }
}
