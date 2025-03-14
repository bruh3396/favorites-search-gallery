class MetadataSearchTag extends SearchTag {
  static regex = /^-?(score|width|height|id)(:[<>]?)(\d+|score|width|height|id)$/;

  /** @type {MetadataSearchExpression} */
  expression;

  /** @type {Number} */
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

    if (extractedExpression === null || extractedExpression.length !== 4) {
      return new MetadataSearchExpression("width", ":", 0);
    }
    const metric = Types.isSearchableMetadataMetric(extractedExpression[1]) ? extractedExpression[1] : "id";
    const comparator = Types.isMetadataComparator(extractedExpression[2]) ? extractedExpression[2] : ":";
    const value = Types.isSearchableMetadataMetric(extractedExpression[3]) ? extractedExpression[3] : Number(extractedExpression[3]);
    return new MetadataSearchExpression(
      metric,
      comparator,
      value
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
