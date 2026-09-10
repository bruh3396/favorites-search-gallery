import { EnhancedMouseEvent } from "@/lib/event/input";
import { getThumbAtPoint } from "@/lib/ui/thumb/query";

let lastCursorX = 0;
let lastCursorY = 0;

export function record(event: EnhancedMouseEvent): void {
  lastCursorX = event.originalEvent.clientX;
  lastCursorY = event.originalEvent.clientY;
}

export function thumbUnderCursor(): HTMLElement | null {
  return getThumbAtPoint(lastCursorX, lastCursorY);
}
