import { DomEvents } from "@/app/dom/events";
import { Events } from "@/app/channels/events";
import { GalleryConfig } from "@/config/gallery_config";
import { ON_MOBILE_DEVICE } from "@/lib/environment";
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

let galleryInteractionTracker: InteractionTracker | null = null;

export function setup(): void {
  if (ON_MOBILE_DEVICE) {
    return;
  }
  const onInteractionStopped = (): void => {
    Events.gallery.interactionStopped.emit();
  };

  galleryInteractionTracker = new InteractionTracker(
    GalleryConfig.idleInteractionDuration,
    doNothing,
    onInteractionStopped,
    doNothing,
    onInteractionStopped,
    DomEvents.document.mousemove.on,
    DomEvents.window.scroll.on
  );
}

export function enableInteractionTracking(): void {
  galleryInteractionTracker?.enable();
}

export function disableInteractionTracking(): void {
  galleryInteractionTracker?.disable();
}
