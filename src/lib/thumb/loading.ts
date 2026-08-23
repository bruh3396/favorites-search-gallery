import { getImageFromThumb, getItemsInContainer } from "@/lib/thumb/query";
import { isImageLoading } from "@/utils/browser/image";

export function waitForThumbsToLoadInContainer(container: HTMLElement | Document): Promise<unknown[]> {
  const unloadedImages = getItemsInContainer(container)
    .map(thumb => getImageFromThumb(thumb))
    .filter(image => image instanceof HTMLImageElement)
    .filter(image => image.dataset.preload !== "true" && isImageLoading(image) && image.loading !== "lazy");
  return Promise.all(unloadedImages
    .map(image => new Promise(resolve => {
      image.addEventListener("load", resolve, {
        once: true
      });
      image.addEventListener("error", resolve, {
        once: true
      });
    })));
}
