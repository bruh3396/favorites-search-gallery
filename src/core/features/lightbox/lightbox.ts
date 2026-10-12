import { Emitter, Occurrence } from "@/core/utils/reactive/emitter";
import { LightboxActions, LightboxActionsDependencies } from "@/core/features/lightbox/actions/actions";
import { LightboxAutoplay, LightboxAutoplayConfiguration } from "@/core/features/lightbox/autoplay/autoplay";
import { LightboxNavigation, LightboxNavigationConfiguration } from "@/core/features/lightbox/navigation/navigation";
import { LightboxScreen, LightboxScreenProps } from "@/core/features/lightbox/ui/screen/screen";
import { MediaSequence, SequencePosition } from "@/core/domain/media/media_sequence";
import { Readable, effect } from "@/core/utils/reactive/signal";
import { LightboxOverlayVisibilityConfiguration } from "@/core/features/lightbox/ui/overlay/visibility";
import { LightboxStageDependencies } from "@/core/features/lightbox/ui/stage/stage";
import { MediaItem } from "@/core/domain/post/post";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { Viewport } from "@/core/boundary/ports/viewport/viewport";
import { createDebouncedTask } from "@/core/utils/async/debouncer";
import { h } from "@/core/ui/h/h";

export interface LightboxConfiguration extends LightboxNavigationConfiguration {
  readonly settleDelay: number;
  readonly autoplay: LightboxAutoplayConfiguration;
  readonly overlay: LightboxOverlayVisibilityConfiguration;
}

export interface LightboxDependencies extends LightboxActionsDependencies {
  remoteMedia: LightboxActionsDependencies["remoteMedia"] & LightboxStageDependencies["remoteMedia"];
  viewport: Pick<Viewport, "lockScroll" | "unlockScroll">;
  scheduler: Pick<Scheduler, "schedule">;
}

export type LightboxScreenOptions<T extends MediaItem> = Readonly<Pick<LightboxScreenProps<T>, "morpher" | "locateItem" | "favorites">>;

export interface LightboxService<T extends MediaItem> {
  readonly current: Readable<T | undefined>;
  readonly position: Readable<SequencePosition | undefined>;
  readonly isOpen: Readable<boolean>;
  readonly settled: Occurrence<T>;
  readonly closed: Occurrence<T>;
  readonly actions: LightboxActions;
  open: (item: T, sequence: MediaSequence<T>) => void;
  warm: (item: T) => void;
  close: () => void;
  createScreen: (options: LightboxScreenOptions<T>) => HTMLElement;
}

export const DEFAULT_LIGHTBOX_CONFIGURATION: LightboxConfiguration = {
  maxWarmItems: 8,
  maxNeighborDistance: 20,
  settleDelay: 75,
  autoplay: { interval: 3_000 },
  overlay: { idleDelay: 1_000, hideSoonDelay: 1_000 }
};

export function createLightboxService<T extends MediaItem>(configuration: LightboxConfiguration, dependencies: LightboxDependencies): LightboxService<T> {
  const { remoteMedia, viewport, scheduler } = dependencies;
  const navigation = new LightboxNavigation<T>(configuration);
  const autoplay = new LightboxAutoplay(configuration.autoplay, {
    current: navigation.current,
    showNext: (): void => {
      navigation.showNext().catch(console.error);
    },
    scheduler
  });
  const actions = new LightboxActions(dependencies);
  const settled = new Emitter<T>();
  const settle = createDebouncedTask({ delay: configuration.settleDelay, leading: false }, scheduler, (item: T) => settled.emit(item));

  navigation.closed.on(() => autoplay.stop());
  effect(() => (navigation.isOpen.value ? viewport.lockScroll() : viewport.unlockScroll()));
  effect(() => {
    const item = navigation.current.value;

    if (item === undefined) {
      settle.cancel();
    } else {
      settle(item);
    }
  });
  return {
    current: navigation.current,
    position: navigation.position,
    isOpen: navigation.isOpen,
    settled,
    closed: navigation.closed,
    actions,
    open: (item, sequence) => navigation.open(item, sequence),
    warm: item => navigation.warm(item),
    close: () => navigation.close(),
    createScreen: options => h(LightboxScreen<T>, {
      ...options, navigation, autoplay, actions, remoteMedia, overlay: configuration.overlay, scheduler
    })
  };
}
