import { Events } from "../global/events/events";
import { Timeout } from "../../types/primitives/primitives";

export class InteractionTracker {
  public onInteractionStopped: () => void;
  public onMouseMoveStopped: () => void;
  public onScrollingStopped: () => void;
  public onNoInteractionOnStart: () => void;
  public idleDuration: number;
  public mouseTimeout: Timeout;
  public scrollTimeout: Timeout;
  public interactionOnStartTimeout: Timeout;
  public mouseIsMoving: boolean;
  public scrolling: boolean;
  public abortController: AbortController;

  constructor(
    idleDuration: number,
    onInteractionStopped: () => void,
    onMouseMoveStopped: () => void,
    onScrollingStopped: () => void,
    onNoInteractionOnStart: () => void
  ) {
    this.idleDuration = idleDuration;
    this.onInteractionStopped = onInteractionStopped;
    this.onMouseMoveStopped = onMouseMoveStopped;
    this.onScrollingStopped = onScrollingStopped;
    this.onNoInteractionOnStart = onNoInteractionOnStart;
    this.mouseIsMoving = false;
    this.scrolling = false;
    this.abortController = new AbortController();
  }

  public start(): void {
    this.toggle(true);
  }

  public stop(): void {
    this.toggle(false);
  }

  public toggle(value: boolean): void {
    if (value) {
      this.abortController = new AbortController();
      this.startInteractionOnStartTimer();
      this.trackMouseMove();
      this.trackScroll();
      return;
    }
    this.abortController.abort();
  }

  public startInteractionOnStartTimer(): void {
    this.interactionOnStartTimeout = setTimeout(() => {
      this.onNoInteractionOnStart();
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
    clearTimeout(this.interactionOnStartTimeout);
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
    clearTimeout(this.interactionOnStartTimeout);
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
