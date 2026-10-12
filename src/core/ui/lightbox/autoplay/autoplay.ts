import { Readable, Signal, effect } from "@/core/utils/reactive/signal";
import { MediaItem } from "@/core/domain/post/post";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

export interface LightboxAutoplayConfiguration {
  readonly interval: number;
}

export interface LightboxAutoplayDependencies {
  current: Readable<MediaItem | undefined>;
  showNext: () => void;
  scheduler: Pick<Scheduler, "schedule">;
}

export interface AutoplayCountdown {
  readonly duration: number;
}

export class LightboxAutoplay {
  private readonly isPlayingState = new Signal(false);
  private readonly countdownState = new Signal<AutoplayCountdown | undefined>(undefined);
  private readonly stopEffect: () => void;
  private cancelStep: (() => void) | undefined;

  constructor(private readonly configuration: LightboxAutoplayConfiguration, private readonly dependencies: LightboxAutoplayDependencies) {
    this.stopEffect = effect(() => this.scheduleStep(dependencies.current.value, this.isPlayingState.value));
  }

  public get isPlaying(): Readable<boolean> {
    return this.isPlayingState;
  }

  public get countdown(): Readable<AutoplayCountdown | undefined> {
    return this.countdownState;
  }

  public toggle(): void {
    this.isPlayingState.value = !this.isPlayingState.peek();
  }

  public stop(): void {
    this.isPlayingState.value = false;
  }

  public finishVideo(): void {
    if (this.isPlayingState.peek() && this.dependencies.current.peek()?.media.kind === "video") {
      this.dependencies.showNext();
    }
  }

  public dispose(): void {
    this.stopEffect();
    this.cancelStep?.();
  }

  private scheduleStep(item: MediaItem | undefined, isPlaying: boolean): void {
    this.cancelStep?.();
    this.cancelStep = undefined;

    if (!isPlaying || item === undefined || item.media.kind === "video") {
      this.countdownState.value = undefined;
      return;
    }
    const { interval } = this.configuration;

    this.countdownState.value = { duration: interval };
    this.cancelStep = this.dependencies.scheduler.schedule(() => this.dependencies.showNext(), interval);
  }
}
