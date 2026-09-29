import { getImageFromThumb, getItemsInContainer } from "@/lib/ui/thumb/query";
import { isImageLoading } from "@/utils/browser/image";

export function waitForThumbsToLoadInContainer(container: HTMLElement | Document): Promise<unknown[]> {
  const unloadedImages = getItemsInContainer(container)
    .flatMap(thumb => loadingImageOf(thumb) ?? []);
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

function loadingImageOf(thumb: HTMLElement): HTMLImageElement | null {
  const image = getImageFromThumb(thumb);

  if (image === null || image.dataset.preload === "true" || image.loading === "lazy") {
    return null;
  }
  const isAwaitingSource = thumb.dataset.loading !== undefined && !image.hasAttribute("src");
  return isImageLoading(image) || isAwaitingSource ? image : null;
}
