import { EnhancedMouseEvent } from "@/lib/event/input";
import { getThumbAtPoint } from "@/lib/ui/thumb/query";

export class PostOverlayCursorTracker {
  private lastCursorX = 0;
  private lastCursorY = 0;

  public record(event: EnhancedMouseEvent): void {
    this.lastCursorX = event.originalEvent.clientX;
    this.lastCursorY = event.originalEvent.clientY;
  }

  public thumbUnderCursor(): HTMLElement | null {
    return getThumbAtPoint(this.lastCursorX, this.lastCursorY);
  }
}
