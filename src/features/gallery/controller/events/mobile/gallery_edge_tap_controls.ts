import { Events } from "../../../../../lib/globals/events";
import { GALLERY_CONTAINER } from "../../../ui/gallery_container";
import { ON_DESKTOP_DEVICE } from "../../../../../lib/globals/flags";
import { yield1 } from "../../../../../utils/misc/async";

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
  GALLERY_CONTAINER.appendChild(tapControlContainer);
  leftTap.ontouchend = async(): Promise<void> => {
    await yield1();
    Events.gallery.leftTap.emit();
  };
  rightTap.ontouchend = async(): Promise<void> => {
    await yield1();
    Events.gallery.rightTap.emit();
  };
}
