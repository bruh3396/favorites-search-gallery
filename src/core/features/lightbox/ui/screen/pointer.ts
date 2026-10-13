import { LightboxOverlayVisibility } from "@/core/features/lightbox/ui/overlay/visibility";

export interface LightboxPointerZoom {
  isZoomed: () => boolean;
  toggleAt: (event: MouseEvent) => void;
  zoomByAt: (factor: number, event: MouseEvent) => void;
  zoomOut: () => void;
  panBy: (deltaX: number, deltaY: number) => void;
}

export interface LightboxPointerDependencies {
  visibility: Pick<LightboxOverlayVisibility, "show" | "hideSoon">;
  zoom: LightboxPointerZoom;
  showNext: () => void;
  showPrevious: () => void;
  close: () => void;
  onCtrlClick?: () => void;
  onMiddleClick?: () => void;
}

export interface LightboxPointerListeners {
  onClick: (event: MouseEvent) => void;
  onMousedown: (event: MouseEvent) => void;
  onAuxclick: (event: MouseEvent) => void;
  onContextmenu: (event: MouseEvent) => void;
  onWheel: (event: WheelEvent) => void;
  onPointerdown: (event: PointerEvent) => void;
  onPointermove: (event: PointerEvent) => void;
  onPointerup: () => void;
  onPointercancel: () => void;
  onPointerleave: () => void;
  onDragstart: (event: DragEvent) => void;
}

interface Press {
  readonly startX: number;
  readonly startY: number;
  lastX: number;
  lastY: number;
  isDrag: boolean;
}

const MIDDLE_BUTTON = 1;
const PRIMARY_BUTTON = 0;
const DRAG_DISTANCE = 4;
const WHEEL_NOTCH = 100;
const ZOOM_PER_WHEEL_NOTCH = 1.18;

export function createPointerListeners(dependencies: LightboxPointerDependencies): LightboxPointerListeners {
  const { visibility, zoom, showNext, showPrevious, close, onCtrlClick, onMiddleClick } = dependencies;
  const drag = new DragTracker(zoom);
  const showControlsOnMove = createPointerMoveHandler(visibility);
  return {
    onClick: (event): void => {
      if ((event.ctrlKey || event.metaKey) && onCtrlClick !== undefined) {
        event.preventDefault();
        onCtrlClick();
      } else if (!drag.takeFinishedDrag() && !(event.target instanceof HTMLVideoElement)) {
        handlePlainClick(event, zoom, close);
      }
    },
    onMousedown: (event): void => {
      if (event.button === MIDDLE_BUTTON) {
        event.preventDefault();
      }
    },
    onAuxclick: (event): void => {
      if (event.button === MIDDLE_BUTTON && onMiddleClick !== undefined) {
        event.preventDefault();
        onMiddleClick();
      }
    },
    onContextmenu: (event): void => {
      event.preventDefault();
      close();
    },
    onWheel: event => handleWheel(event, zoom, showNext, showPrevious),
    onPointerdown: event => drag.press(event),
    onPointermove: (event): void => {
      showControlsOnMove(event);
      drag.move(event);
    },
    onPointerup: () => drag.release(),
    onPointercancel: () => drag.cancel(),
    onPointerleave: () => visibility.hideSoon(),
    onDragstart: event => event.preventDefault()
  };
}

function handlePlainClick(event: MouseEvent, zoom: LightboxPointerZoom, close: () => void): void {
  if (event.shiftKey) {
    zoom.toggleAt(event);
  } else if (zoom.isZoomed()) {
    zoom.zoomOut();
  } else {
    close();
  }
}

class DragTracker {
  private pressed: Press | undefined;
  private finishedDrag = false;

  constructor(private readonly zoom: Pick<LightboxPointerZoom, "isZoomed" | "panBy">) { }

  public press(event: PointerEvent): void {
    this.finishedDrag = false;
    this.pressed = event.button === PRIMARY_BUTTON ? { startX: event.clientX, startY: event.clientY, lastX: event.clientX, lastY: event.clientY, isDrag: false } : undefined;
  }

  public move(event: PointerEvent): void {
    const pressed = this.pressed;

    if (pressed === undefined) {
      return;
    }

    const isZoomed = this.zoom.isZoomed();

    if (!pressed.isDrag && Math.hypot(event.clientX - pressed.startX, event.clientY - pressed.startY) > DRAG_DISTANCE) {
      pressed.isDrag = true;

      if (isZoomed) {
        capturePointer(event);
      }
    }

    if (pressed.isDrag && isZoomed) {
      this.zoom.panBy(event.clientX - pressed.lastX, event.clientY - pressed.lastY);
    }
    pressed.lastX = event.clientX;
    pressed.lastY = event.clientY;
  }

  public release(): void {
    this.finishedDrag = this.pressed?.isDrag ?? false;
    this.pressed = undefined;
  }

  public cancel(): void {
    this.pressed = undefined;
  }

  public takeFinishedDrag(): boolean {
    const finishedDrag = this.finishedDrag;

    this.finishedDrag = false;
    return finishedDrag;
  }
}

function capturePointer(event: PointerEvent): void {
  if (event.currentTarget instanceof Element) {
    event.currentTarget.setPointerCapture(event.pointerId);
  }
}

function handleWheel(event: WheelEvent, zoom: LightboxPointerZoom, showNext: () => void, showPrevious: () => void): void {
  if (event.ctrlKey) {
    event.preventDefault();
    zoom.zoomByAt(ZOOM_PER_WHEEL_NOTCH ** (-event.deltaY / WHEEL_NOTCH), event);
  } else if (zoom.isZoomed()) {
    event.preventDefault();
    zoom.panBy(-event.deltaX, -event.deltaY);
  } else if (event.deltaY !== 0) {
    event.preventDefault();
    showByWheel(event, showNext, showPrevious);
  }
}

function showByWheel(event: WheelEvent, showNext: () => void, showPrevious: () => void): void {
  if (event.deltaY > 0) {
    showNext();
  } else {
    showPrevious();
  }
}

function createPointerMoveHandler(visibility: Pick<LightboxOverlayVisibility, "show">): (event: PointerEvent) => void {
  let lastX: number | undefined;
  let lastY: number | undefined;
  return event => {
    const hasMoved = event.screenX !== lastX || event.screenY !== lastY;

    lastX = event.screenX;
    lastY = event.screenY;

    if (hasMoved && event.pointerType !== "touch") {
      visibility.show();
    }
  };
}
