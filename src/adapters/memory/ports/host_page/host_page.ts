import { ColorScheme } from "@/core/boundary/environment";
import { HostPage } from "@/core/boundary/ports/host_page";

export class MemoryHostPage implements HostPage {
  public headerVisible = true;
  public colorScheme: ColorScheme = "light";
  public viewportLocked = false;
  public scrollLocked = false;

  constructor(public readonly hasHeader = false) { }

  public setHeaderVisible(visible: boolean): void {
    if (this.hasHeader) {
      this.headerVisible = visible;
    }
  }

  public setColorScheme(colorScheme: ColorScheme): void {
    this.colorScheme = colorScheme;
  }

  public clearContent(): void { }

  public lockViewport(): void {
    this.viewportLocked = true;
  }

  public lockScroll(): void {
    this.scrollLocked = true;
  }

  public unlockScroll(): void {
    this.scrollLocked = false;
  }
}
