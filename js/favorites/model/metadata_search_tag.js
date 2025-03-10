class MetadataSearchTag extends SearchTag {
  static regex = /^-?(score|width|height|id)(:[<>]?)(\d+|score|width|height|id)$/;

  /**
   * @type {MetadataSearchExpression}
   */
  expression;

  /**
   * @type {Number}
   */
  get cost() {
    return 0;
  }

  /**
   * @param {String} searchTag
   */
  constructor(searchTag) {
    super(searchTag);
    this.expression = this.createExpression(searchTag);
  }

  /**
   * @param {String} searchTag
   * @returns {MetadataSearchExpression}
   */
  createExpression(searchTag) {
    const extractedExpression = MetadataSearchTag.regex.exec(searchTag);

    if (extractedExpression === null) {
      return new MetadataSearchExpression("width", ":", "0");
    }
    return new MetadataSearchExpression(
      extractedExpression[1],
      extractedExpression[2],
      extractedExpression[3]
    );
  }

  /**
   * @param {Post} post
   * @returns {Boolean}
   */
  matches(post) {
    if (post.metadata.satisfiesExpression(this.expression)) {
      return !this.negated;
    }
    return this.negated;
  }
}
