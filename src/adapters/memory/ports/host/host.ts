import { Host } from "@/core/boundary/ports/host";

export class MemoryHost implements Host {
  public headerVisible = true;
  public viewportLocked = false;

  constructor(public readonly hasHeader = false) { }

  public setHeaderVisible(visible: boolean): void {
    if (this.hasHeader) {
      this.headerVisible = visible;
    }
  }

  public takeOver(): void { }

  public lockViewport(): void {
    this.viewportLocked = true;
  }
}
