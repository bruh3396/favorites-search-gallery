class GalleryMenu {
  /* eslint-disable object-property-newline */
  /* eslint-disable object-curly-newline */

  static buttons = [
    {id: "exit-gallery", icon: SVGIcons.exit, action: "exitGallery", enabled: true, handler: "galleryController", hint: "Exit (Escape, Right-Click)", color: "red"},
    {id: "fullscreen-gallery", icon: SVGIcons.fullscreenEnter, action: "fullscreen", enabled: true, handler: "galleryMenu", hint: "Toggle Fullscreen (F)", color: "#0075FF"},
    {id: "open-in-new-gallery", icon: SVGIcons.openInNew, action: "openPost", enabled: true, handler: "galleryController", hint: "Open Post (Middle-Click, G)", color: "lightgreen"},
    {id: "download-gallery", icon: SVGIcons.download, action: "download", enabled: true, handler: "galleryController", hint: "Open Original (Ctrl + Left-Click, Q)", color: "lightskyblue"},
    {id: "add-favorite-gallery", icon: SVGIcons.heartPlus, action: "addFavorite", enabled: true, handler: "galleryController", hint: "Add Favorite (E)", color: "hotpink"},
    {id: "remove-favorite-gallery", icon: SVGIcons.heartMinus, action: "removeFavorite", enabled: false, handler: "galleryController", hint: "Remove Favorite (X)", color: "red"},
    {id: "dock-gallery", icon: SVGIcons.dock, action: "toggleDockPosition", enabled: false, handler: "galleryMenu", hint: "Change Position", color: ""},
    {id: "toggle-background-gallery", icon: SVGIcons.bulb, action: "toggleBackground", enabled: true, handler: "galleryController", hint: "Toggle Background (B)", color: "gold"},
    {id: "search-gallery", icon: SVGIcons.search, action: "search", enabled: false, handler: "galleryController", hint: "Search", color: "cyan"},
    {id: "background-color-gallery", icon: SVGIcons.palette, action: "changeBackgroundColor", enabled: true, handler: "galleryMenu", hint: "Background Color", color: "orange"},
    {id: "pin-gallery", icon: SVGIcons.pin, action: "pin", enabled: true, handler: "galleryMenu", hint: "Pin", color: "#0075FF"}
  ];

  /** @type {HTMLElement} */
  container;
  /** @type {Timeout} */
  menuVisibilityTimeout;

  /**
   * @param {HTMLElement} galleryContainer
   */
  constructor(galleryContainer) {
    this.container = this.createContainer(galleryContainer);
    this.menuVisibilityTimeout = null;
    this.loadPreferences();
    this.createButtons();
    this.createColorPicker();
    this.addEventListeners();
  }

  loadPreferences() {
    if (Preferences.dockGalleryMenuLeft.value) {
      this.toggleDockPosition();
    }

    if (Preferences.galleryMenuPinned.value) {
      this.togglePin();
    }

    Utils.toggleGalleryMenu(Preferences.galleryMenuEnabled.value);
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
    Events.global.mousemove.on(Utils.throttle(() => {
      this.reveal();
    }, 250));

    Events.global.mouseover.on((mouseOverEvent) => {
      this.togglePersistence(mouseOverEvent.originalEvent);
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
      button.dispatchEvent(new CustomEvent(template.handler, {
        bubbles: true,
        detail: template.action
      }));
    };

    if (template.color !== "") {
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
    }
    return button;
  }

  createColorPicker() {
    const button = document.getElementById("background-color-gallery");
    const toggleMouseDown = (/** @type {Boolean} */ value) => {
      value;
      // if (value) {
      //   Events.document.click.resume();
      //   Events.document.mouseDown.resume();
      // } else {
      //   Events.document.click.freeze();
      //   Events.document.mouseDown.freeze();
      // }
    };

    if (!(button instanceof HTMLElement)) {
      return;
    }
    const colorPicker = document.createElement("input");

    colorPicker.type = "color";
    colorPicker.id = "gallery-menu-background-color-picker";
    button.onclick = () => {
      toggleMouseDown(false);
      colorPicker.click();
    };
    colorPicker.oninput = () => {
      Utils.setColorScheme(colorPicker.value);
    };
    colorPicker.onblur = () => {
      toggleMouseDown(true);
    };
    colorPicker.onchange = () => {
      toggleMouseDown(true);
    };

    if (Preferences.colorScheme.defaultValue !== Preferences.colorScheme.value) {
      Utils.setColorScheme(Preferences.colorScheme.value);
    }
    button.insertAdjacentElement("afterbegin", colorPicker);
  }

  reveal() {
    this.container.classList.add("active");
    clearTimeout(this.menuVisibilityTimeout);
    this.menuVisibilityTimeout = setTimeout(() => {
      this.hide();
    }, GallerySettings.menuVisibilityTime);
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
    Preferences.galleryMenuPinned.set(this.container.classList.toggle("pinned"));
  }

  toggleDockPosition() {
    Preferences.dockGalleryMenuLeft.set(this.container.classList.toggle("dock-left"));
  }
}
