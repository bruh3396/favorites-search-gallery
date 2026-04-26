import { Events } from "../../communication/events";
import { Timeout } from "../../../types/common_types";

export class InteractionTracker {
  public onInteractionStopped: () => void;
  public onMouseMoveStopped: () => void;
  public onScrollingStopped: () => void;
  public onNoInteractionOnEnable: () => void;
  public idleDuration: number;
  public mouseTimeout: Timeout;
  public scrollTimeout: Timeout;
  public noInteractionOnEnableTimeout: Timeout;
  public mouseIsMoving: boolean;
  public scrolling: boolean;
  public abortController: AbortController;

  constructor(
    idleDuration: number,
    onInteractionStopped: () => void,
    onMouseMoveStopped: () => void,
    onScrollingStopped: () => void,
    onNoInteractionOnEnable: () => void
  ) {
    this.idleDuration = idleDuration;
    this.onInteractionStopped = onInteractionStopped;
    this.onMouseMoveStopped = onMouseMoveStopped;
    this.onScrollingStopped = onScrollingStopped;
    this.onNoInteractionOnEnable = onNoInteractionOnEnable;
    this.mouseIsMoving = false;
    this.scrolling = false;
    this.abortController = new AbortController();
  }

  public enable(): void {
    this.abortController = new AbortController();
    this.trackMouseMove();
    this.trackScroll();
    this.startNoInteractionOnEnableTimer();
  }

  public disable(): void {
    this.abortController.abort();
  }

  private startNoInteractionOnEnableTimer(): void {
    this.noInteractionOnEnableTimeout = setTimeout(() => {
      this.onNoInteractionOnEnable();
    }, this.idleDuration);
  }

  private trackMouseMove(): void {
    Events.document.mousemove.on(this.onMouseMove.bind(this), {
      passive: true,
      signal: this.abortController.signal
    });
  }

  private trackScroll(): void {
    window.addEventListener("scroll", this.onScroll.bind(this), {
      passive: true,
      signal: this.abortController.signal
    });
  }

  private onMouseMove(): void {
    this.mouseIsMoving = true;
    clearTimeout(this.noInteractionOnEnableTimeout);
    clearTimeout(this.mouseTimeout);
    this.mouseTimeout = setTimeout(() => {
      this.mouseIsMoving = false;
      this.onMouseMoveStopped();

      if (!this.scrolling) {
        this.onInteractionStopped();
      }
    }, this.idleDuration);
  }

  private onScroll(): void {
    this.scrolling = true;
    clearTimeout(this.noInteractionOnEnableTimeout);
    clearTimeout(this.scrollTimeout);
    this.scrollTimeout = setTimeout(() => {
      this.scrolling = false;
      this.onScrollingStopped();

      if (!this.mouseIsMoving) {
        this.onInteractionStopped();
      }
    }, this.idleDuration);
  }
}
