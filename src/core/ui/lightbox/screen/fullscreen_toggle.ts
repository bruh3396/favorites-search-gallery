import { Readable, Signal } from "@/core/utils/reactive/signal";

export class FullscreenToggle {
  private readonly isFullscreenState = new Signal(false);

  constructor(private readonly element: HTMLElement) {
    element.addEventListener("fullscreenchange", () => {
      this.isFullscreenState.value = this.holdsFullscreen();
    });
  }

  public get isFullscreen(): Readable<boolean> {
    return this.isFullscreenState;
  }

  public toggle(): void {
    if (this.isFullscreenState.peek()) {
      this.exit();
    } else {
      this.element.requestFullscreen().catch(console.error);
    }
  }

  public exit(): void {
    if (this.holdsFullscreen()) {
      this.element.ownerDocument.exitFullscreen().catch(console.error);
    }
  }

  // The document reports a shadow host in place of its fullscreen descendant, so only the element's own root can name it.
  private holdsFullscreen(): boolean {
    return (this.element.getRootNode() as Document | ShadowRoot).fullscreenElement === this.element;
  }
}
