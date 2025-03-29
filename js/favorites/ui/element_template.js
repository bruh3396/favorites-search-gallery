/**
 * @template T
 */
class ElementTemplate {

  /**
   * @param {ElementTemplateParams<T>} param0
   */
  constructor({id,
    parentId,
    position = "afterbegin",
    textContent = "",
    title = "",
    enabled = true,
    action = "none",
    hotkey = "none",
    invokeActionOnCreation = false,
    savePreference = true,
    // @ts-ignore
    optionPairs = {},
    min = 0,
    max = 100,
    step = 1,
    pollingTime = 50,
    preference = null,
    defaultValue = null,
    eventEmitter = null,
    useContainer = true}) {
    this.id = id;
    this.parentId = parentId;
    this.position = position;
    this.textContent = textContent;
    this.title = title;
    this.enabled = enabled;
    this.action = action;
    this.hotkey = hotkey;
    this.invokeActionOnCreation = invokeActionOnCreation;
    this.savePreference = savePreference;
    this.optionPairs = optionPairs;
    this.min = min;
    this.max = max;
    this.step = step;
    this.pollingTime = pollingTime;
    this.preference = preference;
    this.defaultValue = defaultValue;
    this.eventEmitter = eventEmitter;
    this.useContainer = useContainer;
  }
}
