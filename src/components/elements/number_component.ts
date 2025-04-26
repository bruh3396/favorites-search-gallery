import HoldButton from "./hold_button";
import {clamp} from "../../utils/primitive/number";

export default class NumberComponent {
  private input: HTMLInputElement;
  private upArrow: HoldButton;
  private downArrow: HoldButton;
  private stepSize: number;
  private range: { min: number; max: number };
  private defaultValue: number;

  constructor(element: HTMLElement) {
    this.input = element.querySelector("input") || document.createElement("input");
    this.upArrow = element.querySelector(".number-arrow-up") || new HoldButton();
    this.downArrow = element.querySelector(".number-arrow-down") || new HoldButton();
    this.stepSize = 1;
    this.range = {min: 0, max: 100};
    this.defaultValue = 1;
    this.initializeFields();
    this.addEventListeners();
  }

  private initializeFields(): void {
    this.stepSize = Math.round(parseFloat(this.input.getAttribute("step") || "1"));

    if (this.input.onchange === null) {
      this.input.onchange = (): void => {};
    }

    this.range = {
      min: parseFloat(this.input.getAttribute("min") || "0"),
      max: parseFloat(this.input.getAttribute("max") || "100")
    };
    this.defaultValue = parseFloat(this.input.getAttribute("defaultValue") || "1");
    this.setValue(this.defaultValue);
  }

  private addEventListeners(): void {
    this.upArrow.onmousehold = (): void => {
      this.increment();
    };
    this.downArrow.onmousehold = (): void => {
      this.decrement();
    };
    this.upArrow.addEventListener("mousedown", (event: MouseEvent) => {
      if (event.button === 0) {
        this.increment();
      }
    });
    this.downArrow.addEventListener("mousedown", (event: MouseEvent) => {
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
    this.upArrow.onMouseLeaveWhileHoldingDown = (): void => {
      this.onChange();
    };
    this.downArrow.onMouseLeaveWhileHoldingDown = (): void => {
      this.onChange();
    };
    this.input.addEventListener("keydown", (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        this.setValue(Number(this.input.value));
      }
    });
  }

  private onChange(): void {
    this.input.dispatchEvent(new Event("change"));
  }

  private increment(): void {
    this.setValue(this.getSnapMax(this.getSanitizedValue()));
  }

  private decrement(): void {
    const value = this.getSanitizedValue();

    if (value % this.stepSize === 0) {
      this.setValue(value - this.stepSize);
      return;
    }
    this.setValue(this.getSnapMin(value));
  }

  private setValue(value: number): void {
    this.input.value = String(clamp(value, this.range.min, this.range.max));
  }

  private getSnapMin(value: number): number {
    return Math.floor(value / this.stepSize) * this.stepSize;
  }

  private getSnapMax(value: number): number {
    return this.getSnapMin(value) + this.stepSize;
  }

  private getSanitizedValue(): number {
    const value = parseFloat(this.input.value);
    return isNaN(value) ? this.range.min : value;
  }
}
