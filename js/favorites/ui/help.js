class HelpMenu {
  /** @type {HTMLElement} */
  parent;

  /**
   * @param {String} parentSelector
   */
  constructor(parentSelector) {
    const parent = document.querySelector(parentSelector);

    if (!(parent instanceof HTMLElement)) {
      return;
    }
    this.parent = parent;
    this.insertHTML();
    this.setupWhatsNewMenu();
  }

  insertHTML() {
    this.parent.insertAdjacentHTML("beforeend", HTMLStrings.help);
  }

  setupWhatsNewMenu() {
    if (Flags.onMobileDevice) {
      return;
    }
    const whatsNew = document.getElementById("whats-new-link");

    if (whatsNew === null) {
      return;
    }
    whatsNew.onclick = () => {
      if (whatsNew.classList.contains("persistent")) {
        whatsNew.classList.remove("persistent");
        whatsNew.classList.add("hidden");
      } else {
        whatsNew.classList.add("persistent");
      }
      return false;
    };

    whatsNew.onblur = () => {
      whatsNew.classList.remove("persistent");
      whatsNew.classList.add("hidden");
    };

    whatsNew.onmouseenter = () => {
      whatsNew.classList.remove("hidden");
    };

    whatsNew.onmouseleave = () => {
      whatsNew.classList.add("hidden");
    };
  }
}
