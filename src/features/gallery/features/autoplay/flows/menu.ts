import { AutoplayFlow, AutoplayFlowDependencies } from "@/features/gallery/features/autoplay/flows/flow";
import { AutoplayConfig } from "@/config/autoplay_config";
import { Timer } from "@/lib/async/scheduling";
import { throttle } from "@/lib/async/rate_limiting";

export class AutoplayMenuFlow extends AutoplayFlow {
  private readonly timer: Timer;
  private readonly showThrottled: () => void;
  private settingsOpen: boolean;

  constructor(dependencies: AutoplayFlowDependencies) {
    super(dependencies);
    this.timer = new Timer(AutoplayConfig.menuVisibilityTime[this.context.platform]);
    this.showThrottled = throttle(() => this.show(), AutoplayConfig.menuShowThrottleTime);
    this.settingsOpen = false;
    this.timer.onTimerEnd = (): void => this.expire();
  }

  public show(): void {
    this.view.showMenu(true);
    this.timer.restart();
  }

  public hide(): void {
    this.timer.stop();
    this.settingsOpen = false;
    this.view.showMenu(false);
    this.view.holdMenu(false);
    this.view.showSettings(false);
  }

  public hold(held: boolean): void {
    this.view.holdMenu(held);
  }

  public toggleSettings(): void {
    this.settingsOpen = !this.settingsOpen;
    this.view.showSettings(this.settingsOpen);
    this.show();
  }

  public handleMouseMove(): void {
    if (this.flows.player.isShowing()) {
      this.showThrottled();
    }
  }

  private expire(): void {
    if (this.settingsOpen) {
      this.timer.restart();
      return;
    }
    this.view.showMenu(false);
  }
}
