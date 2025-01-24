class PostLoader {
  /**
   * @type {DOMParser}
   */
  static parser = new DOMParser();
  static constants = {
    chunkSize: 42,
    searchPageSize: 42,
    apiURL: "https://api.rule34.xxx/index.php?page=dapi&s=post&q=index",
    tagsURIFragment: PostLoader.searchURIFragment + PostLoader.blacklistURIFragment
  };

  /**
   * @param {Number} pageNumber
   * @returns {String}
   */
  static getPostChunkAPIURL(pageNumber) {
    return `${PostLoader.constants.apiURL}&pid=${pageNumber}&limit=${PostLoader.constants.chunkSize}&tags=${PostLoader.constants.tagsURIFragment}`;
  }

  /**
   * @type {String}
   */
  static get blacklistURIFragment() {
    return ` ${Utils.negateTags(Utils.tagBlacklist)}`.replace(/\s-/g, "+-");
  }

  /**
   * @type {String}
   */
  static get searchURIFragment() {
    const match = (/&tags=([^&]*)/).exec(location.href);
    return match === null ? "" : match[1];
  }

  /**
   * @type {Number}
   */
  static get initialSearchOffset() {
    const match = (/&pid=(\d+)/).exec(location.href);
    return match === null ? 0 : parseInt(match[1]);
  }

  /**
   * @type {Map.<Number, CompactPost[]>}
   */
  chunks;
  /**
   * @type {Number}
   */
  currentSearchOffset;
  /**
   * @type {CompactPost[]}
   */
  loadedPosts;

  /**
   * @type {Number}
   */
  get currentAPIPageNumber() {
    return Math.floor(this.currentSearchOffset / PostLoader.constants.chunkSize);
  }

  constructor() {
    this.chunks = new Map();
    this.loadedPosts = [];
    this.currentSearchOffset = PostLoader.initialSearchOffset;
  }

  async loadCurrentChunk() {
    await this.loadAdjacentChunks(this.currentAPIPageNumber);
  }

  async loadAdjacentChunks(pageNumber) {
    const previousPageNumber = Math.max(0, pageNumber - 1);
    const nextPageNumber = pageNumber + 1;

    await this.loadChunk(pageNumber);
    this.loadChunk(nextPageNumber);
    this.loadChunk(previousPageNumber);
  }

  async loadChunk(pageNumber) {
    if (this.chunks.has(pageNumber)) {
      return;
    }
    this.chunks.set(pageNumber, []);
    const chunk = await this.fetchChunk(pageNumber);

    this.chunks.set(pageNumber, chunk);
    this.updateLoadedPosts();
  }

  /**
   * @param {Number} pageNumber
   * @returns {Promise.<CompactPost[]>}
   */
  fetchChunk(pageNumber) {
    return fetch(PostLoader.getPostChunkAPIURL(pageNumber))
      .then((response) => {
        return response.text();
      })
      .then((html) => {
        const dom = PostLoader.parser.parseFromString(html, "text/html");
        const posts = [];

        for (const post of dom.querySelectorAll("post")) {
          posts.push(new CompactPost(post));
        }
        return posts;
      });
  }

  updateLoadedPosts() {
    let posts = [];

    for (const i of Array.from(this.chunks.keys()).sort()) {
      posts = posts.concat(this.chunks.get(i));
    }
    this.loadedPosts = posts;
  }

  /**
   * @param {HTMLElement} thumb
   * @returns {CompactPost[]}
   */
  getPostsAround(thumb) {
    const index = this.loadedPosts.findIndex(post => post.id === thumb.id);

    if (index === -1) {
      return [];
    }
    this.currentSearchOffset = index;
    this.loadCurrentChunk();
    return this.getPostsAroundIndex(index);
  }

  /**
   * @param {Number} index
   * @returns {Boolean}
   */
  indexInBounds(index) {
    return index >= 0 && index < this.loadedPosts.length;
  }

  /**
   * @param {Number} startIndex
   * @returns {CompactPost[]}
   */
  getPostsAroundIndex(startIndex) {
    const range = 42;
    const result = [];

    result.push(this.loadedPosts[startIndex]);
    let i = 1;

    while (result.length < range) {
      const leftIndex = startIndex - i;
      const rightIndex = startIndex + i;
      const leftIndexInBounds = this.indexInBounds(leftIndex);
      const rightIndexInBounds = this.indexInBounds(rightIndex);
      const bothIndexesOutOfBounds = !leftIndexInBounds && !rightIndexInBounds;

      if (bothIndexesOutOfBounds) {
        break;
      }

      if (leftIndexInBounds) {
        result.push(this.loadedPosts[leftIndex]);
      }

      if (rightIndexInBounds && result.length <= range) {
        result.push(this.loadedPosts[rightIndex]);
      }
      i += 1;
    }
    return result;
  }

  /**
   * @param {Number} pageNumber
   * @returns {DocumentFragment}
   */
  getThumbsFromSearchPageNumber(pageNumber) {
    const pageOffset = pageNumber * PostLoader.constants.searchPageSize;
    const fragment = document.createDocumentFragment();
    const posts = this.loadedPosts.slice(pageOffset, pageOffset + PostLoader.constants.searchPageSize);

    for (const post of posts) {
      fragment.appendChild(post.htmlElement);
    }
    return fragment;
  }
}
