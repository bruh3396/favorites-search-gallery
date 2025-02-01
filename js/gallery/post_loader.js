class PostLoader {
  /**
   * @type {DOMParser}
   */
  static parser = new DOMParser();

  /**
   * @type {String}
   */
  static get searchURIFragment() {
    const match = (/&tags=([^&]*)/).exec(location.href);
    const tags = match === null ? "" : match[1];
    return tags === "all" ? "" : tags;
  }

  /**
   * @type {String}
   */
  static get blacklistURIFragment() {
    return ` ${Utils.negateTags(Utils.tagBlacklist)}`.replace(/\s-/g, "+-");
  }

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

  /**
   * @param {Number} pageNumber
   */
  async loadAdjacentChunks(pageNumber) {
    const previousPageNumber = Math.max(0, pageNumber - 1);
    const nextPageNumber = pageNumber + 1;

    await this.loadChunk(pageNumber);
    this.loadChunk(nextPageNumber);
    this.loadChunk(previousPageNumber);
  }

  /**
   * @param {Number} pageNumber
   */
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

        for (const post of Array.from(dom.querySelectorAll("post"))) {
          posts.push(new CompactPost(post));
        }
        return posts;
      });
  }

  updateLoadedPosts() {
    const sortedChunkKeys = Array.from(this.chunks.keys()).sort();
    /**
     * @type {CompactPost[]}
     */
    let posts = [];

    for (const i of sortedChunkKeys) {
      const chunk = this.chunks.get(i);

      if (chunk !== undefined) {
        posts = posts.concat(chunk);
      }
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
    return Utils.getElementsAroundIndex(this.loadedPosts, index, 42);
  }

  /**
   * @param {Number} index
   * @returns {Boolean}
   */
  indexInBounds(index) {
    return index >= 0 && index < this.loadedPosts.length;
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
