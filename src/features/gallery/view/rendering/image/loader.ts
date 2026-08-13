import * as GalleryImageBudgeter from "@/features/gallery/view/rendering/image/budgeter";
import * as GalleryImageCache from "@/features/gallery/view/rendering/image/cache";
import * as GalleryImageFetcher from "@/features/gallery/view/rendering/image/fetcher";
import { ImageRequest } from "@/features/gallery/types/image_request";
import { LowResolutionImageRequest } from "@/features/gallery/types/low_resolution_image_request";
import { doNothing } from "@/utils/function";
import { isImageThumb } from "@/lib/media/type_predicates";
export { get, completedRequests } from "@/features/gallery/view/rendering/image/cache";

let onRequestCompleted: (request: ImageRequest) => void = doNothing;

export function setCompletionCallback(onCompleted: (request: ImageRequest) => void): void {
  onRequestCompleted = onCompleted;
}

export function load(thumbs: HTMLElement[]): ImageRequest[] {
  const { accepted, rejected } = GalleryImageBudgeter.partition(thumbs.filter(t => isImageThumb(t)));

  GalleryImageCache.sync(accepted).forEach(request => runRequest(request));
  return rejected;
}

export function loadImmediate(thumb: HTMLElement): void {
  const request = new ImageRequest(thumb);

  GalleryImageCache.markLowRes(request);
  runRequest(new LowResolutionImageRequest(request));
  runRequest(request);
}

function settleRequest(request: ImageRequest): void {
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
    onRequestCompleted(request);
  }
}

async function runRequest(request: ImageRequest): Promise<void> {
  if (!request.cancelled && await GalleryImageFetcher.fetchBitmap(request)) {
    settleRequest(request);
  }
}
