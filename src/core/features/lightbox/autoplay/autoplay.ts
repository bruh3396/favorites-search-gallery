import { Readable, Signal, effect } from "@/core/utils/reactive/signal";
import { MediaItem } from "@/core/domain/post/post";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";

export interface LightboxAutoplayConfiguration {
  readonly interval: number;
}

export interface LightboxAutoplayDependencies {
  current: Readable<MediaItem | undefined>;
  showNext: () => Promise<void>;
  scheduler: Pick<Scheduler, "schedule">;
}

export interface AutoplayCountdown {
  readonly duration: number;
}

export class LightboxAutoplay {
  private readonly isPlayingState = new Signal(false);
  private readonly countdownState = new Signal<AutoplayCountdown | undefined>(undefined);
  private readonly stopEffects: readonly (() => void)[];
  private cancelStep: (() => void) | undefined;

  constructor(private readonly configuration: LightboxAutoplayConfiguration, private readonly dependencies: LightboxAutoplayDependencies) {
    this.stopEffects = [
      effect(() => this.scheduleStep(dependencies.current.value, { isPlaying: this.isPlayingState.value })),
      effect(() => {
        if (dependencies.current.value === undefined) {
          this.stop();
        }
      })
    ];
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

  public showNextAfterVideo(): void {
    if (this.isPlayingState.peek() && this.dependencies.current.peek()?.media.kind === "video") {
      this.showNext();
    }
  }

  public dispose(): void {
    this.stopEffects.forEach(stopEffect => stopEffect());
    this.cancelStep?.();
  }

  private stop(): void {
    this.isPlayingState.value = false;
  }

  private scheduleStep(item: MediaItem | undefined, { isPlaying }: { isPlaying: boolean }): void {
    this.cancelStep?.();
    this.cancelStep = undefined;

    if (!isPlaying || item === undefined || item.media.kind === "video") {
      this.countdownState.value = undefined;
      return;
    }
    const { interval } = this.configuration;

    this.countdownState.value = { duration: interval };
    this.cancelStep = this.dependencies.scheduler.schedule(() => this.showNext(), interval);
  }

  private showNext(): void {
    this.dependencies.showNext().catch(console.error);
  }
}
