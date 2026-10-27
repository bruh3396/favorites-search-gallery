import { Viewport } from "@/core/boundary/ports/viewport/viewport";

export class MemoryViewport implements Viewport {
  public scrollLocked = false;
  public zoomLocked = false;

  public lockScroll(): void {
    this.scrollLocked = true;
  }

  public unlockScroll(): void {
    this.scrollLocked = false;
  }

  public lockZoom(): void {
    this.zoomLocked = true;
  }
}
