import { Emitter, StickyEmitter } from "@/lib/event/emitter";
import { EnhancedKeyboardEvent, EnhancedMouseEvent, EnhancedWheelEvent } from "@/lib/event/input";
import { Environment } from "@/app/context/environment";
import { Events } from "@/app/context/events";
import { FeatureBridge } from "@/app/context/feature_bridge";
import { Shell } from "@/app/context/shell";
import { Timeout } from "@/types/async";

const SWIPE_THRESHOLD = 90;
const TOUCH_HOLD_THRESHOLD = 300;

type Point = { x: number; y: number };
type SwipeDirection = "up" | "down" | "left" | "right" | null;

export class DomEvents {
  public readonly document = {
    domLoaded: new StickyEmitter<void>(),
    mouseover: new Emitter<EnhancedMouseEvent>(),
    click: new Emitter<EnhancedMouseEvent>(),
    mousedown: new Emitter<EnhancedMouseEvent>(),
    touchStart: new Emitter<TouchEvent>(),
    touchEnd: new Emitter<TouchEvent>(),
    keydown: new Emitter<EnhancedKeyboardEvent>(),
    keyup: new Emitter<EnhancedKeyboardEvent>(),
    wheel: new Emitter<EnhancedWheelEvent>(),
    contextmenu: new Emitter<MouseEvent>(),
    mousemove: new Emitter<MouseEvent>()
  };

  public readonly window = {
    focus: new Emitter<FocusEvent>(),
    blur: new Emitter<FocusEvent>(),
    orientationChange: new Emitter<Event>(),
    scrollend: new Emitter<Event>(),
    scroll: new Emitter<Event>()
  };

  public readonly mobile = {
    swipedUp: new Emitter<void>(),
    swipedDown: new Emitter<void>(),
    swipedLeft: new Emitter<void>(),
    swipedRight: new Emitter<void>(),
    touchHold: new Emitter<TouchEvent>()
  };

  private readonly swipeStart: Point = { x: 0, y: 0 };
  private readonly swipeEnd: Point = { x: 0, y: 0 };
  private holdTimer: Timeout;
  private wasHeld = false;

  public addEventListeners(shell: Shell, environment: Environment, events: Events, featureBridge: FeatureBridge): void {
    this.broadcastDomLoad();
    this.appendRootOnDomLoad(shell.root);
    this.setupDocumentEvents(environment.onFavoritesPage ? shell.root : document.documentElement);
    this.setupWindowEvents();
    this.setupMobileGestures(environment.onMobileDevice);
    this.setupHotkeys(events, () => featureBridge.galleryOpened());
  }

  public didSwipe(): boolean {
    return this.getSwipeDirection() !== null;
  }

  public didNotSwipe(): boolean {
    return !this.didSwipe();
  }

  public didHold(): boolean {
    return this.wasHeld;
  }

  private appendRootOnDomLoad(root: HTMLElement): void {
    this.document.domLoaded.on(() => {
      document.body.appendChild(root);
    }, { once: true });
  }

  private setupHotkeys(events: Events, galleryOpened: () => boolean): void {
    this.document.keydown.on((event) => {
      if (!event.isHotkey || galleryOpened()) {
        return;
      }
      events.app.hotkeyPressed.emit(event.key.toLowerCase());
    });
  }

  private setupMobileGestures(onMobileDevice: boolean): void {
    if (onMobileDevice) {
      return;
    }
    this.document.touchStart.on((event) => this.onSwipeTouchStart(event));
    this.document.touchEnd.on((event) => this.onSwipeTouchEnd(event));
    this.document.touchStart.on((event) => this.startHoldTimer(event));
    this.document.touchEnd.on(() => this.stopHoldTimer());
  }

  private onSwipeTouchStart(event: TouchEvent): void {
    this.swipeStart.x = event.changedTouches[0].screenX;
    this.swipeStart.y = event.changedTouches[0].screenY;
  }

  private onSwipeTouchEnd(event: TouchEvent): void {
    this.swipeEnd.x = event.changedTouches[0].screenX;
    this.swipeEnd.y = event.changedTouches[0].screenY;

    switch (this.getSwipeDirection()) {
      case "up":
        this.mobile.swipedUp.emit();
        break;
      case "down":
        this.mobile.swipedDown.emit();
        break;
      case "left":
        this.mobile.swipedLeft.emit();
        break;
      case "right":
        this.mobile.swipedRight.emit();
        break;
      default: break;
    }
  }

  private getSwipeDirection(): SwipeDirection {
    const dx = this.swipeEnd.x - this.swipeStart.x;
    const dy = this.swipeEnd.y - this.swipeStart.y;

    if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) {
      return null;
    }

    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? "right" : "left";
    }
    return dy > 0 ? "down" : "up";
  }

  private startHoldTimer(event: TouchEvent): void {
    this.stopHoldTimer();
    this.wasHeld = false;

    this.holdTimer = setTimeout(() => {
      this.wasHeld = true;
      this.mobile.touchHold.emit(event);
    }, TOUCH_HOLD_THRESHOLD);
  }

  private stopHoldTimer(): void {
    if (this.holdTimer !== undefined) {
      clearTimeout(this.holdTimer);
      this.holdTimer = undefined;
    }
  }

  private setupDocumentEvents(root: HTMLElement): void {
    root.addEventListener("click", (event) => {
      this.document.click.emit(new EnhancedMouseEvent(event));
    });
    root.addEventListener("mousedown", (event) => {
      this.document.mousedown.emit(new EnhancedMouseEvent(event));
    });
    document.addEventListener("keydown", (event) => {
      this.document.keydown.emit(new EnhancedKeyboardEvent(event));
    });
    document.addEventListener("keyup", (event) => {
      this.document.keyup.emit(new EnhancedKeyboardEvent(event));
    });
    root.addEventListener("mouseover", (event) => {
      this.document.mouseover.emit(new EnhancedMouseEvent(event));
    }, { passive: true });
    root.addEventListener("mousemove", (event) => {
      this.document.mousemove.emit(event);
    }, { passive: true });
    document.addEventListener("wheel", (event) => {
      this.document.wheel.emit(new EnhancedWheelEvent(event));
    }, { passive: true });
    root.addEventListener("contextmenu", (event) => {
      this.document.contextmenu.emit(event);
    });
    root.addEventListener("touchstart", (event) => {
      this.document.touchStart.emit(event);
    }, { passive: false });
    root.addEventListener("touchend", (event) => {
      this.document.touchEnd.emit(event);
    });
  }

  private setupWindowEvents(): void {
    window.addEventListener("focus", (event) => {
      this.window.focus.emit(event);
    });
    window.addEventListener("blur", (event) => {
      this.window.blur.emit(event);
    });
    window.addEventListener("orientationchange", (event) => {
      this.window.orientationChange.emit(event);
    });
    window.addEventListener("scrollend", (event) => {
      this.window.scrollend.emit(event);
    }, { passive: true });
    window.addEventListener("scroll", (event) => {
      this.window.scroll.emit(event);
    }, { passive: true });
  }

  private broadcastDomLoad(): void {
    if (document.readyState !== "loading") {
      this.document.domLoaded.emit();
      return;
    }
    document.addEventListener("DOMContentLoaded", () => {
      this.document.domLoaded.emit();
    }, { once: true });
  }
}
