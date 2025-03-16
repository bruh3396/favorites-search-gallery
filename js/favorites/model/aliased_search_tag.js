class AliasedSearchTag extends SearchTag {
  /**
   * @param {String} tag
   * @returns {Boolean}
   */
  static is(tag) {
    return Aliases.has(tag.replace(/^-/, ""));
  }
  /** @type {Set<String>} */
  aliases;

  /** @type {Number} */
  get cost() {
    return 5;
  }

  /**
   * @param {String} searchTag
   */
  constructor(searchTag) {
    super(searchTag);
    this.aliases = Aliases.get(this.value) || new Set();
    this.aliases.add(this.value);
  }

  /**
   * @param {Post} post
   * @returns {Boolean}
   */
  matches(post) {
    // if (SetUtils.hasIntersection(this.aliases, post.tagSet)) {
    //   return !this.negated;
    // }
    // return this.negated;
    if (this.aliases.isDisjointFrom(post.tagSet)) {
      return this.negated;
    }
    return !this.negated;
  }
}
