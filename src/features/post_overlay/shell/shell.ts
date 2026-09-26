import { PostOverlayClass } from "@/features/post_overlay/types/selectors";
import { Shell } from "@/app/context/shell";
import { div } from "@/utils/browser/element";

const OVERLAY_COUNT = 3;

export class PostOverlayShell {
  public readonly overlays: HTMLElement[];

  constructor(shell: Shell) {
    this.overlays = Array.from({ length: OVERLAY_COUNT }, createOverlay);
    shell.overlays.append(...this.overlays);
  }
}

function createOverlay(): HTMLElement {
  const overlay = div();

  overlay.className = PostOverlayClass.overlay;
  return overlay;
}
