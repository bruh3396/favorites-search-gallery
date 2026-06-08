import { removeDataset, setDataset } from "@/utils/dom/attribute";
import { Overlays } from "@/app/layout/shell";
import POST_OVERLAY_CSS from "@/assets/css/post_overlay.css";
import { PostOverlayClass } from "@/features/post_overlay/types/scaffold";
import { Preferences } from "@/app/context/preferences";
import { insertStyle } from "@/utils/dom/injector";
import { setMenuLabel } from "@/features/post_overlay/dom_tweaks/menu_label";

const OVERLAY_POOL_SIZE = 3;
const overlays: HTMLElement[] = [];
let visibleIndex = 0;

export function setup(): void {
  insertStyle(POST_OVERLAY_CSS, PostOverlayClass.overlay);
  setMenuLabel(Preferences.postOverlayMode.value);

  for (let i = 0; i < OVERLAY_POOL_SIZE; i += 1) {
    const overlay = document.createElement("div");

    overlay.className = PostOverlayClass.overlay;
    Overlays.appendChild(overlay);
    overlays.push(overlay);
  }
}

export function getOverlay(): HTMLElement {
  return overlays[nextIndex()];
}

export function reveal(thumb: HTMLElement): void {
  const currentlyShown = overlays[visibleIndex];
  const nextToShow = overlays[nextIndex()];

  position(nextToShow, thumb);
  removeDataset(currentlyShown, "visible");
  setDataset(nextToShow, "visible");
  visibleIndex = nextIndex();
}

export function isVisible(): boolean {
  return overlays[visibleIndex]?.dataset.visible !== undefined;
}

export function hide(): void {
  for (const overlay of overlays) {
    removeDataset(overlay, "visible");
  }
}

function position(overlay: HTMLElement, thumb: HTMLElement): void {
  const rect = thumb.getBoundingClientRect();

  overlay.style.left = `${rect.left + window.scrollX}px`;
  overlay.style.top = `${rect.top + window.scrollY}px`;
  overlay.style.width = `${rect.width}px`;
  overlay.style.height = `${rect.height}px`;
  overlay.style.borderRadius = getComputedStyle(thumb).borderRadius;
}

function nextIndex(): number {
  return (visibleIndex + 1) % overlays.length;
}
