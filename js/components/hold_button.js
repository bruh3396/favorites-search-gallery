class HoldButton extends HTMLElement {
  static {
    customElements.define("hold-button", HoldButton);
  }

  /** @type {Number} */
  static defaultPollingTime = 100;
  /** @type {Number} */
  static minPollingTime = 40;
  /** @type {Number} */
  static maxPollingTime = 500;

  /** @type {Timeout} */
  intervalId;
  /** @type {Timeout} */
  timeoutId;
  /** @type {Number} */
  pollingTime = HoldButton.defaultPollingTime;
  /** @type {Boolean} */
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
