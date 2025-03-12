class MetadataSearchExpression {
  /**
   * @type {SearchableMetadataMetric}
   */
  metric;
  /**
   * @type {MetadataComparator}
   */
  operator;
  /**
   * @type {SearchableMetadataMetric}
   */
  relativeValue;
  /**
   * @type {Number}
   */
  numericValue;
  /**
   * @type {Boolean}
   */
  hasRelativeValue;

  /**
   * @param {String} metric
   * @param {MetadataComparator} comparator
   * @param {SearchableMetadataMetric | Number} value
   */
  constructor(metric, comparator, value) {
    this.metric = Types.isSearchableMetadataMetric(metric) ? metric : "id";
    this.operator = comparator;
    this.hasRelativeValue = Types.isSearchableMetadataMetric(value);

    if (Types.isSearchableMetadataMetric(value)) {
      this.numericValue = 0;
      this.relativeValue = value;
    } else {
      this.numericValue = value;
      this.relativeValue = "id";
    }
  }
}
