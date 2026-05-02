import { Events } from "./events";

type Point = { x: number; y: number };

const THRESHOLD = 90;
const start: Point = { x: 0, y: 0 };
const end: Point = { x: 0, y: 0 };

function setTouchStart(event: TouchEvent): void {
  start.x = event.changedTouches[0].screenX;
  start.y = event.changedTouches[0].screenY;
}

function getSwipeDirection(): "up" | "down" | "left" | "right" | null {
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  if (Math.abs(dx) < THRESHOLD && Math.abs(dy) < THRESHOLD) {
    return null;
  }

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? "right" : "left";
  }
  return dy > 0 ? "down" : "up";
}

function onTouchEnd(event: TouchEvent): void {
  end.x = event.changedTouches[0].screenX;
  end.y = event.changedTouches[0].screenY;

  switch (getSwipeDirection()) {
    case "up":
      Events.mobile.swipedUp.emit();
      break;
    case "down":
      Events.mobile.swipedDown.emit();
      break;
    case "left":
      Events.mobile.swipedLeft.emit();
      break;
    case "right":
      Events.mobile.swipedRight.emit();
      break;
    default: break;
  }
}

export const didSwipe = (): boolean => getSwipeDirection() !== null;
export const didNotSwipe = (): boolean => !didSwipe();

export function setupSwipeEvents(): void {
  Events.document.touchStart.on(setTouchStart);
  Events.document.touchEnd.on(onTouchEnd);
}
