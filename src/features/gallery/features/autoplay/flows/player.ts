import { AutoplayDuration, AutoplayIntents } from "@/features/gallery/features/autoplay/types/types";
import { AutoplayFlow, AutoplayFlowDependencies } from "@/features/gallery/features/autoplay/flows/flow";
import { EnhancedKeyboardEvent } from "@/lib/event/input";
import { MediaItem } from "@/types/media";
import { Timer } from "@/lib/async/scheduling";

export class AutoplayPlayerFlow extends AutoplayFlow implements AutoplayIntents {
  private readonly timers: Record<AutoplayDuration, Timer>;
  private item: MediaItem | null;
  private open: boolean;

  constructor(dependencies: AutoplayFlowDependencies) {
    super(dependencies);
    this.timers = {
      image: new Timer(this.context.durations.image.value),
      minimumVideo: new Timer(this.context.durations.minimumVideo.value)
    };
    this.item = null;
    this.open = false;
    this.timers.image.onTimerEnd = (): void => this.advance();
  }

  public mount(container: HTMLElement): void {
    this.view.mount(container);
    this.refresh();
  }

  public refresh(): void {
    this.context.setVideoLooping(!this.isRunning());
    this.view.showContainer(this.isShowing());

    if (this.isShowing()) {
      this.flows.menu.show();
    } else {
      this.flows.menu.hide();
    }
    this.restartTimer();
  }

  public openGallery(): void {
    this.open = true;
    this.refresh();
  }

  public closeGallery(): void {
    this.open = false;
    this.refresh();
  }

  public display(item: MediaItem): void {
    this.item = item;
    this.restartTimer();
  }

  public handleVideoEnded(): void {
    if (!this.isRunning()) {
      return;
    }

    if (this.timers.minimumVideo.isRunning) {
      this.context.restartVideo();
    } else {
      this.advance();
    }
  }

  public handleKeyDown(event: EnhancedKeyboardEvent): void {
    if (this.isShowing() && event.isHotkey && this.model.togglesPause(event.key, this.item)) {
      this.togglePause();
    }
  }

  public isShowing(): boolean {
    return this.open && this.context.active.value;
  }

  public togglePause(): void {
    this.context.paused.set(!this.context.paused.value);
    this.view.render();
    this.context.setVideoLooping(!this.isRunning());
    this.restartTimer();
    this.flows.menu.show();
  }

  public toggleDirection(): void {
    this.context.forward.set(!this.context.forward.value);
    this.view.render();
    this.flows.menu.show();
  }

  public toggleSettings(): void {
    this.flows.menu.toggleSettings();
  }

  public holdMenu(held: boolean): void {
    this.flows.menu.hold(held);
  }

  public changeDuration(kind: AutoplayDuration, seconds: string): void {
    const duration = this.context.durations[kind];

    duration.set(this.model.parseDuration(kind, seconds, duration.value));
    this.timers[kind].waitTime = duration.value;
    this.view.render();

    if (this.item !== null && this.model.timerFor(this.item) === kind) {
      this.restartTimer();
    }
  }

  private isRunning(): boolean {
    return this.isShowing() && !this.context.paused.value;
  }

  private advance(): void {
    if (this.isRunning()) {
      this.context.navigate(this.model.direction(this.context.forward.value));
    }
  }

  private restartTimer(): void {
    this.timers.image.stop();
    this.timers.minimumVideo.stop();
    this.view.stopProgress();

    if (!this.isRunning() || this.item === null) {
      return;
    }
    const kind = this.model.timerFor(this.item);

    this.timers[kind].restart();
    this.view.startProgress(kind);
  }
}
