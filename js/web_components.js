class HoldButton extends HTMLElement {
  /**
   * @type {Number}
  */
  static defaultPollingTime = 100;
  /**
   * @type {Number}
  */
  static minPollingTime = 40;
  /**
   * @type {Number}
  */
  static maxPollingTime = 500;

  /**
   * @type {Number}
  */
  intervalId;
  /**
   * @type {Number}
  */
  timeoutId;
  /**
   * @type {Number}
  */
  pollingTime = HoldButton.defaultPollingTime;

  connectedCallback() {
    if (onMobileDevice()) {
      return;
    }
    this.addEventListeners();
    this.setPollingTime(this.getAttribute("pollingtime"));

  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case "pollingtime":
        this.setPollingTime(newValue);
        break;

      default:
        break;
    }
  }

  /**
   * @param {String} newValue
   */
  setPollingTime(newValue) {
    this.stopPolling();
    const pollingTime = parseFloat(newValue) || HoldButton.defaultPollingTime;

    this.pollingTime = clamp(Math.round(pollingTime), HoldButton.minPollingTime, HoldButton.maxPollingTime);
  }

  addEventListeners() {
    this.addEventListener("mousedown", (event) => {
      if (event.button === 0) {
        this.startPolling();
      }
    });

    this.addEventListener("mouseup", (event) => {
      if (event.button === 0) {
        this.stopPolling();
      }
    });

    this.addEventListener("mouseleave", () => {
      this.stopPolling();
    });
  }

  startPolling() {
    this.timeoutId = setTimeout(() => {
      this.intervalId = setInterval(() => {
        this.onmousehold();
      }, this.pollingTime);
    }, this.pollingTime);
  }

  stopPolling() {
    clearTimeout(this.timeoutId);
    clearInterval(this.intervalId);
  }

  onmousehold() {
  }
}

customElements.define("hold-button", HoldButton);

class NumberComponent {
  /**
   * @type {HTMLInputElement}
  */
  input;
  /**
   * @type {HoldButton}
  */
  upArrow;
  /**
   * @type {HoldButton}
  */
  downArrow;
  /**
   * @type {Number}
  */
  increment;

  /**
   * @type {Boolean}
  */
  get allSubComponentsConnected() {
    return this.input !== null && this.upArrow !== null && this.downArrow !== null;
  }

  /**
   * @param {HTMLDivElement} element
   */
  constructor(element) {
    this.connectSubElements(element);
    this.initializeFields();
    this.addEventListeners();
  }

  initializeFields() {
    if (!this.allSubComponentsConnected) {
      return;
    }
    this.increment = roundToTwoDecimalPlaces(parseFloat(this.input.getAttribute("step")) || 1);

    if (this.input.onchange === null) {
      this.input.onchange = () => { };
    }
  }

  /**
   * @param {HTMLDivElement} element
   */
  connectSubElements(element) {
    this.input = element.querySelector("input");
    this.upArrow = element.querySelector(".number-arrow-up");
    this.downArrow = element.querySelector(".number-arrow-down");
  }

  addEventListeners() {
    if (!this.allSubComponentsConnected) {
      return;
    }
    this.upArrow.onmousehold = () => {
      this.incrementInput();
    };
    this.upArrow.addEventListener("mousedown", (event) => {
      if (event.button === 0) {
        this.incrementInput();
      }
    });
    this.downArrow.onmousehold = () => {
      this.decrementInput();
    };
    this.downArrow.addEventListener("mousedown", (event) => {
      if (event.button === 0) {
        this.decrementInput();
      }
    });
  }

  incrementInput() {
    this.changeInput(true);
  }

  decrementInput() {
    this.changeInput(false);
  }

  /**
   * @param {Boolean} add
   */
  changeInput(add) {
    const currentValue = parseFloat(this.input.value) || 1;

    this.input.value = add ? currentValue + this.increment : currentValue - this.increment;
    this.input.onchange();
  }
}
