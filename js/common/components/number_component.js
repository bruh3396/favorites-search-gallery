class NumberComponent {
  /** @type {HTMLInputElement} */
  input;
  /** @type {HoldButton} */
  upArrow;
  /** @type {HoldButton} */
  downArrow;
  /** @type {Number} */
  stepSize;
  /** @type {NumberRange} */
  range;
  /** @type {Number} */
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
    this.stepSize = Math.round(parseFloat(this.input.getAttribute("step") || "1"));

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
    this.setValue(this.getSnapMax(this.getSanitizedValue()));
  }

  decrement() {
    const value = this.getSanitizedValue();

    if (value % this.stepSize === 0) {
      this.setValue(value - this.stepSize);
      return;
    }
    this.setValue(this.getSnapMin(value));
  }

  /**
   * @param {Number} value
   */
  setValue(value) {
    this.input.value = String(Utils.clamp(value, this.range.min, this.range.max));
  }

  /**
   * @param {Number} value
   * @returns {Number}
   */
  getSnapMin(value) {
    return Math.floor(value / this.stepSize) * this.stepSize;
  }

  /**
   * @param {Number} value
   * @returns {Number}
   */
  getSnapMax(value) {
    return this.getSnapMin(value) + this.stepSize;
  }

  /**
   * @returns {Number}
   */
  getSanitizedValue() {
    const value = parseFloat(this.input.value);
    return isNaN(value) ? this.range.min : value;
  }
}
