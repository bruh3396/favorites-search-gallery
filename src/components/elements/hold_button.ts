import {ON_MOBILE_DEVICE} from "../../lib/functional/flags";
import {clamp} from "../../utils/primitive/number";

export default class HoldButton extends HTMLElement {
  static {
    customElements.define("hold-button", HoldButton);
  }

  private static defaultPollingTime: number = 100;
  private static minPollingTime: number = 40;
  private static maxPollingTime: number = 500;

  private intervalId: number | undefined;
  private timeoutId: number | undefined;
  private pollingTime = HoldButton.defaultPollingTime;
  private holdingDown: boolean = false;

  public connectedCallback(): void {
    if (ON_MOBILE_DEVICE) {
      return;
    }
    this.addEventListeners();
    this.initializePollingTime();
  }

  private initializePollingTime(): void {
    const pollingTime = this.getAttribute("pollingtime");

    if (pollingTime !== null) {
      this.setPollingTime(pollingTime);
    }
  }

  public attributeChangedCallback(name: string, _: null, newValue: string): void {
    switch (name) {
      case "pollingtime":
        this.setPollingTime(newValue);
        break;

      default:
        break;
    }
  }

  private setPollingTime(newValue: string): void {
    this.stopPolling();
    const pollingTime = parseFloat(newValue) || HoldButton.defaultPollingTime;

    this.pollingTime = clamp(Math.round(pollingTime), HoldButton.minPollingTime, HoldButton.maxPollingTime);
  }

  private addEventListeners(): void {
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

  private startPolling(): void {
    this.timeoutId = setTimeout(() => {
      this.intervalId = setInterval(() => {
        this.onmousehold();
      }, this.pollingTime);
    }, this.pollingTime);
  }

  private stopPolling(): void {
    clearTimeout(this.timeoutId);
    clearInterval(this.intervalId);
  }

  public onmousehold(): void {
  }

  public onMouseLeaveWhileHoldingDown(): void {
  }
}
