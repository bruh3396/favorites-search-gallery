class SearchTag {
  /**
   * @param {String} tag
   * @returns {Boolean}
   */
  // @ts-ignore
  static is(tag) {
    return true;
  }

  /** @type {String} */
  value;
  /** @type {Boolean} */
  negated;

  /** @type {Number} */
  get cost() {
    return 0;
  }

  /** @type {Number} */
  get finalCost() {
    return this.negated ? this.cost + 1 : this.cost;
  }

  /**
   * @param {String} searchTag
   */
  constructor(searchTag) {
    this.negated = searchTag.startsWith("-");
    this.value = this.negated ? searchTag.substring(1) : searchTag;
  }

  /**
   * @param {Post} post
   * @returns {Boolean}
   */
  matches(post) {
    if (post.tagSet.has(this.value)) {
      return !this.negated;
    }
    return this.negated;
  }
}
