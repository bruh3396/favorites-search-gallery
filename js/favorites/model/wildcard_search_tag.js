class WildcardSearchTag extends SearchTag {
  static unmatchableRegex = /^\b$/;
  static startsWithRegex = /^[^*]*\*$/;

  /**
   * @type {RegExp}
   */
  matchRegex;
  /**
   * @type {Boolean}
   */
  equivalentToStartsWith;
  /**
   * @type {String}
   */
  startsWithPrefix;

  /**
   * @type {Number}
   */
  get cost() {
    return this.equivalentToStartsWith ? 10 : 20;
  }

  /**
   * @param {String} searchTag
   */
  constructor(searchTag) {
    super(searchTag);
    this.matchRegex = this.createWildcardRegex();
    this.startsWithPrefix = this.value.slice(0, -1);
    this.equivalentToStartsWith = WildcardSearchTag.startsWithRegex.test(searchTag);
    this.matches = this.equivalentToStartsWith ? this.matchesPrefix : this.matchesWildcard;
  }

  /**
   * @returns {RegExp}
   */
  createWildcardRegex() {
    try {
      const regex = Utils.escapeParenthesis(this.value.replace(/\*/g, ".*"));
      return new RegExp(`^${regex}$`);
    } catch {
      return WildcardSearchTag.unmatchableRegex;
    }
  }

  /**
   * @param {Post} post
   * @returns {Boolean}
   */
  matchesPrefix(post) {
    for (const tag of post.tagSet.values()) {
      if (tag.startsWith(this.startsWithPrefix)) {
        return !this.negated;
      }

      if (this.startsWithPrefix < tag) {
        break;
      }
    }
    return this.negated;
  }

  /**
   * @param {Post} post
   * @returns {Boolean}
   */
  matchesWildcard(post) {
    for (const tag of post.tagSet.values()) {
      if (this.matchRegex.test(tag)) {
        return !this.negated;
      }
    }
    return this.negated;
  }
}
