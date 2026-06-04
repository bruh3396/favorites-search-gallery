import { OverlayMode } from "@/features/post_overlay/types/overlay_mode";
import { PostOverlayId } from "@/features/post_overlay/types/css_names";
import { capitalize } from "@/utils/string/format";

export function setMenuLabel(mode: OverlayMode): void {
  const label = document.querySelector(`#${PostOverlayId.menuCheckbox}-label span`);

  if (label === null) {
    return;
  }
  label.textContent = `${capitalize(mode)} Overlay`;
}
