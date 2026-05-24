import * as GalleryView from "../view/gallery_view";
import { Events } from "../../../app/channels/events";
import { ON_MOBILE_DEVICE } from "../../../lib/environment";
import { yieldControl } from "../../../lib/async/timing";

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
    await yieldControl();
    Events.gallery.leftTap.emit();
  };
  rightTap.ontouchend = async(): Promise<void> => {
    await yieldControl();
    Events.gallery.rightTap.emit();
  };
}
