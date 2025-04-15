class MetadataSearchExpression {
  /** @type {RegExp} */
  static regex = /^-?(score|width|height|id)(:[<>]?)(\d+|score|width|height|id)$/;

  /** @type {SearchableMetadataMetric} */
  metric;
  /** @type {MetadataComparator} */
  operator;
  /** @type {Boolean} */
  hasRelativeValue;
  /** @type {SearchableMetadataMetric} */
  relativeValue;
  /** @type {Number} */
  numericValue;

  /**
   * @param {String} searchTag
   */
  constructor(searchTag) {
    const extractedExpression = this.extractExpression(searchTag);
    const value = extractedExpression.value;

    this.metric = extractedExpression.metric;
    this.operator = extractedExpression.operator;
    this.hasRelativeValue = Types.isSearchableMetadataMetric(value);
    this.numericValue = Types.isSearchableMetadataMetric(extractedExpression.value) ? 0 : extractedExpression.value;
    this.relativeValue = Types.isSearchableMetadataMetric(extractedExpression.value) ? extractedExpression.value : "id";
  }

  /**
   * @param {String} searchTag
   * @returns {{metric: SearchableMetadataMetric, operator: MetadataComparator, value : SearchableMetadataMetric | Number}}
   */
  extractExpression(searchTag) {
    const extractedExpression = MetadataSearchExpression.regex.exec(searchTag);

    if (extractedExpression === null || extractedExpression.length !== 4) {
      return {
        metric: "width",
        operator: ":",
        value: 0
      };
    }
    const metric = Types.isSearchableMetadataMetric(extractedExpression[1]) ? extractedExpression[1] : "id";
    const operator = Types.isMetadataComparator(extractedExpression[2]) ? extractedExpression[2] : ":";
    const value = Types.isSearchableMetadataMetric(extractedExpression[3]) ? extractedExpression[3] : Number(extractedExpression[3]);
    return {
      metric,
      operator,
      value
    };
  }
}
