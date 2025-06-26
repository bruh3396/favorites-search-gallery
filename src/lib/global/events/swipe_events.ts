import { Events } from "./events";

const THRESHOLD = 90;
const TOUCH_START = { x: 0, y: 0 };
const TOUCH_END = { x: 0, y: 0 };

function getXDelta(): number {
  return TOUCH_END.x - TOUCH_START.x;
}

function getYDelta(): number {
  return TOUCH_END.y - TOUCH_START.y;
}

function swipedDown(): boolean {
  return getYDelta() > THRESHOLD;
}

function swipedUp(): boolean {
  return getYDelta() < -THRESHOLD;
}

function swipedRight(): boolean {
  return getXDelta() > THRESHOLD;
}

function swipedLeft(): boolean {
  return getXDelta() < -THRESHOLD;
}

function onlySwipedDown(): boolean {
  return swipedDown() && !swipedUp() && !swipedLeft() && !swipedRight();
}

function onlySwipedUp(): boolean {
  return swipedUp() && !swipedDown() && !swipedLeft() && !swipedRight();
}

function onlySwipedRight(): boolean {
  return swipedRight() && !swipedLeft() && !swipedUp() && !swipedDown();
}

function onlySwipedLeft(): boolean {
  return swipedLeft() && !swipedRight() && !swipedUp() && !swipedDown();
}

function setTouchStart(event: TouchEvent): void {
  TOUCH_START.x = event.changedTouches[0].screenX;
  TOUCH_START.y = event.changedTouches[0].screenY;
}

function setTouchEnd(event: TouchEvent): void {
  TOUCH_END.x = event.changedTouches[0].screenX;
  TOUCH_END.y = event.changedTouches[0].screenY;
}

function onTouchEnd(event: TouchEvent): void {
  setTouchEnd(event);

  if (onlySwipedUp()) {
    Events.mobile.swipedUp.emit();
    return;
  }

  if (onlySwipedDown()) {
    Events.mobile.swipedDown.emit();
    return;
  }

  if (onlySwipedLeft()) {
    Events.mobile.swipedLeft.emit();
    return;
  }

  if (onlySwipedRight()) {
    Events.mobile.swipedRight.emit();
  }
}

export function didSwipe(): boolean {
  return swipedDown() || swipedUp() || swipedLeft() || swipedRight();
}

export function didNotSwipe(): boolean {
  return !didSwipe();
}

export function setupSwipeEvents(): void {
  Events.document.touchStart.on(setTouchStart);
  Events.document.touchEnd.on(onTouchEnd);
}
