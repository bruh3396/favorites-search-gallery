import { GALLERY_CONTAINER } from "../../ui/gallery_container";
import { Renderer } from "../../../types/gallery_types";

export abstract class GalleryBaseRenderer implements Renderer {
  public readonly container: HTMLElement;

  constructor() {
    this.container = document.createElement("div");
    GALLERY_CONTAINER.appendChild(this.container);
  }

  public render(element: HTMLElement): void {
    this.container.style.display = "block";
    this.render_(element);
  }

  public stopRender(): void {
    this.container.style.display = "none";
    this.stopRender_();
  }

  public abstract render_(element: HTMLElement): void;
  public abstract stopRender_(): void;
  public abstract handlePageChange(): void;
  public abstract handlePageChangeInGallery(): void;
  public abstract preload(elements: HTMLElement[]): void;
}
