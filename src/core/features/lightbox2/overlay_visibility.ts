import { Readable, Signal } from "@/core/utils/reactive/signal";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

export interface LightboxOverlayVisibilityConfiguration {
  readonly idleDelay: number;
  readonly leaveDelay: number;
}

export class LightboxOverlayVisibility {
  private readonly visibleState = new Signal(true);
  private readonly idleDelay: number;
  private readonly leaveDelay: number;
  private readonly scheduler: Pick<Scheduler, "schedule">;
  private isHeld = false;

  constructor(configuration: LightboxOverlayVisibilityConfiguration, scheduler: Pick<Scheduler, "schedule">) {
    this.idleDelay = configuration.idleDelay;
    this.leaveDelay = configuration.leaveDelay;
    this.scheduler = scheduler;
  }

  public get visible(): Readable<boolean> {
    return this.visibleState;
  }

  public wake(): void {
    this.visibleState.value = true;
    this.scheduleHide(this.idleDelay);
  }

  public leave(): void {
    this.scheduleHide(this.leaveDelay);
  }

  public hold(): void {
    this.isHeld = true;
    this.cancelHide();
    this.visibleState.value = true;
  }

  public release(): void {
    this.isHeld = false;
    this.scheduleHide(this.idleDelay);
  }

  public dispose(): void {
    this.cancelHide();
  }

  private scheduleHide(delay: number): void {
    this.cancelHide();

    if (!this.isHeld) {
      this.cancelHide = this.scheduler.schedule(() => {
        this.visibleState.value = false;
      }, delay);
    }
  }

  private cancelHide = (): void => { };
}
