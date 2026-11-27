import { Size } from "@/core/utils/geometry/size";

const ASPECT_RATIO_PROPERTY = "--fsg-Tile-aspect-ratio";

export function setTileAspectRatio(root: HTMLElement, { width, height }: Size): void {
  if (width > 0 && height > 0 && root.style.getPropertyValue(ASPECT_RATIO_PROPERTY) === "") {
    root.style.setProperty(ASPECT_RATIO_PROPERTY, `${width} / ${height}`);
  }
}
