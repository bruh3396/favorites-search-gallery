import { LightboxOverlayVisibility } from "@/core/features/lightbox/ui/overlay/visibility";

export interface LightboxPointerDependencies {
  visibility: Pick<LightboxOverlayVisibility, "show" | "hideSoon">;
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
  onPointermove: (event: PointerEvent) => void;
  onPointerleave: () => void;
}

const MIDDLE_BUTTON = 1;

export function createPointerListeners(dependencies: LightboxPointerDependencies): LightboxPointerListeners {
  const { visibility, showNext, showPrevious, close, onCtrlClick, onMiddleClick } = dependencies;
  return {
    onClick: event => handleClick(event, close, onCtrlClick),
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
    onWheel: event => handleWheel(event, showNext, showPrevious),
    onPointermove: createPointerMoveHandler(visibility),
    onPointerleave: () => visibility.hideSoon()
  };
}

function handleClick(event: MouseEvent, close: () => void, onCtrlClick?: () => void): void {
  if ((event.ctrlKey || event.metaKey) && onCtrlClick !== undefined) {
    event.preventDefault();
    onCtrlClick();
    return;
  }

  if (event.target instanceof HTMLVideoElement) {
    return;
  }

  close();
}

function handleWheel(event: WheelEvent, showNext: () => void, showPrevious: () => void): void {
  if (event.ctrlKey || event.deltaY === 0) return;

  event.preventDefault();

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
