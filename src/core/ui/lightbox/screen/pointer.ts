import { OverlayVisibility } from "@/core/ui/lightbox/overlay/visibility";

export interface LightboxPointerActions {
  visibility: Pick<OverlayVisibility, "show" | "hideSoon">;
  onShowNext: () => void;
  onShowPrevious: () => void;
  onClose: () => void;
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

export function createPointerListeners(actions: LightboxPointerActions): LightboxPointerListeners {
  const { visibility, onShowNext, onShowPrevious, onClose, onCtrlClick, onMiddleClick } = actions;
  return {
    onClick: event => handleClick(event, onClose, onCtrlClick),
    onMousedown: event => {
      if (event.button === MIDDLE_BUTTON) {
        event.preventDefault();
      }
    },
    onAuxclick: event => {
      if (event.button === MIDDLE_BUTTON && onMiddleClick !== undefined) {
        event.preventDefault();
        onMiddleClick();
      }
    },
    onContextmenu: event => {
      event.preventDefault();
      onClose();
    },
    onWheel: event => handleWheel(event, onShowNext, onShowPrevious),
    onPointermove: createPointerMoveHandler(visibility),
    onPointerleave: () => visibility.hideSoon()
  };
}

function handleClick(event: MouseEvent, onClose: () => void, onCtrlClick?: () => void): void {
  if ((event.ctrlKey || event.metaKey) && onCtrlClick !== undefined) {
    event.preventDefault();
    onCtrlClick();
    return;
  }

  if (event.target instanceof HTMLVideoElement) {
    return;
  }

  onClose();
}

function handleWheel(event: WheelEvent, onShowNext: () => void, onShowPrevious: () => void): void {
  if (event.ctrlKey || event.deltaY === 0) return;

  event.preventDefault();

  if (event.deltaY > 0) {
    onShowNext();
  } else {
    onShowPrevious();
  }
}

function createPointerMoveHandler(visibility: Pick<OverlayVisibility, "show">): (event: PointerEvent) => void {
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
