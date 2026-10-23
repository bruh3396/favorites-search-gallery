import { Readable, Signal } from "@/core/utils/reactive/signal";
import { onCleanup } from "@/core/utils/reactive/scope";

export class LightboxFullscreen {
  private readonly ownerDocument: Document;
  private readonly inFullscreenState: Signal<boolean>;

  constructor(ownerDocument: Document) {
    this.ownerDocument = ownerDocument;
    this.inFullscreenState = new Signal(this.hasFullscreenElement());
    const update = (): void => {
      this.inFullscreenState.value = this.hasFullscreenElement();
    };

    ownerDocument.addEventListener("fullscreenchange", update);
    onCleanup(() => ownerDocument.removeEventListener("fullscreenchange", update));
  }

  public get inFullscreen(): Readable<boolean> {
    return this.inFullscreenState;
  }

  public toggle(): void {
    if (this.hasFullscreenElement()) {
      this.exit();
    } else {
      this.ownerDocument.documentElement.requestFullscreen().catch(console.error);
    }
  }

  public exit(): void {
    if (this.hasFullscreenElement()) {
      this.ownerDocument.exitFullscreen().catch(console.error);
    }
  }

  private hasFullscreenElement(): boolean {
    return (this.ownerDocument.fullscreenElement ?? null) !== null;
  }
}
