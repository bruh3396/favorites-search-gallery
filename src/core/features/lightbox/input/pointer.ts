import { Readable, Signal } from "@/core/utils/reactive/signal";
import { LightboxCommands } from "@/core/features/lightbox/commands/commands";
import { ZoomPoint } from "@/core/features/lightbox/zoom/zoom";

export interface LightboxPointerDependencies {
  commands: Pick<LightboxCommands, "showNext" | "showPrevious" | "close" | "toggleZoom" | "zoomBy" | "zoomOut" | "panBy" | "openOriginal" | "openPostPage">;
  isZoomed: Readable<boolean>;
  visibility: { show: () => void; hideSoon: () => void };
  locatePoint: (event: MouseEvent) => ZoomPoint;
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

// eslint-disable-next-line functional/type-declaration-immutability
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

export class LightboxPointer {
  public readonly listeners: LightboxPointerListeners;
  private readonly lastPointState = new Signal<ZoomPoint | undefined>(undefined);
  private readonly drag: DragTracker;
  private lastScreenX: number | undefined;
  private lastScreenY: number | undefined;

  constructor(private readonly dependencies: LightboxPointerDependencies) {
    const { commands, visibility } = dependencies;

    this.drag = new DragTracker(dependencies);
    this.listeners = {
      onClick: (event): void => this.handleClick(event),
      onMousedown: (event): void => {
        if (event.button === MIDDLE_BUTTON) {
          event.preventDefault();
        }
      },
      onAuxclick: (event): void => {
        if (event.button === MIDDLE_BUTTON) {
          event.preventDefault();
          commands.openPostPage();
        }
      },
      onContextmenu: (event): void => {
        event.preventDefault();
        commands.close();
      },
      onWheel: (event): void => this.handleWheel(event),
      onPointerdown: (event): void => this.drag.press(event),
      onPointermove: (event): void => {
        this.trackPointer(event);
        this.drag.move(event);
      },
      onPointerup: (): void => this.drag.release(),
      onPointercancel: (): void => this.drag.cancel(),
      onPointerleave: (): void => {
        this.lastPointState.value = undefined;
        visibility.hideSoon();
      },
      onDragstart: (event): void => event.preventDefault()
    };
  }

  public get lastPoint(): Readable<ZoomPoint | undefined> {
    return this.lastPointState;
  }

  public start(): void {
    this.lastPointState.value = undefined;
  }

  public stop(): void {
    this.drag.cancel();
  }

  private handleClick(event: MouseEvent): void {
    const { commands, isZoomed, locatePoint } = this.dependencies;

    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      commands.openOriginal();
    } else if (!this.drag.takeFinishedDrag() && !(event.target instanceof HTMLVideoElement)) {
      if (event.shiftKey) {
        commands.toggleZoom(locatePoint(event));
      } else if (isZoomed.peek()) {
        commands.zoomOut();
      } else {
        commands.close();
      }
    }
  }

  private handleWheel(event: WheelEvent): void {
    const { commands, isZoomed, locatePoint } = this.dependencies;

    if (event.ctrlKey) {
      event.preventDefault();
      commands.zoomBy(ZOOM_PER_WHEEL_NOTCH ** (-event.deltaY / WHEEL_NOTCH), locatePoint(event));
    } else if (isZoomed.peek()) {
      event.preventDefault();
      commands.panBy(-event.deltaX, -event.deltaY);
    } else if (event.deltaY !== 0) {
      event.preventDefault();
      (event.deltaY > 0 ? commands.showNext : commands.showPrevious)();
    }
  }

  private trackPointer(event: PointerEvent): void {
    const hasMoved = event.screenX !== this.lastScreenX || event.screenY !== this.lastScreenY;

    this.lastScreenX = event.screenX;
    this.lastScreenY = event.screenY;

    if (event.pointerType !== "touch") {
      this.lastPointState.value = this.dependencies.locatePoint(event);

      if (hasMoved) {
        this.dependencies.visibility.show();
      }
    }
  }
}

class DragTracker {
  private pressed: Press | undefined;
  private didFinishDrag = false;

  constructor(private readonly dependencies: Pick<LightboxPointerDependencies, "commands" | "isZoomed">) { }

  public press(event: PointerEvent): void {
    this.didFinishDrag = false;
    this.pressed = event.button === PRIMARY_BUTTON ? {
      startX: event.clientX, startY: event.clientY, lastX: event.clientX, lastY: event.clientY, isDrag: false
    } : undefined;
  }

  public move(event: PointerEvent): void {
    const pressed = this.pressed;

    if (pressed === undefined) {
      return;
    }
    const isZoomed = this.dependencies.isZoomed.peek();

    if (!pressed.isDrag && Math.hypot(event.clientX - pressed.startX, event.clientY - pressed.startY) > DRAG_DISTANCE) {
      pressed.isDrag = true;

      if (isZoomed) {
        capturePointer(event);
      }
    }

    if (pressed.isDrag && isZoomed) {
      this.dependencies.commands.panBy(event.clientX - pressed.lastX, event.clientY - pressed.lastY);
    }
    pressed.lastX = event.clientX;
    pressed.lastY = event.clientY;
  }

  public release(): void {
    this.didFinishDrag = this.pressed?.isDrag ?? false;
    this.pressed = undefined;
  }

  public cancel(): void {
    this.pressed = undefined;
  }

  public takeFinishedDrag(): boolean {
    const didFinishDrag = this.didFinishDrag;

    this.didFinishDrag = false;
    return didFinishDrag;
  }
}

function capturePointer(event: PointerEvent): void {
  if (event.currentTarget instanceof Element) {
    event.currentTarget.setPointerCapture(event.pointerId);
  }
}
