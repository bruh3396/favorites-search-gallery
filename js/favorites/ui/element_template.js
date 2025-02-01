class ElementTemplate {
  /**
   * @param {Object} param
   * @param {String} param.id
   * @param {String} param.parentId
   * @param {InsertPosition} param.position
   * @param {String} param.textContent
   * @param {String} param.title
   * @param {String} param.handler
   * @param {String} param.action
   * @param {String} param.hotkey
   * @param {Boolean} param.invokeActionOnCreation
   * @param {Boolean} param.savePreference
   * @param {Object} param.defaultValue
   * @param {Boolean} param.enabled
   * @param {Array.<[String, String]>} param.optionPairs
   * @param {Number} param.min
   * @param {Number} param.max
   * @param {Number} param.step
   * @param {Number} param.pollingTime
   */
  constructor({id,
    parentId,
    position = "afterbegin",
    textContent = "",
    title = "",
    enabled = true,
    handler = "controller",
    action = "none",
    hotkey = "none",
    invokeActionOnCreation = false,
    savePreference = true,
    defaultValue = {},
    optionPairs = [],
    min = 0,
    max = 100,
    step = 1,
    pollingTime = 50}) {
    this.id = id;
    this.parentId = parentId;
    this.position = position;
    this.textContent = textContent;
    this.title = title;
    this.enabled = enabled;
    this.handler = handler;
    this.action = action;
    this.hotkey = hotkey;
    this.invokeActionOnCreation = invokeActionOnCreation;
    this.savePreference = savePreference;
    this.defaultValue = defaultValue;
    this.optionPairs = optionPairs;
    this.min = min;
    this.max = max;
    this.step = step;
    this.pollingTime = pollingTime;
  }
}
