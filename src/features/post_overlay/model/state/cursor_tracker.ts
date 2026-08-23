import { EnhancedMouseEvent } from "@/lib/input";
import { getThumbAtPoint } from "@/lib/thumb/query";

let lastCursorX = 0;
let lastCursorY = 0;

export function record(event: EnhancedMouseEvent): void {
  lastCursorX = event.originalEvent.clientX;
  lastCursorY = event.originalEvent.clientY;
}

export function thumbUnderCursor(): HTMLElement | null {
  return getThumbAtPoint(lastCursorX, lastCursorY);
}
