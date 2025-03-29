class GalleryMenuButtonTemplate {

  /**
   * @param {Object} param
   * @param {String} param.id
   * @param {String} param.icon
   * @param {String} param.action
   * @param {Boolean} param.enabled
   * @param {String} param.handler
   * @param {String} param.hint
   * @param {String} param.color
   */
  constructor({id, icon, action = "none", enabled = true, handler = "galleryController", hint = "", color = "white"}) {
    this.id = id;
    this.icon = icon;
    this.action = action;
    this.enabled = enabled;
    this.handler = handler;
    this.hint = hint;
    this.color = color;
  }
}
