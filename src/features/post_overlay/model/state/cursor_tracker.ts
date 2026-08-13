import { EnhancedMouseEvent } from "@/lib/input/mouse_event";
import { getThumbAtPoint } from "@/lib/thumb/thumbs";

let lastCursorX = 0;
let lastCursorY = 0;

export function record(event: EnhancedMouseEvent): void {
  lastCursorX = event.originalEvent.clientX;
  lastCursorY = event.originalEvent.clientY;
}

export function thumbUnderCursor(): HTMLElement | null {
  return getThumbAtPoint(lastCursorX, lastCursorY);
}
