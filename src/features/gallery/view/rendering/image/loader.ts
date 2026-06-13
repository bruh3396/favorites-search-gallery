import * as GalleryImageBudgeter from "@/features/gallery/view/rendering/image/budgeter";
import * as GalleryImageCache from "@/features/gallery/view/rendering/image/cache";
import * as GalleryImageFetcher from "@/features/gallery/view/rendering/image/fetcher";
import { ImageRequest } from "@/features/gallery/types/image_request";
import { LowResolutionImageRequest } from "@/features/gallery/types/low_resolution_image_request";
import { doNothing } from "@/utils/function";
import { isImageThumb } from "@/lib/media/type_predicates";
export { get, completedRequests } from "@/features/gallery/view/rendering/image/cache";

let onComplete: (request: ImageRequest) => void = doNothing;

export function setCompletionCallback(completionCallback: (request: ImageRequest) => void): void {
  onComplete = completionCallback;
}

export function load(thumbs: HTMLElement[]): ImageRequest[] {
  const { accepted, rejected } = GalleryImageBudgeter.partition(thumbs.filter(t => isImageThumb(t)));

  GalleryImageCache.sync(accepted).forEach(request => fetchBitmap(request));
  return rejected;
}

export function loadImmediate(thumb: HTMLElement): void {
  const request = new ImageRequest(thumb);

  GalleryImageCache.markLowRes(request);
  fetchBitmap(new LowResolutionImageRequest(request));
  fetchBitmap(request);
}

function onBitmapLoaded(request: ImageRequest): void {
  const cached = GalleryImageCache.get(request.id);

  if (cached === undefined || request.cancelled) {
    request.close();
    return;
  }

  if (cached.status !== "complete") {
    if (request.isHighRes) {
      GalleryImageCache.markComplete(request);
    } else {
      GalleryImageCache.markLowRes(request);
    }
    onComplete(request);
  }
}

async function fetchBitmap(request: ImageRequest): Promise<void> {
  if (!request.cancelled && await GalleryImageFetcher.fetchBitmap(request)) {
    onBitmapLoaded(request);
  }
}
