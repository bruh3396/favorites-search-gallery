import { PostOverlayId } from "@/features/post_overlay/types/scaffold";
import { PostOverlayMode } from "@/types/ui";
import { capitalize } from "@/utils/string/format";

export function setMenuLabel(mode: PostOverlayMode): void {
  const label = document.querySelector(`#${PostOverlayId.menuCheckbox}-label span`);

  if (label === null) {
    return;
  }
  label.textContent = `${capitalize(mode)} Overlay`;
}
