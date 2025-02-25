class GalleryMenuButtonTemplate {
  /* eslint-disable object-property-newline */
  /* eslint-disable object-curly-newline */
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

class GalleryMenu {
  static buttons = [
    {id: "exit-gallery", icon: Utils.icons.exit, action: "exitGallery", enabled: true, handler: "galleryController", hint: "Exit (Escape, Right-Click)", color: "red"},
    {id: "fullscreen-gallery", icon: Utils.icons.fullscreenEnter, action: "fullscreen", enabled: true, handler: "galleryMenu", hint: "Toggle Fullscreen", color: "#0075FF"},
    {id: "open-in-new-gallery", icon: Utils.icons.openInNew, action: "openPost", enabled: true, handler: "galleryController", hint: "Open Post (Middle-Click)", color: "lightgreen"},
    {id: "download-gallery", icon: Utils.icons.download, action: "download", enabled: true, handler: "galleryController", hint: "Open Original (Ctrl + Left-Click)", color: "lightskyblue"},
    {id: "add-favorite-gallery", icon: Utils.icons.heartPlus, action: "addFavorite", enabled: true, handler: "galleryController", hint: "Add Favorite (F)", color: "hotpink"},
    {id: "remove-favorite-gallery", icon: Utils.icons.heartMinus, action: "removeFavorite", enabled: false, handler: "galleryController", hint: "Remove Favorite (X)", color: "red"},
    {id: "dock-gallery", icon: Utils.icons.dock, action: "toggleDockPosition", enabled: false, handler: "galleryMenu", hint: "Change Position", color: ""},
    {id: "toggle-background-gallery", icon: Utils.icons.bulb, action: "toggleBackground", enabled: true, handler: "galleryController", hint: "Toggle Background (B)", color: "gold"},
    {id: "pin-gallery", icon: Utils.icons.pin, action: "pin", enabled: true, handler: "galleryMenu", hint: "Pin", color: "#0075FF"}
  ];

  /**
   * @type {HTMLElement}
   */
  container;
  /**
   * @type {Timeout}
   */
  menuVisibilityTimeout;

  /**
   * @param {HTMLElement} galleryContainer
   */
  constructor(galleryContainer) {
    this.container = this.createContainer(galleryContainer);
    this.menuVisibilityTimeout = null;
    this.loadPreferences();
    this.createButtons();
    this.addEventListeners();
  }

  loadPreferences() {
    if (Utils.getPreference("galleryMenuDockLeft", true)) {
      this.toggleDockPosition();
    }

    if (Utils.getPreference("galleryMenuPin", false)) {
      this.togglePin();
    }
  }

  addEventListeners() {
    // @ts-ignore
    this.container.addEventListener("galleryMenu", (/** @type CustomEvent */event) => {
      switch (event.detail) {
        case "fullscreen":
          Utils.toggleFullscreen();
          break;

        case "pin":
          this.togglePin();
          break;

        case "toggleDockPosition":
          this.toggleDockPosition();
          break;

        default:
          break;
      }
    });
    document.addEventListener("mousemove", Utils.throttle(() => {
      this.reveal();
    }, 250));

    document.addEventListener("mouseover", (event) => {
      this.togglePersistence(event);
    });
  }

  /**
   * @param {HTMLElement} galleryContainer
   * @returns {HTMLElement}
   */
  createContainer(galleryContainer) {
    const container = document.createElement("div");

    container.id = "gallery-menu";
    container.className = "gallery-sub-menu";
    galleryContainer.appendChild(container);
    return container;
  }

  createButtons() {
    const buttonContainer = document.createElement("div");

    buttonContainer.id = "gallery-menu-button-container";

    for (const template of GalleryMenu.buttons) {
      const buttonTemplate = new GalleryMenuButtonTemplate(template);

      if (template.enabled) {
        const button = this.createButton(buttonTemplate);

        buttonContainer.appendChild(button);
      }
    }
    this.container.appendChild(buttonContainer);
  }

  /**
   * @param {GalleryMenuButtonTemplate} template
   */
  createButton(template) {
    const button = document.createElement("span");

    button.innerHTML = template.icon;
    button.id = template.id;
    button.className = "gallery-menu-button";
    button.dataset.hint = template.hint;
    this.container.appendChild(button);
    button.onclick = () => {
      button.dispatchEvent(new CustomEvent(template.handler, {bubbles: true, detail: template.action}));
    };

    Utils.insertStyleHTML(`
        #${template.id}:hover {
          &::after {
            outline: 2px solid ${template.color};
          }

          color: ${template.color};

          >svg {
            fill: ${template.color};
          }
        }
      `, template.id);
    return button;
  }

  reveal() {
    this.container.classList.add("active");
    clearTimeout(this.menuVisibilityTimeout);
    this.menuVisibilityTimeout = setTimeout(() => {
      this.hide();
    }, GalleryConstants.galleryMenuVisibilityTime);
  }

  hide() {
    this.container.classList.remove("active");
  }

  /**
   * @param {MouseEvent} event
   */
  togglePersistence(event) {
    const value = event.target instanceof HTMLElement && this.container.contains(event.target);

    this.container.classList.toggle("persistent", value);
  }

  togglePin() {
    const pinned = this.container.classList.toggle("pinned");

    Utils.setPreference("galleryMenuPin", pinned);
  }

  toggleDockPosition() {
    const dockLeft = this.container.classList.toggle("dock-left");

    Utils.setPreference("galleryMenuDockLeft", dockLeft);
  }
}
