import { AppContext } from "@/app/context/context";
import { GalleryConfig } from "@/config/gallery_config";
import { Timeout } from "@/types/async";
import { doNothing } from "@/utils/pure/function";

type Subscribe<T> = (handler: (value: T) => void, opts?: { signal?: AbortSignal }) => void;

class InteractionTracker {
  private onInteractionStopped: () => void;
  private onMouseMoveStopped: () => void;
  private onScrollingStopped: () => void;
  private onNoInteractionOnEnable: () => void;
  private idleDuration: number;
  private mouseTimeout: Timeout;
  private scrollTimeout: Timeout;
  private noInteractionOnEnableTimeout: Timeout;
  private isMouseMoving: boolean;
  private isScrolling: boolean;
  private abortController: AbortController;
  private mouseMoveEvent: Subscribe<MouseEvent>;
  private scrollEvent: Subscribe<Event>;

  constructor(
    idleDuration: number,
    onInteractionStopped: () => void,
    onMouseMoveStopped: () => void,
    onScrollingStopped: () => void,
    onNoInteractionOnEnable: () => void,
    mouseMoveEvent: Subscribe<MouseEvent>,
    scrollEvent: Subscribe<Event>
  ) {
    this.idleDuration = idleDuration;
    this.onInteractionStopped = onInteractionStopped;
    this.onMouseMoveStopped = onMouseMoveStopped;
    this.onScrollingStopped = onScrollingStopped;
    this.onNoInteractionOnEnable = onNoInteractionOnEnable;
    this.isMouseMoving = false;
    this.isScrolling = false;
    this.abortController = new AbortController();
    this.mouseMoveEvent = mouseMoveEvent;
    this.scrollEvent = scrollEvent;
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
    if (this.context.environment.onMobileDevice) {
      return;
    }
    const onInteractionStopped = (): void => {
      this.context.events.gallery.interactionStopped.emit();
    };

    this.tracker = new InteractionTracker(
      GalleryConfig.idleInteractionDuration,
      doNothing,
      onInteractionStopped,
      doNothing,
      onInteractionStopped,
      this.context.domEvents.document.mousemove.on,
      this.context.domEvents.window.scroll.on
    );
  }

  public enable(): void {
    this.tracker?.enable();
  }

  public disable(): void {
    this.tracker?.disable();
  }
}
