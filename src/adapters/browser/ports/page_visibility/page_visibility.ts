import { Emitter } from "@/core/utils/reactive/emitter";
import { PageVisibility } from "@/core/boundary/ports/page_visibility/page_visibility";

export class BrowserPageVisibility implements PageVisibility {
  public readonly hidden: Emitter<void>;

  constructor(document: Document) {
    this.hidden = new Emitter<void>();
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        this.hidden.emit();
      }
    });
  }
}
