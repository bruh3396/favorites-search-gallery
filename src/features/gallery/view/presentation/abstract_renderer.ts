import { GalleryRoot } from "../shell/shell";

export abstract class GalleryAbstractRenderer {
  public readonly container: HTMLElement;

  constructor() {
    this.container = document.createElement("div");
    GalleryRoot.appendChild(this.container);
  }

  public render(element: HTMLElement): void {
    this.container.style.visibility = "visible";
    this.display(element);
  }

  public hide(): void {
    this.container.style.visibility = "hidden";
  }

  public abstract handlePageChangeInGallery(): void;
  public abstract handlePageChange(): void;
  public abstract preload(elements: HTMLElement[]): Promise<void> | void;
  protected abstract display(element: HTMLElement): void;
}
