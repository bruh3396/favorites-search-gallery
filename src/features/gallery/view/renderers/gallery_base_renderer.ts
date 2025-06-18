import { GALLERY_CONTAINER } from "../../ui/gallery_container";
import { Renderer } from "../../types/gallery_types";

export abstract class GalleryBaseRenderer implements Renderer {
  public readonly container: HTMLElement;

  constructor() {
    this.container = document.createElement("div");
    GALLERY_CONTAINER.appendChild(this.container);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public display(element: HTMLElement): void {
    this.container.style.display = "block";
  }

  public hide(): void {
    this.container.style.display = "none";
  }

  public abstract handlePageChange(): void;
  public abstract handlePageChangeInGallery(): void;
  public abstract preload(elements: HTMLElement[]): void;
}
