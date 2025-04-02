class FetchedFavoritesQueue {
  /** @type {FavoritesPageRequest[]} */
  queue;
  /** @type {Function} */
  onDequeue;
  /** @type {Number} */
  mostRecentlyDequeuedPageNumber;
  /** @type {Boolean} */
  dequeuing;

  /** @type {Number} */
  get smallestEnqueuedPageNumber() {
    return this.queue[0].pageNumber;
  }

  /** @type {Number} */
  get nextPageNumberToDequeue() {
    return this.mostRecentlyDequeuedPageNumber + 1;
  }

  /** @type {Boolean} */
  get allPreviousPagesWereDequeued() {
    return this.nextPageNumberToDequeue === this.smallestEnqueuedPageNumber;
  }

  /** @type {Boolean} */
  get isEmpty() {
    return this.queue.length === 0;
  }

  /** @type {Boolean} */
  get canDequeue() {
    return !this.isEmpty && this.allPreviousPagesWereDequeued;
  }

  /**
   * @param {{onDequeue: Function}} param
   */
  constructor({onDequeue}) {
    this.onDequeue = onDequeue;
    this.mostRecentlyDequeuedPageNumber = -1;
    this.queue = [];
    this.dequeuing = false;
  }

  /**
   * @param {FavoritesPageRequest} request
   */
  enqueue(request) {
    this.queue.push(request);
    this.sortByLowestPageNumber();
    this.drain();
  }

  sortByLowestPageNumber() {
    this.queue.sort((request1, request2) => request1.pageNumber - request2.pageNumber);
  }

  drain() {
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
    this.mostRecentlyDequeuedPageNumber += 1;
    this.onDequeue(this.queue.shift());
  }
}
