import { Readable, Signal } from "@/core/utils/reactive/signal";
import { onCleanup } from "@/core/utils/reactive/scope";

export interface ModifierState {
  readonly shift: boolean;
  readonly ctrl: boolean;
  readonly alt: boolean;
  readonly meta: boolean;
}

export interface GesturePoint {
  readonly x: number;
  readonly y: number;
}

export interface TapGesture {
  readonly point: GesturePoint;
  readonly modifiers: ModifierState;
}

export interface DragGesture {
  readonly point: GesturePoint;
  readonly delta: GesturePoint;
}

export interface WheelGesture {
  readonly point: GesturePoint;
  readonly delta: GesturePoint;
  readonly modifiers: ModifierState;
}

export interface GestureHandlers {
  canDrag(): boolean;
  onTap(gesture: TapGesture): void;
  onDrag(gesture: DragGesture): void;
  onWheel(gesture: WheelGesture): boolean;
}

export interface GesturesConfiguration {
  readonly dragThreshold: number;
}

export interface GesturesDependencies {
  element: HTMLElement;
  handlers: GestureHandlers;
}

interface MutablePress {
  readonly pointerId: number;
  readonly start: GesturePoint;
  last: GesturePoint;
  moved: boolean;
  readonly canDrag: boolean;
}

export class Gestures {
  private readonly isDraggingState = new Signal(false);
  private readonly hoverPointState = new Signal<GesturePoint | undefined>(undefined);
  private readonly dragThreshold: number;
  private readonly element: HTMLElement;
  private readonly handlers: GestureHandlers;
  private press: MutablePress | undefined;

  constructor(configuration: GesturesConfiguration, dependencies: GesturesDependencies) {
    this.dragThreshold = configuration.dragThreshold;
    this.element = dependencies.element;
    this.handlers = dependencies.handlers;
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

  public get hoverPoint(): Readable<GesturePoint | undefined> {
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
    const canDrag = this.handlers.canDrag();

    this.press = { pointerId: event.pointerId, start: point, last: point, moved: false, canDrag };

    if (canDrag) {
      this.element.setPointerCapture(event.pointerId);
    }
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    const press = this.press;
    const point = this.locate(event);

    this.hoverPointState.value = point;

    if (press?.pointerId !== event.pointerId) {
      return;
    }

    if (press.canDrag) {
      this.handlers.onDrag({ point, delta: { x: point.x - press.last.x, y: point.y - press.last.y } });
    }
    press.last = point;
    press.moved ||= Math.hypot(point.x - press.start.x, point.y - press.start.y) > this.dragThreshold;

    if (press.canDrag && press.moved) {
      this.isDraggingState.value = true;
    }
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    const press = this.press;

    if (press?.pointerId !== event.pointerId) {
      return;
    }
    this.endPress();

    if (!press.moved) {
      this.handlers.onTap({ point: this.locate(event), modifiers: readModifiers(event) });
    }
  };

  private readonly onPointerLeave = (): void => {
    this.hoverPointState.value = undefined;
  };

  private readonly endPress = (): void => {
    this.press = undefined;
    this.isDraggingState.value = false;
  };

  private readonly onWheel = (event: WheelEvent): void => {
    if (this.handlers.onWheel({ point: this.locate(event), delta: { x: event.deltaX, y: event.deltaY }, modifiers: readModifiers(event) })) {
      event.preventDefault();
    }
  };

  private readonly onDragStart = (event: DragEvent): void => {
    if (this.handlers.canDrag()) {
      event.preventDefault();
    }
  };

  private locate(event: MouseEvent): GesturePoint {
    const rect = this.element.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }
}

function readModifiers(event: MouseEvent): ModifierState {
  return { shift: event.shiftKey, ctrl: event.ctrlKey, alt: event.altKey, meta: event.metaKey };
}
