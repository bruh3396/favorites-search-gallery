import { Host } from "@/core/boundary/ports/host";

export class MemoryHost implements Host {
  public readonly setHeaderVisible: ((visible: boolean) => void) | null;
  public headerVisible = true;
  public viewportLocked = false;

  constructor(hasHeader = false) {
    this.setHeaderVisible = hasHeader ? (visible): void => {
      this.headerVisible = visible;
    } : null;
  }

  public takeOver(): void { }

  public lockViewport(): void {
    this.viewportLocked = true;
  }
}
