class UIElement {
  /**
   * @type {String}
   */
  id;
  /**
   * @type {String}
   */
  parentId;
  /**
   * @type {String}
   */
  textContent;
  /**
   * @type {String}
   */
  action;
  /**
   * @type {Boolean}
   */
  enabled;
  /**
   * @type {Object}
   */
  defaultValue;

  constructor({id, parentId, textContent, enabled, action, defaultValue}) {
    this.id = id;
    this.parentId = parentId;
    this.textContent = textContent;
    this.enabled = enabled;
    this.action = action;
    this.defaultValue = defaultValue;
  }
}
