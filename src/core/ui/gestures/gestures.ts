import { Readable, Signal } from "@/core/utils/reactive/signal";
import { GestureHandlers } from "@/core/ui/gestures/gesture_handlers";
import { ModifierState } from "@/core/ui/gestures/modifier_state";
import { Point } from "@/core/utils/geometry/point";
import { onCleanup } from "@/core/utils/reactive/scope";

export interface GesturesConfiguration {
  readonly dragThreshold: number;
}

export interface GesturesDependencies {
  element: HTMLElement;
  gestureHandlers: GestureHandlers;
}

interface MutablePress {
  readonly pointerId: number;
  readonly startPoint: Point;
  lastPoint: Point;
  moved: boolean;
  readonly canDrag: boolean;
}

export class Gestures {
  private readonly isDraggingState = new Signal(false);
  private readonly hoverPointState = new Signal<Point | undefined>(undefined);
  private readonly dragThreshold: number;
  private readonly element: HTMLElement;
  private readonly gestureHandlers: GestureHandlers;
  private mutablePress: MutablePress | undefined;

  constructor(configuration: GesturesConfiguration, dependencies: GesturesDependencies) {
    this.dragThreshold = configuration.dragThreshold;
    this.element = dependencies.element;
    this.gestureHandlers = dependencies.gestureHandlers;
    this.listen("pointerdown", this.onPointerDown);
    this.listen("pointermove", this.onPointerMove);
    this.listen("pointerup", this.onPointerUp);
    this.listen("pointercancel", this.endPress);
    this.listen("pointerleave", this.onPointerLeave);
    this.listen("wheel", this.onWheel);
    this.listen("dragstart", this.onDragStart);
  }

  public get isDragging(): Readable<boolean> {
    return this.isDraggingState;
  }

  public get hoverPoint(): Readable<Point | undefined> {
    return this.hoverPointState;
  }

  private listen<K extends keyof HTMLElementEventMap>(type: K, listener: (event: HTMLElementEventMap[K]) => void): void {
    this.element.addEventListener(type, listener);
    onCleanup(() => this.element.removeEventListener(type, listener));
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0 || !event.isPrimary) {
      return;
    }
    const point = this.locate(event);

    if (this.gestureHandlers.onPress({ point, modifierState: readModifiers(event) })) {
      return;
    }
    const canDrag = this.gestureHandlers.canDrag();

    this.mutablePress = { pointerId: event.pointerId, startPoint: point, lastPoint: point, moved: false, canDrag };

    if (canDrag) {
      this.element.setPointerCapture(event.pointerId);
    }
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    const mutablePress = this.mutablePress;
    const point = this.locate(event);

    this.hoverPointState.value = point;

    if (mutablePress?.pointerId !== event.pointerId) {
      return;
    }

    if (mutablePress.canDrag) {
      this.gestureHandlers.onDrag({ point, deltaPoint: { x: point.x - mutablePress.lastPoint.x, y: point.y - mutablePress.lastPoint.y } });
    }
    mutablePress.lastPoint = point;
    mutablePress.moved ||= Math.hypot(point.x - mutablePress.startPoint.x, point.y - mutablePress.startPoint.y) > this.dragThreshold;

    if (mutablePress.canDrag && mutablePress.moved) {
      this.isDraggingState.value = true;
    }
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    const mutablePress = this.mutablePress;

    if (mutablePress?.pointerId !== event.pointerId) {
      return;
    }
    this.endPress();

    if (!mutablePress.moved) {
      this.gestureHandlers.onTap({ point: this.locate(event), modifierState: readModifiers(event) });
    }
  };

  private readonly onPointerLeave = (): void => {
    this.hoverPointState.value = undefined;
  };

  private readonly endPress = (): void => {
    this.mutablePress = undefined;
    this.isDraggingState.value = false;
  };

  private readonly onWheel = (event: WheelEvent): void => {
    if (this.gestureHandlers.onWheel({ point: this.locate(event), deltaPoint: { x: event.deltaX, y: event.deltaY }, modifierState: readModifiers(event) })) {
      event.preventDefault();
    }
  };

  private readonly onDragStart = (event: DragEvent): void => {
    if (this.gestureHandlers.canDrag()) {
      event.preventDefault();
    }
  };

  private locate(event: MouseEvent): Point {
    const rect = this.element.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }
}

function readModifiers(event: MouseEvent): ModifierState {
  return { shift: event.shiftKey, ctrl: event.ctrlKey, alt: event.altKey, meta: event.metaKey };
}
