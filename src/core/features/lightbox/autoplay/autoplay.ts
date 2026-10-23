import { Readable, Signal, computed, effect } from "@/core/utils/reactive/signal";
import { LightboxNavigation } from "@/core/features/lightbox/navigation/navigation";
import { MediaItem } from "@/core/domain/post/post";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { onCleanup } from "@/core/utils/reactive/scope";

export interface LightboxAutoplayConfiguration {
  readonly interval: number;
}

export interface LightboxAutoplayDependencies {
  scheduler: Pick<Scheduler, "schedule">;
  navigation: Pick<LightboxNavigation<MediaItem>, "isOpen" | "currentItem" | "goToNext">;
  canCountDown: Readable<boolean>;
  video: Readable<HTMLVideoElement | undefined>;
}

export interface AutoplayCountdown {
  readonly item: MediaItem;
  readonly duration: number;
}

export class LightboxAutoplay {
  public readonly countdown: Readable<AutoplayCountdown | undefined>;
  private readonly isPlayingState = new Signal(false);
  private cancelStep: (() => void) | undefined;
  private releaseVideo: (() => void) | undefined;

  constructor(configuration: LightboxAutoplayConfiguration, dependencies: LightboxAutoplayDependencies) {
    const { scheduler, navigation, canCountDown, video } = dependencies;
    const { isOpen, currentItem } = navigation;
    const showNext = (): void => {
      navigation.goToNext().catch(console.error);
    };

    this.countdown = computed(() => {
      const item = currentItem.value;
      return this.isPlayingState.value && item !== undefined && canCountDown.value ? { item, duration: configuration.interval } : undefined;
    });
    effect(() => {
      const countdown = this.countdown.value;

      this.cancelStep?.();
      this.cancelStep = countdown === undefined ? undefined : scheduler.schedule(showNext, countdown.duration);
    });
    effect(() => {
      const shown = video.value;

      this.releaseVideo?.();
      this.releaseVideo = this.isPlayingState.value && shown !== undefined ? advanceWhenEnded(shown, showNext) : undefined;
    });
    effect(() => {
      if (!isOpen.value) {
        this.isPlayingState.value = false;
      }
    });
    onCleanup(() => {
      this.cancelStep?.();
      this.releaseVideo?.();
    });
  }

  public get isPlaying(): Readable<boolean> {
    return this.isPlayingState;
  }

  public toggle(): void {
    this.isPlayingState.value = !this.isPlayingState.peek();
  }
}

function advanceWhenEnded(video: HTMLVideoElement, showNext: () => void): () => void {
  video.loop = false;
  video.addEventListener("ended", showNext);
  return () => {
    video.loop = true;
    video.removeEventListener("ended", showNext);
  };
}
