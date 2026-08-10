import { ElementPool } from "@/utils/dom/element_pool";
import { Overlays } from "@/app/layout/shell";
import POST_OVERLAY_CSS from "@/assets/css/post_overlay.css";
import { PostOverlayClass } from "@/features/post_overlay/types/scaffold";
import { Preferences } from "@/app/context/preferences";
import { div } from "@/utils/dom/element_factory";
import { insertStyle } from "@/utils/dom/injector";
import { setMenuLabel } from "@/features/post_overlay/dom_tweaks/menu_label";

const pool = new ElementPool(3, createOverlayElement);

export function setup(): void {
  insertStyle(POST_OVERLAY_CSS, PostOverlayClass.overlay);
  setMenuLabel(Preferences.postOverlay.mode.value);
  pool.all.forEach(overlay => Overlays.appendChild(overlay));
}

export function getOverlay(): HTMLElement {
  return pool.next;
}

export function reveal(thumb: HTMLElement): void {
  position(pool.next, thumb);
  pool.reveal();
}

export function isVisible(): boolean {
  return pool.isVisible;
}

export function hide(): void {
  pool.hide();
}

function createOverlayElement(): HTMLDivElement {
  const overlay = div();

  overlay.className = PostOverlayClass.overlay;
  return overlay;
}

function position(overlay: HTMLElement, thumb: HTMLElement): void {
  const rect = thumb.getBoundingClientRect();

  overlay.style.left = `${rect.left + window.scrollX}px`;
  overlay.style.top = `${rect.top + window.scrollY}px`;
  overlay.style.width = `${rect.width}px`;
  overlay.style.height = `${rect.height}px`;
  overlay.style.borderRadius = getComputedStyle(thumb).borderRadius;
}
