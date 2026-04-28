import { GALLERY_ROOT } from "../../ui/gallery_shell";

export abstract class GalleryAbstractController {
  public readonly container: HTMLElement;

  constructor() {
    this.container = document.createElement("div");
    GALLERY_ROOT.appendChild(this.container);
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
  public abstract preload(elements: HTMLElement[]): void;
  protected abstract display(element: HTMLElement): void;
}
