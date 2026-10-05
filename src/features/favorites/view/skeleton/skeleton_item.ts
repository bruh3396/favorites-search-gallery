import { Dimensions2D } from "@/types/geometry";
import { Layout } from "@/types/app";
import { TILE_CLASS_NAME } from "@/lib/ui/thumb/selectors";

export interface SkeletonItemConfiguration {
  layout: Layout;
  size: Dimensions2D;
}

export class FavoritesSkeletonItem {
  public readonly element: HTMLElement;

  constructor({ layout, size }: SkeletonItemConfiguration) {
    this.element = document.createElement("div");
    this.element.className = `skeleton-item ${TILE_CLASS_NAME}`;
    this.element.dataset.layout = layout;
    this.element.style.setProperty("--thumb-width", `${size.width}`);
    this.element.style.setProperty("--thumb-height", `${size.height}`);
  }
}
