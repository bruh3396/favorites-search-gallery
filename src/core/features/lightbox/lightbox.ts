import { LightboxActions, LightboxActionsDependencies } from "@/core/features/lightbox/actions/actions";
import { LightboxAutoplay, LightboxAutoplayConfiguration } from "@/core/features/lightbox/autoplay/autoplay";
import { LightboxNavigation, LightboxNavigationConfiguration } from "@/core/features/lightbox/navigation/navigation";
import { LightboxScreen, LightboxScreenProps } from "@/core/features/lightbox/ui/screen/screen";
import { LightboxZoom, LightboxZoomConfiguration } from "@/core/features/lightbox/zoom/zoom";
import { MediaSequence, SequencePosition } from "@/core/domain/media/media_sequence";
import { Readable, effect } from "@/core/utils/reactive/signal";
import { LightboxOverlayVisibilityConfiguration } from "@/core/features/lightbox/ui/overlay/visibility";
import { LightboxStageDependencies } from "@/core/features/lightbox/ui/stage/stage";
import { MediaItem } from "@/core/domain/post/post";
import { Occurrence } from "@/core/utils/reactive/emitter";
import { Scheduler } from "@/core/boundary/ports/scheduler/scheduler";
import { SizeObserver } from "@/core/boundary/ports/size_observer/size_observer";
import { Viewport } from "@/core/boundary/ports/viewport/viewport";
import { h } from "@/core/ui/h/h";

export interface LightboxConfiguration extends LightboxNavigationConfiguration {
  readonly autoplay: LightboxAutoplayConfiguration;
  readonly zoom: LightboxZoomConfiguration;
  readonly overlay: LightboxOverlayVisibilityConfiguration;
}

export interface LightboxDependencies extends LightboxActionsDependencies {
  remoteMedia: LightboxActionsDependencies["remoteMedia"] & LightboxStageDependencies["remoteMedia"];
  viewport: Pick<Viewport, "lockScroll" | "unlockScroll">;
  scheduler: Pick<Scheduler, "schedule">;
  sizeObserver: SizeObserver;
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
  zoom: { minimumScale: 2 },
  overlay: { idleDelay: 1_000, hideSoonDelay: 1_000 }
};

export function createLightboxService<T extends MediaItem>(configuration: LightboxConfiguration, dependencies: LightboxDependencies): LightboxService<T> {
  const { remoteMedia, viewport, scheduler, sizeObserver } = dependencies;
  const navigation = new LightboxNavigation<T>(configuration, scheduler);
  const autoplay = new LightboxAutoplay(
    configuration.autoplay,
    { current: navigation.current, showNext: (): Promise<void> => navigation.showNext(), scheduler }
  );
  const zoom = new LightboxZoom(configuration.zoom, { current: navigation.current });
  const actions = new LightboxActions(dependencies);

  effect(() => (navigation.isOpen.value ? viewport.lockScroll() : viewport.unlockScroll()));
  return {
    current: navigation.current,
    position: navigation.position,
    isOpen: navigation.isOpen,
    settled: navigation.settled,
    closed: navigation.closed,
    actions,
    open: (item, sequence) => navigation.open(item, sequence),
    warm: item => navigation.warm(item),
    close: () => navigation.close(),
    createScreen: options => h(LightboxScreen<T>, {
      ...options, navigation, autoplay, zoom, actions, remoteMedia, overlay: configuration.overlay, scheduler, sizeObserver
    })
  };
}
