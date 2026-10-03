import { AppContext } from "@/app/context/context";
import { GalleryConfig } from "@/config/gallery_config";
import { Timeout } from "@/types/async";
import { doNothing } from "@/utils/pure/function";

type Subscribe<T> = (handler: (value: T) => void, opts?: { signal?: AbortSignal }) => void;

interface InteractionTrackerConfiguration {
  idleDuration: number;
}

interface InteractionTrackerDependencies {
  onInteractionStopped: () => void;
  onMouseMoveStopped: () => void;
  onScrollingStopped: () => void;
  onNoInteractionOnEnable: () => void;
  mouseMoveEvent: Subscribe<MouseEvent>;
  scrollEvent: Subscribe<Event>;
}

const INTERACTION_TRACKING: InteractionTrackerConfiguration = { idleDuration: GalleryConfig.idleInteractionDuration };

class InteractionTracker {
  private readonly onInteractionStopped: () => void;
  private readonly onMouseMoveStopped: () => void;
  private readonly onScrollingStopped: () => void;
  private readonly onNoInteractionOnEnable: () => void;
  private readonly idleDuration: number;
  private mouseTimeout: Timeout;
  private scrollTimeout: Timeout;
  private noInteractionOnEnableTimeout: Timeout;
  private isMouseMoving: boolean;
  private isScrolling: boolean;
  private abortController: AbortController;
  private readonly mouseMoveEvent: Subscribe<MouseEvent>;
  private readonly scrollEvent: Subscribe<Event>;

  constructor({ idleDuration }: InteractionTrackerConfiguration, dependencies: InteractionTrackerDependencies) {
    this.idleDuration = idleDuration;
    this.onInteractionStopped = dependencies.onInteractionStopped;
    this.onMouseMoveStopped = dependencies.onMouseMoveStopped;
    this.onScrollingStopped = dependencies.onScrollingStopped;
    this.onNoInteractionOnEnable = dependencies.onNoInteractionOnEnable;
    this.isMouseMoving = false;
    this.isScrolling = false;
    this.abortController = new AbortController();
    this.mouseMoveEvent = dependencies.mouseMoveEvent;
    this.scrollEvent = dependencies.scrollEvent;
  }

  public enable(): void {
    this.abortController = new AbortController();
    this.mouseMoveEvent(this.onMouseMove.bind(this), { signal: this.abortController.signal });
    this.scrollEvent(this.onScroll.bind(this), {signal: this.abortController.signal});
    this.startNoInteractionOnEnableTimer();
  }

  public disable(): void {
    this.abortController.abort();
  }

  private startNoInteractionOnEnableTimer(): void {
    this.noInteractionOnEnableTimeout = setTimeout(() => {
      this.onNoInteractionOnEnable();
    }, this.idleDuration);
  }

  private onMouseMove(): void {
    this.isMouseMoving = true;
    clearTimeout(this.noInteractionOnEnableTimeout);
    clearTimeout(this.mouseTimeout);
    this.mouseTimeout = setTimeout(() => {
      this.isMouseMoving = false;
      this.onMouseMoveStopped();

      if (!this.isScrolling) {
        this.onInteractionStopped();
      }
    }, this.idleDuration);
  }

  private onScroll(): void {
    this.isScrolling = true;
    clearTimeout(this.noInteractionOnEnableTimeout);
    clearTimeout(this.scrollTimeout);
    this.scrollTimeout = setTimeout(() => {
      this.isScrolling = false;
      this.onScrollingStopped();

      if (!this.isMouseMoving) {
        this.onInteractionStopped();
      }
    }, this.idleDuration);
  }
}

export class GalleryInteractionTracker {
  private tracker: InteractionTracker | null = null;

  constructor(private readonly context: AppContext) {}

  public setup(): void {
    if (this.context.environment.device === "mobile") {
      return;
    }
    const onInteractionStopped = (): void => {
      this.context.events.gallery.interactionStopped.emit();
    };

    this.tracker = new InteractionTracker(INTERACTION_TRACKING, {
      onInteractionStopped: doNothing,
      onMouseMoveStopped: onInteractionStopped,
      onScrollingStopped: doNothing,
      onNoInteractionOnEnable: onInteractionStopped,
      mouseMoveEvent: this.context.domEvents.document.mousemove.on,
      scrollEvent: this.context.domEvents.window.scroll.on
    });
  }

  public enable(): void {
    this.tracker?.enable();
  }

  public disable(): void {
    this.tracker?.disable();
  }
}
