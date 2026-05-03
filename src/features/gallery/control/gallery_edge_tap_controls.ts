import { Events } from "../../../lib/communication/events";
import { GalleryRoot } from "../view/shell/gallery_shell";
import { ON_DESKTOP_DEVICE } from "../../../lib/environment/environment";
import { yieldControl } from "../../../lib/core/scheduling/promise";

export function setupGalleryMobileTapControls(): void {
  if (ON_DESKTOP_DEVICE) {
    return;
  }
  const tapControlContainer = document.createElement("div");
  const leftTap = document.createElement("div");
  const rightTap = document.createElement("div");

  tapControlContainer.id = "tap-control-container";
  leftTap.className = "mobile-tap-control";
  rightTap.className = "mobile-tap-control";
  leftTap.id = "left-mobile-tap-control";
  rightTap.id = "right-mobile-tap-control";
  tapControlContainer.appendChild(leftTap);
  tapControlContainer.appendChild(rightTap);
  GalleryRoot.appendChild(tapControlContainer);
  leftTap.ontouchend = async(): Promise<void> => {
    await yieldControl();
    Events.gallery.leftTap.emit();
  };
  rightTap.ontouchend = async(): Promise<void> => {
    await yieldControl();
    Events.gallery.rightTap.emit();
  };
}
