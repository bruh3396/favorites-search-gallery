import { ElementPool } from "@/lib/ui/element_pool";

export class PostOverlayPool {
  private readonly pool: ElementPool;

  constructor(overlays: HTMLElement[]) {
    this.pool = new ElementPool(overlays.length, index => overlays[index]);
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

function position(overlay: HTMLElement, thumb: HTMLElement): void {
  const rect = thumb.getBoundingClientRect();

  overlay.style.left = `${rect.left + window.scrollX}px`;
  overlay.style.top = `${rect.top + window.scrollY}px`;
  overlay.style.width = `${rect.width}px`;
  overlay.style.height = `${rect.height}px`;
  overlay.style.borderRadius = getComputedStyle(thumb).borderRadius;
}
