import * as GalleryView from "@/features/gallery/view/gallery_view";
import { Events } from "@/app/channels/events";
import { ON_MOBILE_DEVICE } from "@/lib/environment";
import { macroTask } from "@/lib/async/async";

export function setup(): void {
  if (!ON_MOBILE_DEVICE) {
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
  GalleryView.appendToGallery(tapControlContainer);
  leftTap.ontouchend = async(): Promise<void> => {
    await macroTask();
    Events.gallery.leftTap.emit();
  };
  rightTap.ontouchend = async(): Promise<void> => {
    await macroTask();
    Events.gallery.rightTap.emit();
  };
}
