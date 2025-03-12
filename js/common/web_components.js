class HoldButton extends HTMLElement {
  static {
    Utils.addStaticInitializer(() => {
      customElements.define("hold-button", HoldButton);
    });
  }

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
   * @type {Timeout}
   */
  intervalId;
  /**
   * @type {Timeout}
   */
  timeoutId;
  /**
   * @type {Number}
   */
  pollingTime = HoldButton.defaultPollingTime;
  /**
   * @type {Boolean}
   */
  holdingDown = false;

  connectedCallback() {
    if (Flags.onMobileDevice) {
      return;
    }
    this.addEventListeners();
    this.initializePollingTime();
  }

  initializePollingTime() {
    const pollingTime = this.getAttribute("pollingtime");

    if (pollingTime !== null) {
      this.setPollingTime(pollingTime);
    }
  }

  /**
   * @param {String} name
   * @param {String} _
   * @param {String} newValue
   */
  attributeChangedCallback(name, _, newValue) {
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

    this.pollingTime = Utils.clamp(Math.round(pollingTime), HoldButton.minPollingTime, HoldButton.maxPollingTime);
  }

  addEventListeners() {
    this.addEventListener("mousedown", (event) => {
      if (event.button === 0) {
        this.holdingDown = true;
        this.startPolling();
      }
    });

    this.addEventListener("mouseup", (event) => {
      if (event.button === 0) {
        this.holdingDown = false;
        this.stopPolling();
      }
    });

    this.addEventListener("mouseleave", () => {
      if (this.holdingDown) {
        this.onMouseLeaveWhileHoldingDown();
        this.holdingDown = false;
      }
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

  onMouseLeaveWhileHoldingDown() {
  }
}

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
  stepSize;
  /**
   * @type {{min: Number, max: Number}}
   */
  range;
  /**
   * @type {Number}
   */
  defaultValue;

  /**
   * @param {HTMLElement} element
   */
  constructor(element) {
    this.extractSubElements(element);
    this.initializeFields();
    this.addEventListeners();
  }

  initializeFields() {
    this.stepSize = Utils.roundToTwoDecimalPlaces(parseFloat(this.input.getAttribute("step") || "1"));

    if (this.input.onchange === null) {
      this.input.onchange = () => { };
    }

    this.range = {
      min: parseFloat(this.input.getAttribute("min") || "0"),
      max: parseFloat(this.input.getAttribute("max") || "100")
    };
    this.defaultValue = parseFloat(this.input.getAttribute("defaultValue") || "1");
    this.setValue(this.defaultValue);
  }

  /**
   * @param {HTMLElement} element
   */
  extractSubElements(element) {
    this.input = element.querySelector("input") || document.createElement("input");
    this.upArrow = element.querySelector(".number-arrow-up") || new HoldButton();
    this.downArrow = element.querySelector(".number-arrow-down") || new HoldButton();
  }

  addEventListeners() {
    this.upArrow.onmousehold = () => {
      this.increment();
    };
    this.downArrow.onmousehold = () => {
      this.decrement();
    };
    this.upArrow.addEventListener("mousedown", (event) => {
      if (event.button === 0) {
        this.increment();
      }
    });
    this.downArrow.addEventListener("mousedown", (event) => {
      if (event.button === 0) {
        this.decrement();
      }
    });
    this.upArrow.addEventListener("mouseup", () => {
      this.onChange();
    });
    this.downArrow.addEventListener("mouseup", () => {
      this.onChange();
    });
    this.upArrow.onMouseLeaveWhileHoldingDown = () => {
      this.onChange();
    };
    this.downArrow.onMouseLeaveWhileHoldingDown = () => {
      this.onChange();
    };
    this.input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        this.setValue(Number(this.input.value));
      }
    });
  }

  onChange() {
    this.input.dispatchEvent(new Event("change"));
  }

  increment() {
    this.setValue((parseFloat(this.input.value) || 1) + this.stepSize);
  }

  decrement() {
    this.setValue((parseFloat(this.input.value) || 1) - this.stepSize);
  }

  /**
   * @param {Number} value
   */
  setValue(value) {
    value = Number(isNaN(value) ? this.range.min : value);
    this.input.value = String(Utils.clamp(value, this.range.min, this.range.max));
  }
}
