import { AppContext } from "@/app/context/context";
import { GalleryView } from "@/features/gallery/view/view";
import { macroTask } from "@/lib/async/scheduling";

export class GalleryTapControls {
  constructor(private readonly context: AppContext, private readonly view: GalleryView) {}

  public setup(): void {
    if (!this.context.environment.onMobileDevice) {
      return;
    }
    const tapControlContainer = document.createElement("div");
    const leftTap = document.createElement("div");
    const rightTap = document.createElement("div");

    tapControlContainer.id = "tap-control-container";
    leftTap.className = "gallery-tap-zone";
    rightTap.className = "gallery-tap-zone";
    leftTap.id = "left-mobile-tap-control";
    rightTap.id = "right-mobile-tap-control";
    tapControlContainer.appendChild(leftTap);
    tapControlContainer.appendChild(rightTap);
    this.view.appendToGallery(tapControlContainer);
    leftTap.ontouchend = async(): Promise<void> => {
      await macroTask();
      this.context.events.gallery.leftTap.emit();
    };
    rightTap.ontouchend = async(): Promise<void> => {
      await macroTask();
      this.context.events.gallery.rightTap.emit();
    };
  }
}
