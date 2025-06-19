import { ClickCodes } from "../primitives/enums";

export function convertTouchEventToMouseEvent(touchEvent: TouchEvent, type: string): MouseEvent {
  const touch = touchEvent.changedTouches[0];
  return new MouseEvent(type, {
    clientX: touch.clientX,
    clientY: touch.clientY,
    screenX: touch.screenX,
    screenY: touch.screenY,
    button: ClickCodes.LEFT
  });
}
