import { ElementPool } from "@/lib/ui/element_pool";
import POST_OVERLAY_CSS from "@/assets/css/post_overlay.css";
import { PostOverlayClass } from "@/features/post_overlay/types/scaffold";
import { Shell } from "@/app/context/shell";
import { div } from "@/utils/browser/element";
import { insertStyle } from "@/utils/browser/injector";

export class PostOverlayElement {
  private readonly pool;

  constructor(shell: Shell) {
    insertStyle(POST_OVERLAY_CSS, PostOverlayClass.overlay);
    this.pool = new ElementPool(3, createOverlayElement);
    this.pool.all.forEach(overlay => shell.overlays.appendChild(overlay));
  }

  public getOverlay(): HTMLElement {
    return this.pool.next;
  }

  public reveal(thumb: HTMLElement): void {
    position(this.pool.next, thumb);
    this.pool.reveal();
  }

  public isVisible(): boolean {
    return this.pool.isVisible;
  }

  public hide(): void {
    this.pool.hide();
  }
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