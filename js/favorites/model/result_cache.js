class SearchResultCache {
  /** @type {Map<String, Post[]>} */
  cache;

  /**
   * @param {String} searchQuery
   * @param {Post[]} posts
   * @returns {String}
   */
  static createHash(searchQuery, posts) {
    const hash = Utils.hash(`${searchQuery} | ${posts.slice(-10).map(post => post.id).join("")}`);
    return `${hash} ${posts.length}`;
  }

  constructor() {
    this.cache = new Map();
  }

  /**
   * @param {String} searchQuery
   * @param {Post[]} posts
   * @returns {Post[] | null}
   */
  get(searchQuery, posts) {
    return this.cache.get(SearchResultCache.createHash(searchQuery, posts)) || null;
  }

  /**
   * @param {String} searchQuery
   * @param {Post[]} posts
   * @param {Post[]} results
   */
  set(searchQuery, posts, results) {
    if (posts.length > 0) {
      this.cache.set(SearchResultCache.createHash(searchQuery, posts), results);
    }
  }
}
