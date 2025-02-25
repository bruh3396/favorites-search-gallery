class MetadataSearchExpression {
  /**
   * @type {String}
   */
  metric;
  /**
   * @type {String}
   */
  operator;
  /**
   * @type {String | Number}
   */
  value;

  /**
   * @param {String} metric
   * @param {String} operator
   * @param {String} value
   */
  constructor(metric, operator, value) {
    this.metric = metric;
    this.operator = operator;
    this.value = this.setValue(value);
  }

  /**
   * @param {String} value
   * @returns {String | Number}
   */
  setValue(value) {
    if (!Utils.isOnlyDigits(value)) {
      return value;
    }

    if (this.metric === "id" && this.operator === ":") {
      return value;
    }
    return parseInt(value);
  }
}
