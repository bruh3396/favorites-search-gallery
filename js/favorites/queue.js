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
  get lowestEnqueuedPageNumber() {
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
    return this.nextPageNumberToDequeue === this.lowestEnqueuedPageNumber;
  }

  /**
   * @type {Boolean}
   */
  get isEmpty() {
    return this.queue.length === 0;
  }

  /**
   * @type {Boolean}
   */
  get canDequeue() {
    return !this.isEmpty && this.allPreviousPagesWereDequeued;
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
    this.sortByLowestPageNumber();
    this.dequeueAll();
  }

  sortByLowestPageNumber() {
    this.queue.sort((request1, request2) => request1.pageNumber - request2.pageNumber);
  }

  dequeueAll() {
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
