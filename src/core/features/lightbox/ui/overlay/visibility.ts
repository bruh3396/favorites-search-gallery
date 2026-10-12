import { Readable, Signal } from "@/core/utils/reactive/signal";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

export interface LightboxOverlayVisibilityConfiguration {
  readonly idleDelay: number;
  readonly hideSoonDelay: number;
}

export class LightboxOverlayVisibility {
  private readonly shownState = new Signal(false);
  private isHeld = false;
  private cancelHide: (() => void) | undefined;

  constructor(private readonly configuration: LightboxOverlayVisibilityConfiguration, private readonly scheduler: Pick<Scheduler, "schedule">) { }

  public get shown(): Readable<boolean> {
    return this.shownState;
  }

  public show(): void {
    this.shownState.value = true;

    if (!this.isHeld) {
      this.hideAfter(this.configuration.idleDelay);
    }
  }

  public hold(): void {
    this.isHeld = true;
    this.cancelHide?.();
    this.cancelHide = undefined;
  }

  public release(): void {
    this.isHeld = false;
    this.show();
  }

  public hideSoon(): void {
    this.isHeld = false;

    if (this.shownState.peek()) {

      this.hideAfter(this.configuration.hideSoonDelay);
    }
  }

  public hide(): void {
    this.isHeld = false;
    this.cancelHide?.();
    this.cancelHide = undefined;
    this.shownState.value = false;
  }

  private hideAfter(delay: number): void {
    this.cancelHide?.();
    this.cancelHide = this.scheduler.schedule(() => this.hide(), delay);
  }
}
