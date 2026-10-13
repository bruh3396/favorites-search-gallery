import { Readable, Signal } from "@/core/utils/reactive/signal";

const MODIFIER_EVENTS = ["keydown", "keyup", "pointermove"] as const;

export class LightboxShiftKey {
  private readonly isHeldState = new Signal(false);
  private document: Document | undefined;

  public get isHeld(): Readable<boolean> {
    return this.isHeldState;
  }

  public start(document: Document): void {
    this.stop();
    this.document = document;
    MODIFIER_EVENTS.forEach(type => document.addEventListener(type, this.onModifierEvent));
    document.defaultView?.addEventListener("blur", this.onBlur);
  }

  public stop(): void {
    MODIFIER_EVENTS.forEach(type => this.document?.removeEventListener(type, this.onModifierEvent));
    this.document?.defaultView?.removeEventListener("blur", this.onBlur);
    this.document = undefined;
    this.isHeldState.value = false;
  }

  private readonly onModifierEvent = (event: KeyboardEvent | PointerEvent): void => {
    this.isHeldState.value = event.shiftKey;
  };

  private readonly onBlur = (): void => {
    this.isHeldState.value = false;
  };
}
